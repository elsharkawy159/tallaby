"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import {
  cancelTallabyPayPayout,
  requestTallabyPayPayout,
  submitTallabyPayKyc,
} from "@workspace/lib/tallaby-pay/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { CancelWithdrawalResult, RequestWithdrawalResult, SubmitKycResult } from "./earnings.dto";

/**
 * Store › Tallaby Pay earnings actions (ROADMAP.md F-100e; design §7, §10).
 * The seller comes from the session and the store is checked against it
 * (rule 5); the client sends only the store id from the route, the form and a
 * payout id, all re-checked in the lib. An admin pays the request by hand
 * (Admin › Tallaby Pay). Earnings are never cached (rule 8): only
 * revalidatePath. The page itself is F-100f.
 */

const withdrawLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });
const kycLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

function accessError(error: unknown): { success: false; error: "readOnly" | "notFound" | "suspended" } | null {
  if (!isAccessError(error)) return null;
  if (error.code === "store_read_only") return { success: false, error: "readOnly" };
  if (error.code === "not_found") return { success: false, error: "notFound" };
  return { success: false, error: "suspended" };
}

const earningsPath = (storeId: string) => `/stores/${storeId}/earnings`;

/** Opens a withdrawal request for the store's available earnings (default: all of it). */
export async function requestTallabyPayWithdrawal(storeId: string, input: unknown): Promise<RequestWithdrawalResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!withdrawLimiter.check(`tallaby-pay-withdraw:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await requestTallabyPayPayout({
      sellerId: seller.sellerId,
      storeId: store.id,
      userId: seller.userId,
      input,
    });
    if (!result.success) return { success: false, error: result.error };
    revalidateDashboardPath(earningsPath(store.id));
    return { success: true, payoutId: result.data.payoutId, amount: result.data.amount };
  } catch (error) {
    const denied = accessError(error);
    if (denied) return denied;
    // The name only: the input holds the payout destination.
    console.error("[earnings] withdrawal request failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}

/** Cancels the store's open withdrawal request; its amount is available again. */
export async function cancelTallabyPayWithdrawal(storeId: string, payoutId: string): Promise<CancelWithdrawalResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!withdrawLimiter.check(`tallaby-pay-withdraw:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await cancelTallabyPayPayout({
      sellerId: seller.sellerId,
      storeId: store.id,
      payoutId: String(payoutId),
      userId: seller.userId,
    });
    if (!result.success) return { success: false, error: result.error };
    revalidateDashboardPath(earningsPath(store.id));
    return { success: true };
  } catch (error) {
    const denied = accessError(error);
    if (denied) return denied;
    console.error("[earnings] withdrawal cancel failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}

/**
 * Submits the account's legal name and ID for KYC (owner 2026-11-18: needed
 * before the first withdrawal). KYC belongs to the seller account, not a
 * store; `storeId` only picks the page to refresh and is checked like any other.
 */
export async function submitTallabyPayKycAction(storeId: string, input: unknown): Promise<SubmitKycResult> {
  try {
    // Not forWrite on the store: a read-only store doesn't stop the account's KYC.
    const { seller, store } = await requireStore(String(storeId));
    if (!kycLimiter.check(`tallaby-pay-kyc:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await submitTallabyPayKyc({ sellerId: seller.sellerId, input });
    if (!result.success) return { success: false, error: result.error };
    revalidateDashboardPath(earningsPath(store.id));
    return { success: true };
  } catch (error) {
    const denied = accessError(error);
    if (denied) return denied;
    // The name only: the input holds the ID number.
    console.error("[earnings] kyc submit failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
