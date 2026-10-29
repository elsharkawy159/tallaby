import { db, eq, sellerNotifications, sellerWelcomeGifts, sql } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { STORE_WALLET_REFERENCE_TYPES, postStoreWalletEntry, postStoreWalletEntryOnce } from "@workspace/db/wallet";
import {
  WELCOME_GIFT_DAYS,
  WELCOME_GIFT_PIASTRES,
  WELCOME_GIFT_REMINDER_DAYS,
  giftDebtClearedPiastres,
  giftExpiryDebitPiastres,
  giftFromPiastres,
  giftRemainingPiastres,
  giftToPiastres,
} from "./welcome-gift.lib";

/**
 * The EGP 100 welcome gift (0119, docs/superpowers/specs/2026-10-29-welcome-gift-design.md).
 * Server-only. Every function takes the seller id from the caller's session
 * (or the daily job); nothing here trusts an id sent by a client.
 *
 * Money moves only through postStoreWalletEntry with the claims
 * welcome_gift:<seller> (+100.00) and welcome_gift_expiry:<seller> (the
 * unspent part), so a replay never pays or takes twice. The gift row's
 * primary key is the second one-gift guarantee.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const rowsOf = (result: unknown) => [...(result as Iterable<Record<string, unknown>>)];

/**
 * The published store that finished the seller's setup, or null: a store of
 * this seller that is live, whose template the seller chose themselves (an
 * install by the seller that was not undone; an admin publish or theme change
 * never counts), while the seller has an active product.
 */
async function setupStoreId(q: Queryable, sellerId: string): Promise<string | null> {
  const [row] = rowsOf(
    await q.execute(sql`
      SELECT st.id
        FROM stores st
       WHERE st.seller_id = ${sellerId}
         AND st.deleted_at IS NULL
         AND st.site_status = 'published'
         AND EXISTS (
           SELECT 1 FROM template_installs ti
            WHERE ti.store_id = st.id AND ti.undone_at IS NULL AND ti.installed_by = ${sellerId}
         )
         AND EXISTS (SELECT 1 FROM products p WHERE p.seller_id = ${sellerId} AND p.status = 'active')
       ORDER BY st.first_published_at NULLS LAST, st.created_at
       LIMIT 1
    `),
  );
  return row ? String(row.id) : null;
}

/** A seller bell row; in a savepoint so the bell never blocks the money. */
async function notify(
  tx: Tx,
  sellerId: string,
  type: "welcome_gift_granted" | "welcome_gift_expiring" | "welcome_gift_expired",
  amount: string,
): Promise<void> {
  try {
    await tx.transaction(async (sp) => {
      await sp
        .insert(sellerNotifications)
        .values({ sellerId, type, data: { amount }, dedupeKey: `${type}:${sellerId}` })
        .onConflictDoNothing();
    });
  } catch (error) {
    logServerError("wallet", "welcome gift notification failed", { sellerId, type }, error);
  }
}

export type GrantWelcomeGiftResult = { granted: boolean };

/**
 * Grants the gift if the seller is eligible (a new seller, 0119), has none
 * yet, and has finished setup. Safe to call any time and any number of times.
 * Throws only on a database or wallet error (e.g. a frozen wallet), in which
 * case nothing is written; callers that must not fail use grantWelcomeGiftSafely.
 */
