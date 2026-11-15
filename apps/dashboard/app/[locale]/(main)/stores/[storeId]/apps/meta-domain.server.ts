"use server";

import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { updateStoreFacebookDomainVerification } from "@workspace/lib/stores/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { appsAccessError, appsSaveLimiter } from "./apps-action.lib";
import type { StoreAppsResult } from "./apps.dto";

/**
 * Store › Apps › Meta Pixel › Domain verification: the token of Meta's
 * `<meta name="facebook-domain-verification">` tag (stores.seo). Only the
 * token is stored (letters and digits, validated again in the lib); the
 * storefront renders the tag itself on this store's host only.
 */
export async function saveMetaDomainVerification(
  storeId: string,
  token: string,
): Promise<StoreAppsResult<{ token: string | null }>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await updateStoreFacebookDomainVerification(seller.sellerId, store.id, String(token ?? ""));
    if (!result.success) {
      const map = { invalid_input: "invalidId", store_read_only: "readOnly", not_found: "notFound" } as const;
      return { success: false, error: map[result.error] };
    }
    // The storefront layout reads stores.seo from the store profile cache.
    await applyInvalidation(invalidateStorefront([store.subdomain]), { from: "dashboard", mode: "action" });
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    console.error("[store-apps] meta domain verification save failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
