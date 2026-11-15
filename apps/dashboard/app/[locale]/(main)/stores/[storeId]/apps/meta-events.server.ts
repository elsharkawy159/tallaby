"use server";

import { saveMetaTrackingSettings, type StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { afterAppChange, appsAccessError, appsSaveLimiter } from "./apps-action.lib";
import type { StoreAppsErrorKey, StoreAppsResult } from "./apps.dto";

/**
 * Store › Apps › Meta Pixel › Events (ROADMAP.md F-30): which Meta events
 * the store sends and when Purchase is sent. Only booleans and an enum are
 * accepted (validated again in saveMetaTrackingSettings); the store comes
 * from the session seller's own stores, never from the client alone.
 */

const ERRORS: Record<string, StoreAppsErrorKey> = {
  not_found: "notFound",
  store_read_only: "readOnly",
  not_connected: "notConnected",
  invalid_settings: "invalidSettings",
};

export async function saveMetaEvents(
  storeId: string,
  input: { events?: Record<string, boolean>; purchaseOn?: string },
): Promise<StoreAppsResult<StoreIntegrationSummary>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await saveMetaTrackingSettings(seller.sellerId, store.id, {
      events: input?.events ?? {},
      purchaseOn: input?.purchaseOn,
    });
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };

    // Invalidates the storefront tracking cache, so the Pixel follows at once.
    await afterAppChange(seller.sellerId, store.id);
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    console.error("[store-apps] meta events save failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
