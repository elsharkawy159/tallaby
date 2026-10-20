"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { db, eq, users } from "@workspace/db";
import { getServiceClient } from "@workspace/db/supabase/service";
import { TOP_UP_PROOF_BUCKET, isOwnTopUpProofPath } from "@workspace/lib/store-wallet";
import {
  startStoreTopUp,
  submitManualStoreTopUp,
  type StartTopUpError,
  type SubmitManualTopUpError,
} from "@workspace/lib/store-wallet/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Store wallet › Top up (PLAN.md §13.4, P6-09). The amount is validated on the
 * server; the wallet is credited only by the signed Kashier webhook
 * (apps/backend, P6-10), never from here or the return page.
 */

const topUpLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });

export type TopUpActionError = StartTopUpError | "rateLimited" | "notAllowed";
export type TopUpActionResult = { success: true; sessionUrl: string } | { success: false; error: TopUpActionError };

export async function startTopUp(amount: string): Promise<TopUpActionResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    if (!topUpLimiter.check(`top-up:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, seller.userId));
    const origin = (await headers()).get("origin");
    const base = (process.env.NEXT_PUBLIC_SITE_URL || origin || "").replace(/\/$/, "");
    const locale = (await getLocale()) === "en" ? "en" : "ar";

    const result = await startStoreTopUp({
      sellerId: seller.sellerId,
      actorId: seller.userId,
      amount: String(amount),
      email: user?.email ?? null,
      returnUrl: `${base}/wallet/top-up`,
      locale,
    });
    return result.success ? { success: true, sessionUrl: result.sessionUrl } : result;
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notAllowed" };
    console.error("[store-top-up] start failed", (error as Error)?.message);
    return { success: false, error: "provider_error" };
  }
}

const manualLimiter = createRateLimiter({ limit: 6, windowMs: 10 * 60_000 });

export type ManualTopUpActionError = SubmitManualTopUpError | "rateLimited" | "notAllowed" | "generic";
export type ManualTopUpActionResult = { success: true; amount: string } | { success: false; error: ManualTopUpActionError };

/**
 * Store wallet › Top up by Vodafone Cash or InstaPay (owner request 2026-10-18).
 * The browser has already uploaded the receipt into the seller's own folder of
 * the private bucket; this checks the path and that the file exists, then
 * records a PENDING request. The wallet is credited only when an admin
 * approves it (apps/admin › Store top-ups).
 */
export async function submitManualTopUp(input: {
  method: string;
  amount: string;
  proofPath: string;
  senderPhone?: string;
}): Promise<ManualTopUpActionResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    if (!manualLimiter.check(`manual-top-up:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    if (!isOwnTopUpProofPath(seller.sellerId, input?.proofPath)) return { success: false, error: "invalid_proof" };

    // The file must really be there (the upload could have failed or been skipped).
    const { error: missing } = await getServiceClient().storage.from(TOP_UP_PROOF_BUCKET).createSignedUrl(input.proofPath, 60);
    if (missing) return { success: false, error: "invalid_proof" };

    const result = await submitManualStoreTopUp({
      sellerId: seller.sellerId,
      actorId: seller.userId,
      data: {
        method: input.method,
        amount: input.amount,
        proofPath: input.proofPath,
        ...(input.senderPhone?.trim() && { senderPhone: input.senderPhone.trim() }),
      },
    });
    if (!result.success) return result;
    revalidatePath("/wallet");
    return { success: true, amount: result.amount };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notAllowed" };
    console.error("[store-top-up] manual submit failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
