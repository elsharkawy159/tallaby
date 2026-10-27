"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreViews } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { STORE_VIEWS_REFRESH_COOLDOWN_MS } from "@/lib/analytics/store-views.lib";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Store views › Refresh (PLAN.md SA-01). storeId is explicit and re-checked
 * with requireStore; a read-only (suspended) store may still refresh its own
 * numbers. One refresh a minute per store keeps GA4's quota safe.
 */

const refreshLimiter = createRateLimiter({ limit: 1, windowMs: STORE_VIEWS_REFRESH_COOLDOWN_MS });

export type RefreshStoreViewsResult = { success: true } | { success: false; error: "rateLimited" | "notFound" | "generic" };

export async function refreshStoreViews(storeId: string): Promise<RefreshStoreViewsResult> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    if (!refreshLimiter.check(`store-views:${seller.sellerId}:${store.id}`)) return { success: false, error: "rateLimited" };

    await applyInvalidation(invalidateStoreViews(seller.sellerId, store.id), { from: "dashboard", mode: "action" });
    revalidatePath(`/stores/${store.id}/analytics`);
    return { success: true };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notFound" };
    logServerError("integration", "store views refresh failed", { storeId: String(storeId) }, error);
    return { success: false, error: "generic" };
  }
}