export async function grantWelcomeGiftIfEligible(sellerId: string, q: typeof db = db): Promise<GrantWelcomeGiftResult> {
  return q.transaction(async (tx) => {
    const [seller] = rowsOf(
      await tx.execute(sql`
        SELECT s.welcome_gift_eligible AS eligible,
               EXISTS (SELECT 1 FROM seller_welcome_gifts g WHERE g.seller_id = s.id) AS has_gift
          FROM sellers s
         WHERE s.id = ${sellerId}
         FOR UPDATE OF s
      `),
    );
    if (!seller || seller.eligible !== true || seller.has_gift === true) return { granted: false };

    const storeId = await setupStoreId(tx, sellerId);
    if (!storeId) return { granted: false };

    const amount = giftFromPiastres(WELCOME_GIFT_PIASTRES);
    const inserted = await tx
      .insert(sellerWelcomeGifts)
      .values({
        sellerId,
        storeId,
        amount,
        expiresAt: sql`now() + make_interval(days => ${WELCOME_GIFT_DAYS})`,
      })
      .onConflictDoNothing()
      .returning({ sellerId: sellerWelcomeGifts.sellerId });
    if (!inserted.length) return { granted: false };

    const entry = await postStoreWalletEntry(tx, {
      sellerId,
      type: "adjustment",
      amount,
      referenceType: STORE_WALLET_REFERENCE_TYPES.welcomeGift,
      referenceId: sellerId,
      storeId,
      description: "Welcome gift",
      metadata: { reason: "welcome_gift", days: WELCOME_GIFT_DAYS },
    });

    await tx
      .update(sellerWelcomeGifts)
      .set({
        walletEntryId: entry.entryId,
        debtCleared: giftFromPiastres(giftDebtClearedPiastres(giftToPiastres(entry.balanceBefore))),
      })
      .where(eq(sellerWelcomeGifts.sellerId, sellerId));

    await notify(tx, sellerId, "welcome_gift_granted", amount);
    return { granted: true };
  });
}

/** grantWelcomeGiftIfEligible that never throws: for publish, product saves and page loads. */
export async function grantWelcomeGiftSafely(sellerId: string): Promise<boolean> {
  try {
    return (await grantWelcomeGiftIfEligible(sellerId)).granted;
  } catch (error) {
    // The daily job retries it.
    logServerError("wallet", "welcome gift grant failed", { sellerId }, error);
    return false;
  }
}

/** The signed sum of the entries that spend the gift, posted since it was granted. */
async function chargesSinceGrant(q: Queryable, sellerId: string, grantedAt: string): Promise<number> {
  const [row] = rowsOf(
    await q.execute(sql`
      SELECT coalesce(sum(t.amount), 0)::text AS total
        FROM wallet_transactions t
       WHERE t.seller_id = ${sellerId}
         AND t.created_at >= ${grantedAt}::timestamptz
         AND (
           t.type IN ('fee', 'fee_reversal', 'service_charge')
           OR (t.type = 'adjustment' AND t.reference_type = 'ad_request')
         )
    `),
  );
  return giftToPiastres(String(row?.total ?? "0"));
}

export type WelcomeGiftStatus = {
  amount: string;
  remaining: string;
  grantedAt: string;
  expiresAt: string;
  expired: boolean;
  expiredAmount: string | null;
};

/** The seller's gift for the wallet page, or null. Never cached (wallet data). */
export async function getWelcomeGiftStatus(sellerId: string, q: Queryable = db): Promise<WelcomeGiftStatus | null> {
  const [gift] = await q.select().from(sellerWelcomeGifts).where(eq(sellerWelcomeGifts.sellerId, sellerId)).limit(1);
  if (!gift) return null;
  const remaining = gift.expiredAt
    ? 0
    : giftRemainingPiastres({
        giftPiastres: giftToPiastres(gift.amount),
        debtClearedPiastres: giftToPiastres(gift.debtCleared),
        chargesNetPiastres: await chargesSinceGrant(q, sellerId, gift.grantedAt),
      });
  return {
    amount: gift.amount,
    remaining: giftFromPiastres(remaining),
    grantedAt: gift.grantedAt,
    expiresAt: gift.expiresAt,
    expired: Boolean(gift.expiredAt),
    expiredAmount: gift.expiredAmount,
  };
}

export type WelcomeGiftWatch =
  /** Not a new seller, or the popup was already seen: nothing to do. */
  | { state: "none" }
  /** A new seller who has not finished setup yet: the dashboard checks again as they go. */
  | { state: "pending" }
  /** Granted and the popup not seen yet. */
  | { state: "unseen"; amount: string; expiresAt: string };

