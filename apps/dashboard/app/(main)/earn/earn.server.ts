"use server";

import { revalidatePath } from "next/cache";
import { requestReferralPayout } from "@workspace/lib/referrals/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { WithdrawActionResult } from "./earn.dto";

/**
 * Earn with us › Request withdrawal (F-37). The seller comes from the
 * session; the amount is always the whole available balance, computed on the
 * server. An admin pays it by hand (Admin › Referrals).
 */

const withdrawLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

export async function requestWithdrawal(input: unknown): Promise<WithdrawActionResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    if (!withdrawLimiter.check(`referral-withdraw:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await requestReferralPayout(seller.sellerId, input);
    if (!result.success) return { success: false, error: result.error };
    revalidatePath("/earn");
    return { success: true, amount: result.amount };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "suspended" };
    console.error("[earn] withdrawal request failed", error);
    return { success: false, error: "generic" };
  }
}
