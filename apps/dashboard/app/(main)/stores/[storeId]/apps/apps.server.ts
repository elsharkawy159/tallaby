"use server";

import { logServerError } from "@workspace/db/log";
import { installStoreApp, uninstallStoreApp, type AppInstallError } from "@workspace/lib/billing/apps";
import {
  connectIdentifierIntegration,
  requestStoreApp,
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

    await afterAppChange(seller.sellerId, store.id, String(provider));
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    logServerError("integration", "connect failed", { storeId: String(storeId), provider: String(provider) }, error);
    return { success: false, error: "generic" };
  }
}

const INSTALL_ERRORS: Record<AppInstallError, StoreAppsErrorKey> = {
  not_available: "notAvailable",
  not_live: "notLive",
  not_found: "notFound",
  already_installed: "alreadyInstalled",
  insufficient_balance: "insufficientBalance",
  wallet_inactive: "walletInactive",
  wallet_not_usd: "walletNotUsd",
};

/** Asks for an app that isn't open yet (F-62). Saved once per store; the Admin bell announces it. */
export async function requestApp(storeId: string, appKey: string): Promise<StoreAppsResult<null>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await requestStoreApp({
      sellerId: seller.sellerId,
      storeId: store.id,
      appKey: String(appKey),
      actorId: seller.userId,
    });
    if (!result.success) return { success: false, error: "notAvailable" };
    return { success: true, data: null };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    logServerError("integration", "app request failed", { storeId: String(storeId), appKey: String(appKey) }, error);
    return { success: false, error: "generic" };
  }
}

/** Installs a catalog app. The price comes from the catalog; a paid app is charged to the store wallet (F-47). */
export async function installApp(storeId: string, appKey: string): Promise<StoreAppsResult<null>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await installStoreApp({
      sellerId: seller.sellerId,
      storeId: store.id,
      appKey: String(appKey),
      actorId: seller.userId,
    });
    if (!result.success) return { success: false, error: INSTALL_ERRORS[result.error] };

    await afterAppChange(seller.sellerId, store.id, String(appKey));
    return { success: true, data: null };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    logServerError("integration", "app install failed", { storeId: String(storeId), appKey: String(appKey) }, error);
    return { success: false, error: "generic" };
  }
}

/** Removes an installed app. `endsAt` is set when a paid month keeps it until then (F-47). */
export async function uninstallApp(storeId: string, appKey: string): Promise<StoreAppsResult<{ endsAt: string | null }>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await uninstallStoreApp({ sellerId: seller.sellerId, storeId: store.id, appKey: String(appKey) });
    if (!result.success) return { success: false, error: "notInstalled" };

    await afterAppChange(seller.sellerId, store.id, String(appKey));
    return { success: true, data: { endsAt: result.endsAt } };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    logServerError("integration", "app uninstall failed", { storeId: String(storeId), appKey: String(appKey) }, error);
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

    await afterAppChange(seller.sellerId, store.id, String(provider));
    return { success: true, data: null };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    logServerError("integration", "disconnect failed", { storeId: String(storeId), provider: String(provider) }, error);
    return { success: false, error: "generic" };
  }
}
