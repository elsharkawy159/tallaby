/**
 * Affiliate program, server side (ROADMAP.md F-37, 0117). Server-only.
 *
 * - `postReferralCommission` runs inside the transaction that marks a store
 *   top-up succeeded (Kashier webhook and admin-approved manual top-up), so a
 *   commission is never missed and never doubled (unique `top_up_id`).
 * - Seller-facing reads and the withdrawal request always take the seller id
 *   from the session (requireSeller), never from the client.
 * - Nothing here touches a wallet table.
 */
import { and, db, eq, isNull, referralCommissions, referralPayouts, sellers, sellerNotifications, sql } from "@workspace/db";
import {
  REFERRAL_UNLOCK_REFERRALS,
  REFERRAL_UNLOCK_STORES,
  availablePiastres,
  commissionPiastres,
  fromPiastres,
  generateReferralCode,
  isUnlocked,
  maskDestination,
  normalizeEgyptianPhone,
  normalizeReferralCode,
  payoutRequestSchema,
  toPiastres,
  withdrawBlockReason,
  type PayoutDestination,
  type WithdrawBlockReason,
} from "./referrals.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.code;
}

// ---------------------------------------------------------------------------
// Attribution
// ---------------------------------------------------------------------------

/**
 * The referrer for a seller account being created, or null. Unknown codes,
 * the user's own account and a referrer with the same phone are ignored (the
 * account is still created, just without a referrer).
 */
export async function resolveReferrerForSignup(
  q: Queryable,
  input: { referralCode: unknown; userId: string; phone: string },
): Promise<string | null> {
  const code = normalizeReferralCode(input.referralCode);
  if (!code) return null;
  const [referrer] = await q
    .select({ id: sellers.id, phone: sellers.supportPhone })
    .from(sellers)
    .where(eq(sellers.referralCode, code))
    .limit(1);
  if (!referrer || referrer.id === input.userId) return null;
  if (referrer.phone && normalizeEgyptianPhone(referrer.phone) === normalizeEgyptianPhone(input.phone)) return null;
  return referrer.id;
}

// ---------------------------------------------------------------------------
// Commissions
// ---------------------------------------------------------------------------

/**
 * Records the referrer's 20 % of a top-up that was just marked succeeded in
 * `tx`. No-op for sellers nobody referred. Idempotent on `top_up_id`.
 */
export async function postReferralCommission(
  tx: Tx,
  topUp: { id: string; sellerId: string; amount: string },
): Promise<{ posted: boolean }> {
  const [seller] = await tx
    .select({ referrerId: sellers.referredBySellerId, excludedAt: sellers.referralExcludedAt })
    .from(sellers)
    .where(eq(sellers.id, topUp.sellerId))
    .limit(1);
  const referrerId = seller?.referrerId;
  // An account an admin excluded as fake earns its referrer nothing more.
  if (!referrerId || seller.excludedAt) return { posted: false };

  const amount = fromPiastres(commissionPiastres(topUp.amount));
  const inserted = await tx
    .insert(referralCommissions)
    .values({
      referrerSellerId: referrerId,
      referredSellerId: topUp.sellerId,
      topUpId: topUp.id,
      topUpAmount: topUp.amount,
      amount,
    })
    .onConflictDoNothing({ target: referralCommissions.topUpId })
    .returning({ id: referralCommissions.id });
  if (!inserted.length) return { posted: false };

  await refreshReferralUnlock(tx, referrerId);
  await notifyCommissionEarned(tx, referrerId, amount);
  return { posted: true };
}

/**
 * One bell row per referrer per Cairo day, counting the commissions and
 * adding their amounts. In a savepoint: the bell never blocks a top-up.
 */
async function notifyCommissionEarned(tx: Tx, referrerId: string, amount: string): Promise<void> {
  try {
    await tx.transaction(async (sp) => {
      await sp.execute(sql`
        INSERT INTO seller_notifications (seller_id, type, data, dedupe_key)
        VALUES (
          ${referrerId}, 'referral_commission_earned',
          jsonb_build_object('count', 1, 'amount', ${amount}::numeric(10,2)::text),
          'referral_commission_earned:' || to_char(now() AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD')
        )
        ON CONFLICT (seller_id, dedupe_key) DO UPDATE SET
          data = jsonb_build_object(
            'count', coalesce((seller_notifications.data->>'count')::int, 1) + 1,
            'amount', (coalesce((seller_notifications.data->>'amount')::numeric, 0) + ${amount}::numeric)::numeric(10,2)::text
          ),
          read_at = NULL,
          created_at = now()
      `);
    });
  } catch (error) {
    console.error("[referrals] commission notification failed", error);
  }
}

