"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { db, eq, users } from "@workspace/db";
import { startStoreTopUp, type StartTopUpError } from "@workspace/lib/store-wallet/server";
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
