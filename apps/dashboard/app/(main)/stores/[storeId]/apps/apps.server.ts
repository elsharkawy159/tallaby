"use server";

import { logServerError } from "@workspace/db/log";
import {
  connectIdentifierIntegration,
  disconnectGoogleSheets,
  disconnectStoreIntegration,
  type StoreIntegrationSummary,
} from "@workspace/lib/integrations/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { afterAppChange, appsAccessError, appsSaveLimiter } from "./apps-action.lib";
import type { StoreAppsErrorKey, StoreAppsResult } from "./apps.dto";

/**
 * Store › Apps (PLAN.md §9, P7-02). storeId is explicit and re-checked with
 * requireStore; only a validated public id is stored. A change invalidates
 * that store's tracking tag only, so its storefront picks it up at once.
 */

const ERRORS: Record<string, StoreAppsErrorKey> = {
  invalid_id: "invalidId",
  unsupported: "notAvailable",
  not_available: "notAvailable",
  store_read_only: "readOnly",
  not_found: "notFound",
};

export async function connectStoreApp(
  storeId: string,
  provider: string,
  id: string,
): Promise<StoreAppsResult<StoreIntegrationSummary>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await connectIdentifierIntegration(seller.sellerId, seller.userId, store.id, String(provider), id);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };

    await afterAppChange(seller.sellerId, store.id);
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    logServerError("integration", "connect failed", { storeId: String(storeId), provider: String(provider) }, error);
    return { success: false, error: "generic" };
  }
}

export async function disconnectStoreApp(storeId: string, provider: string): Promise<StoreAppsResult<null>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    // Google Sheets also revokes its token at Google before the row goes (P7-06).
    const result =
      provider === "google_sheets"
        ? await disconnectGoogleSheets(seller.sellerId, store.id)
        : await disconnectStoreIntegration(seller.sellerId, store.id, String(provider));
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };

    await afterAppChange(seller.sellerId, store.id);
    return { success: true, data: null };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    logServerError("integration", "disconnect failed", { storeId: String(storeId), provider: String(provider) }, error);
    return { success: false, error: "generic" };
  }
}
