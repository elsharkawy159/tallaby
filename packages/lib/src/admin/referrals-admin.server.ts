/**
 * Admin › Referrals (ROADMAP.md F-37, 0117). Server-only.
 *
 * Admins see every referrer, pay or reject withdrawal requests (with the
 * transfer reference or a reason), reverse a fake referred account's
 * commissions and re-lock a referrer. Each change is status-guarded, runs in
 * one transaction and writes admin_audit_log. No wallet is touched.
 */
import { and, db, eq, inArray, referralCommissions, referralPayouts, sellers, sql } from "@workspace/db";
import { z } from "zod";
import { fromPiastres, payoutRequestSchema, toPiastres, type PayoutDestination } from "../referrals/referrals.lib";
import { getReferralCounts, notifyPayoutDecision } from "../referrals/referrals.server";
import { ADMIN_REASON_MAX, ADMIN_REASON_MIN, type AdminResult } from "./admin.lib";
import { AdminActorError, assertAdminActor, writeAdminAudit, type Queryable } from "./guard.server";

export type ReferralAdminError = "not_admin" | "invalid_input" | "not_found" | "already_reviewed";

export const REFERRAL_ADMIN_ERROR_MESSAGES: Record<ReferralAdminError | "generic", string> = {
  not_admin: "You don't have permission to manage referrals.",
  invalid_input: "Check the form: a reference or a reason (at least 3 characters) is required.",
  not_found: "This record no longer exists.",
  already_reviewed: "This was already handled by someone else.",
  generic: "Something went wrong. Try again.",
};

class ReferralAdminFailure extends Error {
  constructor(readonly code: ReferralAdminError) {
    super(code);
  }
}

async function run<T>(fn: () => Promise<T>): Promise<AdminResult<T, ReferralAdminError>> {
  try {
    return { success: true, data: await fn() };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof ReferralAdminFailure) return { success: false, error: error.code };
    throw error;
  }
}

const reason = z.string().trim().min(ADMIN_REASON_MIN).max(ADMIN_REASON_MAX);

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type AdminReferrerRow = {
  sellerId: string;
  name: string;
  code: string | null;
  status: string | null;
  referred: number;
  successfulReferrals: number;
  stores: number;
  earned: string;
  paid: string;
  balance: string;
  unlockedAt: string | null;
  suspicious: number;
};

/** Every seller who referred at least one account, with totals. */
export async function listReferrersForAdmin(q: Queryable = db): Promise<AdminReferrerRow[]> {
  const rows = (await q.execute(sql`
    SELECT
      ref.id AS seller_id,
      coalesce(ref.display_name, ref.business_name) AS name,
      ref.referral_code AS code,
      ref.status::text AS status,
      ref.referral_unlocked_at::text AS unlocked_at,
      (SELECT count(*)::int FROM sellers r WHERE r.referred_by_seller_id = ref.id) AS referred,
      (SELECT count(*)::int FROM sellers r WHERE r.referred_by_seller_id = ref.id AND r.referral_excluded_at IS NULL
        AND EXISTS (SELECT 1 FROM seller_wallet_top_ups t WHERE t.seller_id = r.id AND t.status = 'succeeded')) AS successful,
      (SELECT count(*)::int FROM stores st JOIN sellers r ON r.id = st.seller_id
        WHERE r.referred_by_seller_id = ref.id AND r.referral_excluded_at IS NULL AND st.deleted_at IS NULL) AS stores,
      coalesce((SELECT sum(amount) FROM referral_commissions c WHERE c.referrer_seller_id = ref.id AND c.status = 'earned'), 0)::text AS earned,
      coalesce((SELECT sum(amount) FROM referral_payouts p WHERE p.referrer_seller_id = ref.id AND p.status = 'paid'), 0)::text AS paid,
      coalesce((SELECT sum(amount) FROM referral_payouts p WHERE p.referrer_seller_id = ref.id AND p.status IN ('paid', 'requested')), 0)::text AS out,
      (SELECT count(*)::int FROM sellers r WHERE r.referred_by_seller_id = ref.id AND r.referral_excluded_at IS NULL
        AND r.support_phone IS NOT NULL AND (
          right(regexp_replace(r.support_phone, '\\D', '', 'g'), 10) = right(regexp_replace(coalesce(ref.support_phone, ''), '\\D', '', 'g'), 10)
          OR EXISTS (SELECT 1 FROM sellers o WHERE o.referred_by_seller_id = ref.id AND o.id <> r.id
            AND right(regexp_replace(coalesce(o.support_phone, ''), '\\D', '', 'g'), 10) = right(regexp_replace(r.support_phone, '\\D', '', 'g'), 10))
        )) AS suspicious
    FROM sellers ref
    WHERE EXISTS (SELECT 1 FROM sellers r WHERE r.referred_by_seller_id = ref.id)
    ORDER BY referred DESC
    LIMIT 500
  `)) as unknown as Record<string, string | number | null>[];
  return rows.map((r) => ({
    sellerId: String(r.seller_id),
    name: String(r.name ?? ""),
    code: (r.code as string | null) ?? null,
    status: (r.status as string | null) ?? null,
    referred: Number(r.referred),
    successfulReferrals: Number(r.successful),
    stores: Number(r.stores),
    earned: fromPiastres(toPiastres(String(r.earned))),
    paid: fromPiastres(toPiastres(String(r.paid))),
    balance: fromPiastres(toPiastres(String(r.earned)) - toPiastres(String(r.out))),
    unlockedAt: (r.unlocked_at as string | null) ?? null,
    suspicious: Number(r.suspicious),
  })).sort((a, b) => toPiastres(b.earned) - toPiastres(a.earned) || b.referred - a.referred);
}

