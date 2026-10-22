"use server";

import { connectBosta, type StoreIntegrationSummary } from "@workspace/lib/integrations/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { afterAppChange, appsAccessError, appsSaveLimiter } from "./apps-action.lib";
import type { StoreAppsErrorKey, StoreAppsResult } from "./apps.dto";

/**
 * Store › Apps › Bosta. The API key goes from the form straight into
 * AES-256-GCM after Bosta accepts it; what comes back is a summary that only
 * says "saved". Never log the input.
 */

const ERRORS: Record<string, StoreAppsErrorKey> = {
  invalid_token: "invalidToken",
  token_required: "tokenRequired",
  no_pickup_location: "bostaNoPickup",
  auth: "bostaAuth",
  rejected: "bostaRejected",
  throttled: "rateLimited",
  unreachable: "bostaUnreachable",
  failed: "bostaUnreachable",
  not_available: "notAvailable",
  store_read_only: "readOnly",
  not_found: "notFound",
};

export async function saveBosta(
  storeId: string,
  input: { apiKey?: string; allowOpenPackage?: boolean },
): Promise<StoreAppsResult<StoreIntegrationSummary>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const raw = {
      apiKey: typeof input?.apiKey === "string" ? input.apiKey : "",
      allowOpenPackage: input?.allowOpenPackage === true,
    };
    const result = await connectBosta(seller.sellerId, seller.userId, store.id, raw);
    if (!result.success) {
      return { success: false, error: ERRORS[result.error] ?? "generic", message: "message" in result ? result.message : undefined };
    }

    await afterAppChange(seller.sellerId, store.id);
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    // The name only: an error object could carry the submitted key.
    console.error("[store-apps] bosta save failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
