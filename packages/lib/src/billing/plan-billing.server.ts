import { and, db, eq, lte, sellerNotifications, sellers, sql } from "@workspace/db";
import {
  DuplicateStoreWalletEntryError,
  postStoreWalletEntry,
  STORE_WALLET_REFERENCE_TYPES,
  StoreWalletLimitError,
} from "@workspace/db/wallet";
import { addOneMonth, isProActive, minorToAmount, PLAN_GRACE_DAYS, PRO_MONTHLY_USD_CENTS } from "./billing.lib";
import { getBillingState } from "./billing.server";

/**
 * The Pro plan, paid from the store wallet (ROADMAP.md F-55d). Every charge
 * claims `plan:<seller>:<period start>`, so a retried renewal can't charge a
 * period twice. Server-only; the seller id comes from the session.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type PlanActionResult =
  | { success: true }
  | { success: false; error: "not_live" | "insufficient_balance" | "already_pro" | "not_pro" | "not_found" };

const PRO_AMOUNT = `-${minorToAmount(PRO_MONTHLY_USD_CENTS)}`;

async function chargePeriod(tx: Tx, sellerId: string, periodStart: Date, actorId: string | null) {
  await postStoreWalletEntry(tx, {
    sellerId,
    type: "service_charge",
    amount: PRO_AMOUNT,
    currency: "USD",
    referenceType: STORE_WALLET_REFERENCE_TYPES.plan,
    referenceId: `${sellerId}:${periodStart.toISOString()}`,
    description: "Tallaby Pro",
    metadata: { plan: "pro", periodStart: periodStart.toISOString() },
    createdBy: actorId,
    enforceNegativeLimit: true,
  });
}

/** Upgrade: charged now, Pro starts now, and a new month begins. */
export async function startProPlan(sellerId: string, actorId: string): Promise<PlanActionResult> {
  if (!(await getBillingState()).usdLive) return { success: false, error: "not_live" };
  try {
    return await db.transaction(async (tx) => {
      const [seller] = await tx
        .select({ plan: sellers.plan, planExpiresAt: sellers.planExpiresAt, planGraceUntil: sellers.planGraceUntil })
        .from(sellers)
        .where(eq(sellers.id, sellerId))
        .for("update");
      if (!seller) return { success: false, error: "not_found" } as const;
      if (isProActive(seller)) return { success: false, error: "already_pro" } as const;

      const now = new Date();
      await chargePeriod(tx, sellerId, now, actorId);
      await tx
        .update(sellers)
        .set({
          plan: "pro",
          planStartedAt: now.toISOString(),
          planExpiresAt: addOneMonth(now).toISOString(),
          planCancelAtPeriodEnd: false,
          planGraceUntil: null,
          planAdminGranted: false,
        })
        .where(eq(sellers.id, sellerId));
      return { success: true } as const;
    });
  } catch (error) {
    if (error instanceof StoreWalletLimitError) return { success: false, error: "insufficient_balance" };
    throw error;
  }
}

/** Downgrade: stays Pro until the paid period ends, no refund. `cancel: false` undoes it. */
export async function setProCancelAtPeriodEnd(sellerId: string, cancel: boolean): Promise<PlanActionResult> {
  const updated = await db
    .update(sellers)
    .set({ planCancelAtPeriodEnd: cancel })
    .where(and(eq(sellers.id, sellerId), eq(sellers.plan, "pro"), eq(sellers.planAdminGranted, false)))
    .returning({ id: sellers.id });
  return updated.length ? { success: true } : { success: false, error: "not_pro" };
}

/** Admin grant: free until a date (null = open-ended), never charged, not counted as income. */
export async function grantProPlan(sellerId: string, until: Date | null): Promise<void> {
  await db
    .update(sellers)
    .set({
      plan: "pro",
      planStartedAt: new Date().toISOString(),
      planExpiresAt: until ? until.toISOString() : null,
      planCancelAtPeriodEnd: false,
      planGraceUntil: null,
      planAdminGranted: true,
    })
    .where(eq(sellers.id, sellerId));
}