export type AdminPayoutRow = {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string | null;
  amount: string;
  method: string;
  destination: PayoutDestination | null;
  status: string;
  reference: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

/** Withdrawal requests, open ones first. Full destination: admins pay from it. */
export async function listReferralPayoutsForAdmin(
  view: "open" | "done" = "open",
  q: Queryable = db,
): Promise<AdminPayoutRow[]> {
  const rows = await q
    .select({
      payout: referralPayouts,
      sellerName: sql<string>`coalesce(${sellers.displayName}, ${sellers.businessName})`,
      sellerPhone: sellers.supportPhone,
    })
    .from(referralPayouts)
    .innerJoin(sellers, eq(sellers.id, referralPayouts.referrerSellerId))
    .where(view === "open" ? eq(referralPayouts.status, "requested") : inArray(referralPayouts.status, ["paid", "rejected"]))
    .orderBy(view === "open" ? sql`${referralPayouts.createdAt} ASC` : sql`${referralPayouts.reviewedAt} DESC`)
    .limit(200);
  return rows.map(({ payout, sellerName, sellerPhone }) => {
    const parsed = payoutRequestSchema.safeParse(payout.destination);
    return {
      id: payout.id,
      sellerId: payout.referrerSellerId,
      sellerName,
      sellerPhone,
      amount: payout.amount,
      method: payout.method,
      destination: parsed.success ? parsed.data : null,
      status: payout.status,
      reference: payout.reference,
      rejectionReason: payout.rejectionReason,
      createdAt: payout.createdAt,
      reviewedAt: payout.reviewedAt,
    };
  });
}

export type AdminReferredRow = {
  sellerId: string;
  name: string;
  phone: string | null;
  signedUpAt: string | null;
  stores: number;
  toppedUp: string;
  commission: string;
  reversed: string;
  excludedAt: string | null;
  samePhone: boolean;
};

export type AdminReferrerDetail = {
  sellerId: string;
  name: string;
  phone: string | null;
  code: string | null;
  unlockedAt: string | null;
  counts: { successfulReferrals: number; stores: number };
  referred: AdminReferredRow[];
};

export async function getReferrerDetailForAdmin(sellerId: string, q: Queryable = db): Promise<AdminReferrerDetail | null> {
  const [seller] = await q
    .select({
      name: sql<string>`coalesce(${sellers.displayName}, ${sellers.businessName})`,
      phone: sellers.supportPhone,
      code: sellers.referralCode,
      unlockedAt: sellers.referralUnlockedAt,
    })
    .from(sellers)
    .where(eq(sellers.id, sellerId))
    .limit(1);
  if (!seller) return null;
  const [counts, rows] = await Promise.all([
    getReferralCounts(q, sellerId),
    q.execute(sql`
      SELECT
        r.id AS seller_id,
        coalesce(r.display_name, r.business_name) AS name,
        r.support_phone AS phone,
        coalesce(r.referred_at, r.created_at)::text AS signed_up_at,
        r.referral_excluded_at::text AS excluded_at,
        (SELECT count(*)::int FROM stores st WHERE st.seller_id = r.id AND st.deleted_at IS NULL) AS stores,
        coalesce((SELECT sum(t.amount) FROM seller_wallet_top_ups t WHERE t.seller_id = r.id AND t.status = 'succeeded'), 0)::text AS topped_up,
        coalesce((SELECT sum(c.amount) FROM referral_commissions c WHERE c.referred_seller_id = r.id AND c.status = 'earned'), 0)::text AS commission,
        coalesce((SELECT sum(c.amount) FROM referral_commissions c WHERE c.referred_seller_id = r.id AND c.status = 'reversed'), 0)::text AS reversed,
        (r.support_phone IS NOT NULL AND (
          right(regexp_replace(r.support_phone, '\\D', '', 'g'), 10) = right(regexp_replace(coalesce(${seller.phone ?? ""}, ''), '\\D', '', 'g'), 10)
          OR EXISTS (SELECT 1 FROM sellers o WHERE o.referred_by_seller_id = ${sellerId} AND o.id <> r.id
            AND right(regexp_replace(coalesce(o.support_phone, ''), '\\D', '', 'g'), 10) = right(regexp_replace(r.support_phone, '\\D', '', 'g'), 10))
        )) AS same_phone
      FROM sellers r
      WHERE r.referred_by_seller_id = ${sellerId}
      ORDER BY coalesce(r.referred_at, r.created_at) DESC
      LIMIT 500
    `),
  ]);
  return {
    sellerId,
    name: seller.name,
    phone: seller.phone,
    code: seller.code,
    unlockedAt: seller.unlockedAt,
    counts,
    referred: (rows as unknown as Record<string, string | number | boolean | null>[]).map((r) => ({
      sellerId: String(r.seller_id),
      name: String(r.name ?? ""),
      phone: (r.phone as string | null) ?? null,
      signedUpAt: (r.signed_up_at as string | null) ?? null,
      stores: Number(r.stores),
      toppedUp: fromPiastres(toPiastres(String(r.topped_up))),
      commission: fromPiastres(toPiastres(String(r.commission))),
      reversed: fromPiastres(toPiastres(String(r.reversed))),
      excludedAt: (r.excluded_at as string | null) ?? null,
      samePhone: Boolean(r.same_phone),
    })),
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

const markPaidSchema = z.object({ payoutId: z.uuid(), reference: z.string().trim().min(2).max(120) });

/** Records that the team sent the money. Only a `requested` payout can be paid. */
export async function markReferralPayoutPaid(actorId: string, input: unknown, q: Queryable = db) {
  const parsed = markPaidSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "invalid_input" as const };
  return run(() =>
    q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [row] = await tx
        .update(referralPayouts)
        .set({ status: "paid", reference: parsed.data.reference, reviewedBy: actorId, reviewedAt: sql`now()` })
        .where(and(eq(referralPayouts.id, parsed.data.payoutId), eq(referralPayouts.status, "requested")))
        .returning();
      if (!row) throw new ReferralAdminFailure(await payoutMissingOrDone(tx, parsed.data.payoutId));
      await writeAdminAudit(tx, {
        actorId,
        sellerId: row.referrerSellerId,
        action: "referral_payout_paid",
        before: { status: "requested", amount: row.amount },
        after: { status: "paid", payoutId: row.id, reference: row.reference },
        reason: `Paid, reference ${parsed.data.reference}`,
      });
      await notifyPayoutDecision(tx, { sellerId: row.referrerSellerId, payoutId: row.id, decision: "paid", amount: row.amount });
      return { payoutId: row.id };
    }),
  );
}

