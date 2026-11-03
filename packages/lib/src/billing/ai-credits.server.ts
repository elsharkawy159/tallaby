import { randomUUID } from "node:crypto";
import { aiCreditLedger, db, eq, sellerAiCredits, sellers, sql } from "@workspace/db";
import { postStoreWalletEntry, STORE_WALLET_REFERENCE_TYPES, StoreWalletLimitError } from "@workspace/db/wallet";
import { getPlanLimits } from "../plans";
import { cairoMonthKey, CREDIT_PACK_CREDITS, CREDIT_PACK_USD_CENTS, isProActive, minorToAmount } from "./billing.lib";

/**
 * AI credits (ROADMAP.md F-57). One balance per seller account, shared by
 * everyone on it. 1 credit = 1 action. Monthly credits are spent first and
 * don't carry over; bought credits never expire. Every change is one UPDATE
 * guarded by its own WHERE, so parallel calls can't overspend, and the ledger's
 * unique claim makes each entry happen once. Server-only.
 */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export type AiCreditStatus = {
  monthlyRemaining: number;
  monthlyAllowance: number;
  purchasedRemaining: number;
  total: number;
  /** When the monthly credits next reset, if known: a Pro renewal. Free resets on the 1st. */
  plan: "free" | "pro";
};

/** Which allowance applies now, and the key that loads it once per period. */
function currentAllowance(seller: {
  plan: string | null;
  planExpiresAt: string | null;
  planGraceUntil: string | null;
}): { plan: "free" | "pro"; allowance: number; period: string } {
  const plan = isProActive(seller) ? "pro" : "free";
  return {
    plan,
    allowance: getPlanLimits(plan).aiCreditsMonthly,
    period: plan === "pro" ? `pro:${seller.planExpiresAt ?? "open"}` : `free:${cairoMonthKey()}`,
  };
}

/** Loads this period's allowance once: replaces what's left of the last one (no carry-over). */
async function ensureCurrentPeriod(tx: Tx, sellerId: string) {
  const [seller] = await tx
    .select({ plan: sellers.plan, planExpiresAt: sellers.planExpiresAt, planGraceUntil: sellers.planGraceUntil })
    .from(sellers)
    .where(eq(sellers.id, sellerId));
  if (!seller) throw new Error("Seller not found");
  const { plan, allowance, period } = currentAllowance(seller);

  await tx.insert(sellerAiCredits).values({ sellerId }).onConflictDoNothing();
  const loaded = await tx
    .update(sellerAiCredits)
    .set({ monthlyRemaining: allowance, monthlyPeriod: period, updatedAt: sql`now()` })
    .where(sql`${sellerAiCredits.sellerId} = ${sellerId} AND ${sellerAiCredits.monthlyPeriod} IS DISTINCT FROM ${period}`)
    .returning({ id: sellerAiCredits.sellerId });
  if (loaded.length) {
    await tx
      .insert(aiCreditLedger)
      .values({ sellerId, kind: "monthly_grant", monthlyDelta: allowance, reference: period })
      .onConflictDoNothing();
  }
  return { plan, allowance };
}

export async function getAiCreditStatus(sellerId: string): Promise<AiCreditStatus> {
  return db.transaction(async (tx) => {
    const { plan, allowance } = await ensureCurrentPeriod(tx, sellerId);
    const [row] = await tx.select().from(sellerAiCredits).where(eq(sellerAiCredits.sellerId, sellerId));
    const monthly = row?.monthlyRemaining ?? 0;
    const purchased = row?.purchasedRemaining ?? 0;
    return {
      monthlyRemaining: monthly,
      monthlyAllowance: allowance,
      purchasedRemaining: purchased,
      total: monthly + purchased,
      plan,
    };
  });
}

export type AiCreditClaim = { ok: true; reference: string } | { ok: false; error: "no_credits" };