/** Admin: back to Free right away, with no refund. */
export async function endProPlan(sellerId: string): Promise<void> {
  await db
    .update(sellers)
    .set({ plan: "free", planExpiresAt: null, planCancelAtPeriodEnd: false, planGraceUntil: null, planAdminGranted: false })
    .where(eq(sellers.id, sellerId));
}

async function notify(tx: Tx, sellerId: string, type: "plan_renewed" | "plan_renewal_failed" | "plan_ended", key: string) {
  await tx
    .insert(sellerNotifications)
    .values({ sellerId, type, data: { plan: "pro" }, dedupeKey: `${type}:${sellerId}:${key}` })
    .onConflictDoNothing();
}

export type RenewalOutcome = "renewed" | "grace" | "ended" | "skipped";

/** One seller's renewal. Locks the row, so a second run of the job finds nothing to do. */
export async function renewOnePlan(sellerId: string, now: Date = new Date()): Promise<RenewalOutcome> {
  return db.transaction(async (tx) => {
    const [seller] = await tx
      .select({
        plan: sellers.plan,
        planExpiresAt: sellers.planExpiresAt,
        planGraceUntil: sellers.planGraceUntil,
        planCancelAtPeriodEnd: sellers.planCancelAtPeriodEnd,
        planAdminGranted: sellers.planAdminGranted,
      })
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .for("update");
    if (!seller || seller.plan !== "pro" || !seller.planExpiresAt) return "skipped";
    const periodEnd = new Date(seller.planExpiresAt);
    if (periodEnd > now) return "skipped";

    const toFree = async () => {
      await tx
        .update(sellers)
        .set({ plan: "free", planExpiresAt: null, planCancelAtPeriodEnd: false, planGraceUntil: null, planAdminGranted: false })
        .where(eq(sellers.id, sellerId));
      await notify(tx, sellerId, "plan_ended", seller.planExpiresAt!);
      return "ended" as const;
    };

    if (seller.planAdminGranted || seller.planCancelAtPeriodEnd) return toFree();

    try {
      await tx.transaction((sp) => chargePeriod(sp as unknown as Tx, sellerId, periodEnd, null));
    } catch (error) {
      if (error instanceof DuplicateStoreWalletEntryError) {
        // Already charged for this period: only the dates were left behind.
      } else if (error instanceof StoreWalletLimitError) {
        if (seller.planGraceUntil && new Date(seller.planGraceUntil) <= now) return toFree();
        if (!seller.planGraceUntil) {
          await tx
            .update(sellers)
            .set({ planGraceUntil: new Date(now.getTime() + PLAN_GRACE_DAYS * 86_400_000).toISOString() })
            .where(eq(sellers.id, sellerId));
          await notify(tx, sellerId, "plan_renewal_failed", seller.planExpiresAt);
        }
        return "grace";
      } else {
        throw error;
      }
    }

    await tx
      .update(sellers)
      .set({ planExpiresAt: addOneMonth(periodEnd).toISOString(), planGraceUntil: null })
      .where(eq(sellers.id, sellerId));
    await notify(tx, sellerId, "plan_renewed", seller.planExpiresAt);
    return "renewed";
  });
}

/** The daily job. One seller's failure never stops the others. */
export async function renewDuePlans(now: Date = new Date()): Promise<Record<RenewalOutcome | "failed", number>> {
  const counts = { renewed: 0, grace: 0, ended: 0, skipped: 0, failed: 0 };
  if (!(await getBillingState()).usdLive) return counts;
  const due = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(
      and(
        eq(sellers.plan, "pro"),
        lte(sellers.planExpiresAt, now.toISOString()),
        // A closed account (F-82, 0157) is never charged while it waits for its purge.
        sql`NOT EXISTS (SELECT 1 FROM account_deletion_requests a WHERE a.user_id = ${sellers.id} AND a.status = 'scheduled')`,
      ),
    );
  for (const { id } of due) {
    try {
      counts[await renewOnePlan(id, now)] += 1;
    } catch (error) {
      counts.failed += 1;
      console.error("[plans] renewal failed", id, error instanceof Error ? error.message : error);
    }
  }
  return counts;
}
