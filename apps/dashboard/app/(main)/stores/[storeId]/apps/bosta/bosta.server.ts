"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import {
  listStoreBostaPickupLocations,
  saveBostaKey,
  saveBostaSettings,
  testStoreBosta,
  type BostaOverview,
} from "@workspace/lib/integrations/server";
import type { BostaPickupLocation } from "@workspace/lib/shipping/bosta";
import { requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { afterAppChange, appsAccessError, appsSaveLimiter } from "../apps-action.lib";
import type { StoreAppsErrorKey, StoreAppsResult } from "../apps.dto";

/**
 * Store › Apps › Bosta (docs/superpowers/plans/2026-10-26-bosta-shipping.md,
 * BS-06). The key goes from the form to Bosta (to verify it) and then into
 * AES-256-GCM; nothing sent back contains it. Never log the input.
 */

/** "Verify key" calls Bosta with whatever is pasted: 5 a minute per store stops key-guessing through us. */
const verifyLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });
const testLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });

const ERRORS: Record<string, StoreAppsErrorKey> = {
  invalid_key: "bostaInvalidKey",
  key_required: "bostaKeyRequired",
  key_rejected: "bostaKeyRejected",
  bosta_unreachable: "bostaUnreachable",
  unknown_pickup_location: "bostaUnknownLocation",
  invalid_settings: "invalidSettings",
  not_available: "notAvailable",
  store_read_only: "readOnly",
  not_found: "notFound",
  not_connected: "notConnected",
  failed: "testFailed",
};

async function afterBostaChange(sellerId: string, storeId: string): Promise<void> {
  await afterAppChange(sellerId, storeId);
  revalidatePath(`/stores/${storeId}/apps/bosta`);
  revalidatePath(`/stores/${storeId}/shipping`);
}

export type BostaKeyResult = { overview: BostaOverview; pickupLocations: BostaPickupLocation[] };

/** Wizard step 3 / "Replace key": verify with Bosta, then save. An empty key re-checks the saved one. */
export async function verifyBostaKey(storeId: string, apiKey: string): Promise<StoreAppsResult<BostaKeyResult>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!verifyLimiter.check(`bosta-verify:${store.id}`)) return { success: false, error: "rateLimited" };

    const result = await saveBostaKey(seller.sellerId, seller.userId, store.id, typeof apiKey === "string" ? apiKey : "");
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic", message: result.message };

    await afterBostaChange(seller.sellerId, store.id);
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    // The name only: an error object could carry the submitted key.
    console.error("[store-apps] bosta verify failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}

export type BostaSettingsForm = {
  pickupLocationId?: string;
  autoShip?: "manual" | "on_confirm";
  size?: "SMALL" | "MEDIUM" | "LARGE";
  allowToOpenPackage?: boolean;
  note?: string;
  canCancel?: boolean;
};

/** Wizard step 4, the settings view and the Shipping page's "Create Bosta shipments" choice. */
export async function updateBostaSettings(storeId: string, input: BostaSettingsForm): Promise<StoreAppsResult<BostaOverview>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await saveBostaSettings(seller.sellerId, store.id, input);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };

    await afterBostaChange(seller.sellerId, store.id);
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    logServerError("integration", "bosta settings failed", { storeId: String(storeId) }, error);
    return { success: false, error: "generic" };
  }
}

/** "Test connection": the saved key can still read the Bosta account. */
export async function testBosta(storeId: string): Promise<StoreAppsResult<BostaPickupLocation[]>> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    if (!testLimiter.check(`apps-test:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const tested = await testStoreBosta(seller.sellerId, store.id);
    await afterBostaChange(seller.sellerId, store.id);
    if (!tested.success) return { success: false, error: ERRORS[tested.error] ?? "generic", message: tested.message };

    const locations = await listStoreBostaPickupLocations(seller.sellerId, store.id);
    return locations.success ? { success: true, data: locations.data } : { success: false, error: ERRORS[locations.error] ?? "generic" };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    logServerError("integration", "bosta test failed", { storeId: String(storeId) }, error);
    return { success: false, error: "generic" };
  }
}

/** The account's pickup locations for the settings form, loaded after the page renders. */
export async function loadBostaPickupLocations(storeId: string): Promise<StoreAppsResult<BostaPickupLocation[]>> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    if (!testLimiter.check(`apps-test:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await listStoreBostaPickupLocations(seller.sellerId, store.id);
    return result.success ? { success: true, data: result.data } : { success: false, error: ERRORS[result.error] ?? "generic" };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    logServerError("integration", "bosta locations failed", { storeId: String(storeId) }, error);
    return { success: false, error: "generic" };
  }
}
