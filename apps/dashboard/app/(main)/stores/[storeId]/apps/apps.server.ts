"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreIntegrations } from "@workspace/cache";
import {
  connectIdentifierIntegration,
  disconnectStoreIntegration,
  type StoreIntegrationSummary,
} from "@workspace/lib/integrations/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { StoreAppsErrorKey, StoreAppsResult } from "./apps.dto";

/**
 * Store › Apps (PLAN.md §9, P7-02). storeId is explicit and re-checked with
 * requireStore; only a validated public id is stored. A change invalidates
 * that store's tracking tag only, so its storefront picks it up at once.
 */

const saveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

const ERRORS: Record<string, StoreAppsErrorKey> = {
  invalid_id: "invalidId",
  unsupported: "notAvailable",
  not_available: "notAvailable",
  store_read_only: "readOnly",
  not_found: "notFound",
};

function accessError(error: unknown): StoreAppsResult<never> | null {
  if (!isAccessError(error)) return null;
  return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
}

export async function connectStoreApp(
  storeId: string,
  provider: string,
  id: string,
): Promise<StoreAppsResult<StoreIntegrationSummary>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await connectIdentifierIntegration(seller.sellerId, seller.userId, store.id, String(provider), id);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };

    await applyInvalidation(invalidateStoreIntegrations(seller.sellerId, store.id), { from: "dashboard", mode: "action" });
    revalidatePath(`/stores/${store.id}/apps`);
    return { success: true, data: result.data };
  } catch (error) {
    const denied = accessError(error);
    if (denied) return denied;
    console.error("[store-apps] connect failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

export async function disconnectStoreApp(storeId: string, provider: string): Promise<StoreAppsResult<null>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await disconnectStoreIntegration(seller.sellerId, store.id, String(provider));
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };

    await applyInvalidation(invalidateStoreIntegrations(seller.sellerId, store.id), { from: "dashboard", mode: "action" });
    revalidatePath(`/stores/${store.id}/apps`);
    return { success: true, data: null };
  } catch (error) {
    const denied = accessError(error);
    if (denied) return denied;
    console.error("[store-apps] disconnect failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
