"use server";

import { revalidatePath } from "next/cache";
import { buyAiCreditPacks } from "@workspace/lib/billing/credits";
import { setProCancelAtPeriodEnd, startProPlan } from "@workspace/lib/billing/plans";
import { getBillingState } from "@workspace/lib/billing/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";

/**
 * Plan & usage actions (ROADMAP.md F-55e, F-57d). The seller comes from the
 * session, and the prices live on the server: the client only says what it wants.
 */

export type PlanActionState =
  | { success: true }
  | { success: false; error: "insufficient_balance" | "not_live" | "unauthorized" | "generic" };

async function run(action: (seller: { sellerId: string; userId: string }) => Promise<PlanActionState>): Promise<PlanActionState> {
  try {
    const seller = await requireSeller({ forWrite: true });
    if (!(await getBillingState()).usdLive) return { success: false, error: "not_live" };
    const result = await action(seller);
    if (result.success) {
      revalidatePath("/settings/plan");
      revalidatePath("/wallet");
    }
    return result;
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "unauthorized" };
    console.error("[plan] action failed", error);
    return { success: false, error: "generic" };
  }
}

const generic = (error: string): PlanActionState =>
  error === "insufficient_balance" ? { success: false, error: "insufficient_balance" } : { success: false, error: "generic" };

export async function upgradeToProAction(): Promise<PlanActionState> {
  return run(async ({ sellerId, userId }) => {
    const result = await startProPlan(sellerId, userId);
    return result.success ? result : generic(result.error);
  });
}

/** `cancel: true` stops the renewal; Pro lasts until the paid period ends. */
export async function setPlanCancelAction(cancel: boolean): Promise<PlanActionState> {
  return run(async ({ sellerId }) => {
    const result = await setProCancelAtPeriodEnd(sellerId, cancel === true);
    return result.success ? result : generic(result.error);
  });
}

export async function buyCreditPacksAction(packs: number): Promise<PlanActionState> {
  return run(async ({ sellerId, userId }) => {
    const result = await buyAiCreditPacks(sellerId, userId, packs);
    return result.success ? { success: true } : generic(result.error);
  });
}