const rejectSchema = z.object({ payoutId: z.uuid(), reason });

/** Declines a request; its amount returns to the referrer's balance. */
export async function rejectReferralPayout(actorId: string, input: unknown, q: Queryable = db) {
  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "invalid_input" as const };
  return run(() =>
    q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [row] = await tx
        .update(referralPayouts)
        .set({ status: "rejected", rejectionReason: parsed.data.reason, reviewedBy: actorId, reviewedAt: sql`now()` })
        .where(and(eq(referralPayouts.id, parsed.data.payoutId), eq(referralPayouts.status, "requested")))
        .returning();
      if (!row) throw new ReferralAdminFailure(await payoutMissingOrDone(tx, parsed.data.payoutId));
      await writeAdminAudit(tx, {
        actorId,
        sellerId: row.referrerSellerId,
        action: "referral_payout_rejected",
        before: { status: "requested", amount: row.amount },
        after: { status: "rejected", payoutId: row.id },
        reason: parsed.data.reason,
      });
      await notifyPayoutDecision(tx, {
        sellerId: row.referrerSellerId,
        payoutId: row.id,
        decision: "rejected",
        amount: row.amount,
        reason: parsed.data.reason,
      });
      return { payoutId: row.id };
    }),
  );
}

async function payoutMissingOrDone(q: Queryable, payoutId: string): Promise<ReferralAdminError> {
  const [row] = await q.select({ id: referralPayouts.id }).from(referralPayouts).where(eq(referralPayouts.id, payoutId)).limit(1);
  return row ? "already_reviewed" : "not_found";
}

