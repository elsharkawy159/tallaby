"use server";

import {
  saveMetaCapiCredentials,
  testStoreMetaCapi,
  type StoreIntegrationSummary,
} from "@workspace/lib/integrations/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { afterAppChange, appsAccessError, appsSaveLimiter } from "./apps-action.lib";
import type { StoreAppsErrorKey, StoreAppsResult } from "./apps.dto";

/**
 * Store › Apps › Meta Conversions API (PLAN.md §9.2, P7-05). The token goes
 * from the form straight into AES-256-GCM; what comes back is a summary that
 * only says "saved". Never log the input.
 */

const testLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });

const ERRORS: Record<string, StoreAppsErrorKey> = {
  invalid_token: "invalidToken",
  invalid_test_code: "invalidTestCode",
  pixel_required: "pixelRequired",
  token_required: "tokenRequired",
  not_available: "notAvailable",
  store_read_only: "readOnly",
  not_found: "notFound",
  not_connected: "notConnected",
  failed: "testFailed",
};

export async function saveMetaCapi(
  storeId: string,
  input: { accessToken?: string; testEventCode?: string },
): Promise<StoreAppsResult<StoreIntegrationSummary>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const raw = {
      accessToken: typeof input?.accessToken === "string" ? input.accessToken : "",
      testEventCode: typeof input?.testEventCode === "string" ? input.testEventCode : "",
    };
    const result = await saveMetaCapiCredentials(seller.sellerId, seller.userId, store.id, raw);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };

    await afterAppChange(seller.sellerId, store.id);
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    // The message only: an error object could carry the submitted input.
    console.error("[store-apps] meta capi save failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}

export async function testMetaCapi(storeId: string): Promise<StoreAppsResult<StoreIntegrationSummary>> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    if (!testLimiter.check(`apps-test:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await testStoreMetaCapi(seller.sellerId, store.id, {
      graphVersion: process.env.META_GRAPH_API_VERSION,
    });
    await afterAppChange(seller.sellerId, store.id);
    if (!result.success) {
      return { success: false, error: ERRORS[result.error] ?? "generic", message: result.message };
    }
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    console.error("[store-apps] meta capi test failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