/** What the dashboard should do about the gift popup for this seller (one small read). */
export async function getWelcomeGiftWatch(sellerId: string, q: Queryable = db): Promise<WelcomeGiftWatch> {
  const [row] = rowsOf(
    await q.execute(sql`
      SELECT s.welcome_gift_eligible AS eligible, g.seller_id AS gift, g.amount::text AS amount,
             g.expires_at::text AS expires_at, g.popup_seen_at, g.expired_at
        FROM sellers s
        LEFT JOIN seller_welcome_gifts g ON g.seller_id = s.id
       WHERE s.id = ${sellerId}
    `),
  );
  if (!row || row.eligible !== true) return { state: "none" };
  if (!row.gift) return { state: "pending" };
  if (row.popup_seen_at || row.expired_at) return { state: "none" };
  return { state: "unseen", amount: String(row.amount), expiresAt: String(row.expires_at) };
}

/**
 * The dashboard's check: grants the gift if setup is now complete, then says
 * whether to show the popup. Called on page changes while the state is "pending".
 */
export async function checkWelcomeGift(sellerId: string): Promise<WelcomeGiftWatch> {
  const watch = await getWelcomeGiftWatch(sellerId);
  if (watch.state !== "pending") return watch;
  if (!(await grantWelcomeGiftSafely(sellerId))) return watch;
  return getWelcomeGiftWatch(sellerId);
}

/** The seller closed the popup: never show it again (only this seller's row). */
export async function markWelcomeGiftPopupSeen(sellerId: string, q: Queryable = db): Promise<void> {
  await q
    .update(sellerWelcomeGifts)
    .set({ popupSeenAt: sql`coalesce(${sellerWelcomeGifts.popupSeenAt}, now())` })
    .where(eq(sellerWelcomeGifts.sellerId, sellerId));
}

export type ExpireWelcomeGiftResult = "expired" | "not_due";

/**
 * Takes back the unspent part of a due gift and closes it. Idempotent: the
 * expiry claim stops a second debit, and a closed gift is skipped.
 */
export async function expireWelcomeGift(sellerId: string, q: typeof db = db): Promise<ExpireWelcomeGiftResult> {
  return q.transaction(async (tx) => {
    const [gift] = await tx
      .select()
      .from(sellerWelcomeGifts)
      .where(
        sql`${sellerWelcomeGifts.sellerId} = ${sellerId} AND ${sellerWelcomeGifts.expiredAt} IS NULL AND ${sellerWelcomeGifts.expiresAt} <= now()`,
      )
      .for("update");
    if (!gift) return "not_due";

    // Lock the balance so a fee posted meanwhile cannot make the debit wrong.
    const [wallet] = rowsOf(
      await tx.execute(sql`SELECT balance::text AS balance FROM seller_wallet WHERE seller_id = ${sellerId} FOR UPDATE`),
    );
    const remaining = giftRemainingPiastres({
      giftPiastres: giftToPiastres(gift.amount),
      debtClearedPiastres: giftToPiastres(gift.debtCleared),
      chargesNetPiastres: await chargesSinceGrant(tx, sellerId, gift.grantedAt),
    });
    const debit = giftExpiryDebitPiastres({
      remainingPiastres: remaining,
      balancePiastres: giftToPiastres(String(wallet?.balance ?? "0")),
    });

    let entryId: string | null = null;
    if (debit > 0) {
      const entry = await postStoreWalletEntryOnce(tx, {
        sellerId,
        type: "adjustment",
        amount: `-${giftFromPiastres(debit)}`,
        referenceType: STORE_WALLET_REFERENCE_TYPES.welcomeGiftExpiry,
        referenceId: sellerId,
        storeId: gift.storeId,
        description: "Welcome gift expired",
        metadata: { reason: "welcome_gift_expired", remaining: giftFromPiastres(remaining) },
      });
      entryId = entry?.entryId ?? null;
    }

    await tx
      .update(sellerWelcomeGifts)
      .set({ expiredAt: sql`now()`, expiredAmount: giftFromPiastres(debit), expiryEntryId: entryId })
      .where(eq(sellerWelcomeGifts.sellerId, sellerId));
    // Nothing to say when the gift was fully spent.
    if (debit > 0) await notify(tx, sellerId, "welcome_gift_expired", giftFromPiastres(debit));
    return "expired";
  });
}