const reverseSchema = z.object({ referredSellerId: z.uuid(), reason });

/**
 * A referred account is fake: reverses all its earned commissions and marks it
 * excluded, so it stops counting toward its referrer's unlock.
 */
export async function reverseReferralCommissions(actorId: string, input: unknown, q: Queryable = db) {
  const parsed = reverseSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "invalid_input" as const };
  return run(() =>
    q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [referred] = await tx
        .select({ referrerId: sellers.referredBySellerId, excludedAt: sellers.referralExcludedAt })
        .from(sellers)
        .where(eq(sellers.id, parsed.data.referredSellerId))
        .for("update");
      if (!referred?.referrerId) throw new ReferralAdminFailure("not_found");
      const reversed = await tx
        .update(referralCommissions)
        .set({ status: "reversed", reversedAt: sql`now()`, reversedBy: actorId, reversalReason: parsed.data.reason })
        .where(and(eq(referralCommissions.referredSellerId, parsed.data.referredSellerId), eq(referralCommissions.status, "earned")))
        .returning({ amount: referralCommissions.amount });
      if (!reversed.length && referred.excludedAt) throw new ReferralAdminFailure("already_reviewed");
      await tx.update(sellers).set({ referralExcludedAt: sql`now()` }).where(eq(sellers.id, parsed.data.referredSellerId));
      const total = fromPiastres(reversed.reduce((sum, r) => sum + toPiastres(r.amount), 0));
      await writeAdminAudit(tx, {
        actorId,
        sellerId: referred.referrerId,
        action: "referral_commissions_reversed",
        before: { referredSellerId: parsed.data.referredSellerId, excluded: Boolean(referred.excludedAt) },
        after: { referredSellerId: parsed.data.referredSellerId, excluded: true, reversedCount: reversed.length, reversedAmount: total },
        reason: parsed.data.reason,
      });
      return { reversedCount: reversed.length, reversedAmount: total };
    }),
  );
}

const relockSchema = z.object({ sellerId: z.uuid(), reason });

/** Clears a referrer's unlock; it comes back only when the (honest) counts reach 10 again. */
export async function relockReferrer(actorId: string, input: unknown, q: Queryable = db) {
  const parsed = relockSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "invalid_input" as const };
  return run(() =>
    q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [row] = await tx
        .update(sellers)
        .set({ referralUnlockedAt: null })
        .where(and(eq(sellers.id, parsed.data.sellerId), sql`${sellers.referralUnlockedAt} IS NOT NULL`))
        .returning({ id: sellers.id });
      if (!row) throw new ReferralAdminFailure("already_reviewed");
      await writeAdminAudit(tx, {
        actorId,
        sellerId: parsed.data.sellerId,
        action: "referral_relocked",
        before: { unlocked: true },
        after: { unlocked: false },
        reason: parsed.data.reason,
      });
      return { sellerId: row.id };
    }),
  );
}