/** Successful referrals and their live stores, excluding accounts an admin marked fake. */
export async function getReferralCounts(
  q: Queryable,
  referrerId: string,
): Promise<{ successfulReferrals: number; stores: number }> {
  const result = await q.execute<{ referrals: number; stores: number }>(sql`
    SELECT
      (SELECT count(*)::int FROM sellers r
        WHERE r.referred_by_seller_id = ${referrerId} AND r.referral_excluded_at IS NULL
          AND EXISTS (SELECT 1 FROM seller_wallet_top_ups t WHERE t.seller_id = r.id AND t.status = 'succeeded')
      ) AS referrals,
      (SELECT count(*)::int FROM stores st JOIN sellers r ON r.id = st.seller_id
        WHERE r.referred_by_seller_id = ${referrerId} AND r.referral_excluded_at IS NULL AND st.deleted_at IS NULL
      ) AS stores
  `);
  const row = (result as unknown as { referrals: number; stores: number }[])[0];
  return { successfulReferrals: Number(row?.referrals ?? 0), stores: Number(row?.stores ?? 0) };
}

/** Sets `referral_unlocked_at` once both counts reach 10. Returns the unlock state. */
export async function refreshReferralUnlock(q: Queryable, referrerId: string): Promise<boolean> {
  const [seller] = await q
    .select({ unlockedAt: sellers.referralUnlockedAt })
    .from(sellers)
    .where(eq(sellers.id, referrerId))
    .limit(1);
  if (!seller) return false;
  if (seller.unlockedAt) return true;
  const counts = await getReferralCounts(q, referrerId);
  if (!isUnlocked({ ...counts, unlockedAt: null })) return false;
  await q
    .update(sellers)
    .set({ referralUnlockedAt: sql`now()` })
    .where(and(eq(sellers.id, referrerId), isNull(sellers.referralUnlockedAt)));
  return true;
}

// ---------------------------------------------------------------------------
// Seller page (/earn)
// ---------------------------------------------------------------------------

/** The seller's share code, created on first use (retries a rare collision). */
export async function getOrCreateReferralCode(sellerId: string, q: Queryable = db): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const [row] = await q.select({ code: sellers.referralCode }).from(sellers).where(eq(sellers.id, sellerId)).limit(1);
    if (!row) return null;
    if (row.code) return row.code;
    try {
      await q
        .update(sellers)
        .set({ referralCode: generateReferralCode() })
        .where(and(eq(sellers.id, sellerId), isNull(sellers.referralCode)));
    } catch (error) {
      if (pgCode(error) !== "23505") throw error;
    }
  }
  throw new Error("Could not create a referral code");
}

export type ReferralRow = {
  storeName: string | null;
  signedUpAt: string | null;
  stores: number;
  toppedUp: string;
  commission: string;
};