/** Bell reminder a few days before expiry, once, only while something is left. */
async function remindWelcomeGift(sellerId: string, q: typeof db = db): Promise<boolean> {
  return q.transaction(async (tx) => {
    const [gift] = await tx
      .select()
      .from(sellerWelcomeGifts)
      .where(
        sql`${sellerWelcomeGifts.sellerId} = ${sellerId} AND ${sellerWelcomeGifts.expiredAt} IS NULL AND ${sellerWelcomeGifts.remindedAt} IS NULL`,
      )
      .for("update");
    if (!gift) return false;
    const remaining = giftRemainingPiastres({
      giftPiastres: giftToPiastres(gift.amount),
      debtClearedPiastres: giftToPiastres(gift.debtCleared),
      chargesNetPiastres: await chargesSinceGrant(tx, sellerId, gift.grantedAt),
    });
    await tx.update(sellerWelcomeGifts).set({ remindedAt: sql`now()` }).where(eq(sellerWelcomeGifts.sellerId, sellerId));
    if (remaining <= 0) return false;
    await notify(tx, sellerId, "welcome_gift_expiring", giftFromPiastres(remaining));
    return true;
  });
}

export type WelcomeGiftJobSummary = { granted: number; reminded: number; expired: number; errors: number };

/**
 * The daily job: grants gifts that were missed (setup finished through import,
 * bulk edit or AI, or a grant that failed), sends the reminders and expires due
 * gifts. Each seller runs in its own transaction, so one failure never stops
 * the rest, and a re-run is harmless.
 */
export async function runWelcomeGiftJob(q: typeof db = db): Promise<WelcomeGiftJobSummary> {
  const summary: WelcomeGiftJobSummary = { granted: 0, reminded: 0, expired: 0, errors: 0 };

  const missed = rowsOf(
    await q.execute(sql`
      SELECT s.id FROM sellers s
       WHERE s.welcome_gift_eligible
         AND NOT EXISTS (SELECT 1 FROM seller_welcome_gifts g WHERE g.seller_id = s.id)
         AND EXISTS (SELECT 1 FROM stores st WHERE st.seller_id = s.id AND st.deleted_at IS NULL AND st.site_status = 'published')
    `),
  );
  for (const row of missed) {
    const sellerId = String(row.id);
    try {
      if ((await grantWelcomeGiftIfEligible(sellerId, q)).granted) summary.granted++;
    } catch (error) {
      summary.errors++;
      logServerError("wallet", "welcome gift job grant failed", { sellerId }, error);
    }
  }

  const dueSoon = rowsOf(
    await q.execute(sql`
      SELECT seller_id FROM seller_welcome_gifts
       WHERE expired_at IS NULL AND reminded_at IS NULL
         AND expires_at > now() AND expires_at <= now() + make_interval(days => ${WELCOME_GIFT_REMINDER_DAYS})
    `),
  );
  for (const row of dueSoon) {
    const sellerId = String(row.seller_id);
    try {
      if (await remindWelcomeGift(sellerId, q)) summary.reminded++;
    } catch (error) {
      summary.errors++;
      logServerError("wallet", "welcome gift reminder failed", { sellerId }, error);
    }
  }

  const due = rowsOf(
    await q.execute(sql`SELECT seller_id FROM seller_welcome_gifts WHERE expired_at IS NULL AND expires_at <= now()`),
  );
  for (const row of due) {
    const sellerId = String(row.seller_id);
    try {
      if ((await expireWelcomeGift(sellerId, q)) === "expired") summary.expired++;
    } catch (error) {
      summary.errors++;
      logServerError("wallet", "welcome gift expiry failed", { sellerId }, error);
    }
  }
  return summary;
}