/** Takes 1 credit before an AI call. Give it back with refundAiCredit if the call doesn't complete. */
export async function claimAiCredit(sellerId: string, feature: string): Promise<AiCreditClaim> {
  return db.transaction(async (tx) => {
    await ensureCurrentPeriod(tx, sellerId);
    const monthly = await tx
      .update(sellerAiCredits)
      .set({ monthlyRemaining: sql`${sellerAiCredits.monthlyRemaining} - 1`, updatedAt: sql`now()` })
      .where(sql`${sellerAiCredits.sellerId} = ${sellerId} AND ${sellerAiCredits.monthlyRemaining} > 0`)
      .returning({ id: sellerAiCredits.sellerId });
    let source: "monthly" | "purchased" = "monthly";
    if (monthly.length === 0) {
      const purchased = await tx
        .update(sellerAiCredits)
        .set({ purchasedRemaining: sql`${sellerAiCredits.purchasedRemaining} - 1`, updatedAt: sql`now()` })
        .where(sql`${sellerAiCredits.sellerId} = ${sellerId} AND ${sellerAiCredits.purchasedRemaining} > 0`)
        .returning({ id: sellerAiCredits.sellerId });
      if (purchased.length === 0) return { ok: false, error: "no_credits" } as const;
      source = "purchased";
    }
    const reference = randomUUID();
    await tx.insert(aiCreditLedger).values({
      sellerId,
      kind: "use",
      monthlyDelta: source === "monthly" ? -1 : 0,
      purchasedDelta: source === "purchased" ? -1 : 0,
      feature,
      reference,
    });
    return { ok: true, reference } as const;
  });
}

/** A failed or cached call costs nothing. Works once per claim; a monthly credit from a past period isn't restored. */
export async function refundAiCredit(sellerId: string, reference: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [use] = await tx
      .select()
      .from(aiCreditLedger)
      .where(sql`${aiCreditLedger.sellerId} = ${sellerId} AND ${aiCreditLedger.kind} = 'use' AND ${aiCreditLedger.reference} = ${reference}`);
    if (!use) return;
    const claimed = await tx
      .insert(aiCreditLedger)
      .values({
        sellerId,
        kind: "refund",
        monthlyDelta: -use.monthlyDelta,
        purchasedDelta: -use.purchasedDelta,
        feature: use.feature,
        reference,
      })
      .onConflictDoNothing()
      .returning({ id: aiCreditLedger.id });
    if (claimed.length === 0) return;
    await tx
      .update(sellerAiCredits)
      .set({
        monthlyRemaining: sql`${sellerAiCredits.monthlyRemaining} + ${-use.monthlyDelta}`,
        purchasedRemaining: sql`${sellerAiCredits.purchasedRemaining} + ${-use.purchasedDelta}`,
        updatedAt: sql`now()`,
      })
      .where(eq(sellerAiCredits.sellerId, sellerId));
  });
}

export type BuyCreditsResult = { success: true; credits: number } | { success: false; error: "insufficient_balance" | "invalid" };

/** Buys packs from the wallet. The charge and the credits commit together; it can't take the wallet below zero. */
export async function buyAiCreditPacks(
  sellerId: string,
  actorId: string,
  packs: number,
  q: Queryable = db,
): Promise<BuyCreditsResult> {
  if (!Number.isInteger(packs) || packs < 1 || packs > 20) return { success: false, error: "invalid" };
  const credits = packs * CREDIT_PACK_CREDITS;
  const reference = randomUUID();
  try {
    await q.transaction(async (tx) => {
      await postStoreWalletEntry(tx as Tx, {
        sellerId,
        type: "service_charge",
        amount: `-${minorToAmount(packs * CREDIT_PACK_USD_CENTS)}`,
        currency: "USD",
        referenceType: STORE_WALLET_REFERENCE_TYPES.aiCredits,
        referenceId: reference,
        description: `AI credits: ${credits}`,
        metadata: { packs, credits },
        createdBy: actorId,
        enforceNegativeLimit: true,
      });
      await tx.insert(sellerAiCredits).values({ sellerId }).onConflictDoNothing();
      await tx
        .update(sellerAiCredits)
        .set({ purchasedRemaining: sql`${sellerAiCredits.purchasedRemaining} + ${credits}`, updatedAt: sql`now()` })
        .where(eq(sellerAiCredits.sellerId, sellerId));
      await tx.insert(aiCreditLedger).values({ sellerId, kind: "purchase", purchasedDelta: credits, reference, createdBy: actorId });
    });
    return { success: true, credits };
  } catch (error) {
    if (error instanceof StoreWalletLimitError) return { success: false, error: "insufficient_balance" };
    throw error;
  }
}