export type ReferralPayoutView = {
  id: string;
  amount: string;
  method: PayoutDestination["method"];
  destination: string;
  status: "requested" | "paid" | "rejected";
  reference: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type ReferralOverview = {
  code: string;
  earned: string;
  paid: string;
  available: string;
  counts: { successfulReferrals: number; stores: number };
  goals: { referrals: number; stores: number };
  unlocked: boolean;
  blockReason: WithdrawBlockReason | null;
  openPayout: ReferralPayoutView | null;
  payouts: ReferralPayoutView[];
  referrals: ReferralRow[];
};

async function balances(q: Queryable, sellerId: string) {
  const result = await q.execute<{ earned: string; paid: string; requested: string }>(sql`
    SELECT
      coalesce((SELECT sum(amount) FROM referral_commissions WHERE referrer_seller_id = ${sellerId} AND status = 'earned'), 0)::text AS earned,
      coalesce((SELECT sum(amount) FROM referral_payouts WHERE referrer_seller_id = ${sellerId} AND status = 'paid'), 0)::text AS paid,
      coalesce((SELECT sum(amount) FROM referral_payouts WHERE referrer_seller_id = ${sellerId} AND status = 'requested'), 0)::text AS requested
  `);
  const row = (result as unknown as { earned: string; paid: string; requested: string }[])[0]!;
  const earned = toPiastres(row.earned);
  const paid = toPiastres(row.paid);
  const requested = toPiastres(row.requested);
  return { earned, paid, requested, available: availablePiastres({ earned, requestedOrPaid: paid + requested }) };
}

function toPayoutView(row: typeof referralPayouts.$inferSelect): ReferralPayoutView {
  const parsed = payoutRequestSchema.safeParse(row.destination);
  return {
    id: row.id,
    amount: row.amount,
    method: row.method as PayoutDestination["method"],
    destination: parsed.success ? maskDestination(parsed.data) : "",
    status: row.status as ReferralPayoutView["status"],
    reference: row.reference,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
  };
}

export async function getReferralOverview(sellerId: string, q: Queryable = db): Promise<ReferralOverview | null> {
  const code = await getOrCreateReferralCode(sellerId, q);
  if (!code) return null;
  const [seller] = await q
    .select({ status: sellers.status, unlockedAt: sellers.referralUnlockedAt })
    .from(sellers)
    .where(eq(sellers.id, sellerId))
    .limit(1);
  if (!seller) return null;

  const [money, counts, payoutRows, referralRows] = await Promise.all([
    balances(q, sellerId),
    getReferralCounts(q, sellerId),
    q
      .select()
      .from(referralPayouts)
      .where(eq(referralPayouts.referrerSellerId, sellerId))
      .orderBy(sql`${referralPayouts.createdAt} DESC`)
      .limit(20),
    q.execute<{ store_name: string | null; signed_up_at: string | null; stores: number; topped_up: string; commission: string }>(sql`
      SELECT
        (SELECT st.name FROM stores st WHERE st.seller_id = r.id AND st.deleted_at IS NULL
          ORDER BY st.is_primary DESC, st.created_at ASC LIMIT 1) AS store_name,
        coalesce(r.referred_at, r.created_at)::text AS signed_up_at,
        (SELECT count(*)::int FROM stores st WHERE st.seller_id = r.id AND st.deleted_at IS NULL) AS stores,
        coalesce((SELECT sum(t.amount) FROM seller_wallet_top_ups t WHERE t.seller_id = r.id AND t.status = 'succeeded'), 0)::text AS topped_up,
        coalesce((SELECT sum(c.amount) FROM referral_commissions c
          WHERE c.referred_seller_id = r.id AND c.referrer_seller_id = ${sellerId} AND c.status = 'earned'), 0)::text AS commission
      FROM sellers r
      WHERE r.referred_by_seller_id = ${sellerId}
      ORDER BY coalesce(r.referred_at, r.created_at) DESC
      LIMIT 200
    `),
  ]);

  // An unlock earned before the last change of counts sticks; refresh it here too.
  const unlocked = seller.unlockedAt ? true : await refreshReferralUnlock(q, sellerId);
  const payouts = payoutRows.map(toPayoutView);
  const openPayout = payouts.find((p) => p.status === "requested") ?? null;

  return {
    code,
    earned: fromPiastres(money.earned),
    paid: fromPiastres(money.paid),
    available: fromPiastres(money.available),
    counts,
    goals: { referrals: REFERRAL_UNLOCK_REFERRALS, stores: REFERRAL_UNLOCK_STORES },
    unlocked,
    blockReason: withdrawBlockReason({
      unlocked,
      available: money.available,
      hasOpenRequest: Boolean(openPayout),
      sellerStatus: seller.status ?? "pending",
    }),
    openPayout,
    payouts,
    referrals: (referralRows as unknown as { store_name: string | null; signed_up_at: string | null; stores: number; topped_up: string; commission: string }[]).map(
      (r) => ({
        storeName: r.store_name,
        signedUpAt: r.signed_up_at,
        stores: Number(r.stores),
        toppedUp: fromPiastres(toPiastres(r.topped_up)),
        commission: fromPiastres(toPiastres(r.commission)),
      }),
    ),
  };
}

export type RequestPayoutError = WithdrawBlockReason | "invalid_input" | "not_found";

/**
 * Asks for the whole available balance. One transaction with the seller row
 * locked, so two clicks cannot both pass the checks; the partial unique index
 * is the backstop.
 */
export async function requestReferralPayout(
  sellerId: string,
  input: unknown,
  q: Queryable = db,
): Promise<{ success: true; amount: string } | { success: false; error: RequestPayoutError }> {
  const parsed = payoutRequestSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };

  try {
    return await q.transaction(async (tx) => {
      const [seller] = await tx
        .select({ status: sellers.status, unlockedAt: sellers.referralUnlockedAt })
        .from(sellers)
        .where(eq(sellers.id, sellerId))
        .for("update");
      if (!seller) return { success: false as const, error: "not_found" as const };

      const unlocked = seller.unlockedAt ? true : await refreshReferralUnlock(tx, sellerId);
      const money = await balances(tx, sellerId);
      const block = withdrawBlockReason({
        unlocked,
        available: money.available,
        hasOpenRequest: money.requested > 0,
        sellerStatus: seller.status ?? "pending",
      });
      if (block) return { success: false as const, error: block };

      const amount = fromPiastres(money.available);
      await tx.insert(referralPayouts).values({
        referrerSellerId: sellerId,
        amount,
        method: parsed.data.method,
        destination: parsed.data as unknown as Record<string, unknown>,
      });
      return { success: true as const, amount };
    });
  } catch (error) {
    if (pgCode(error) === "23505") return { success: false, error: "open_request" };
    throw error;
  }
}

/** Seller bell row for a payout decision (used by Admin). Never blocks the decision. */
export async function notifyPayoutDecision(
  tx: Tx,
  input: { sellerId: string; payoutId: string; decision: "paid" | "rejected"; amount: string; reason?: string | null },
): Promise<void> {
  try {
    await tx.transaction(async (sp) => {
      await sp
        .insert(sellerNotifications)
        .values({
          sellerId: input.sellerId,
          type: input.decision === "paid" ? "referral_payout_paid" : "referral_payout_rejected",
          data: { amount: input.amount, payoutId: input.payoutId, ...(input.reason ? { reason: input.reason } : {}) },
          dedupeKey: `referral_payout_${input.decision}:${input.payoutId}`,
        })
        .onConflictDoNothing();
    });
  } catch (error) {
    console.error("[referrals] payout notification failed", error);
  }
}
