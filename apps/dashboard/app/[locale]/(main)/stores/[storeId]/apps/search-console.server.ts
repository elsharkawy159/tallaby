"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { updateStoreGoogleSiteVerification } from "@workspace/lib/stores/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { appsAccessError, appsSaveLimiter } from "./apps-action.lib";
import type { StoreAppsResult } from "./apps.dto";

/**
 * Store › Apps › Google Search Console (moved from Website › SEO, 2026-11-27):
 * the token of Google's `<meta name="google-site-verification">` tag, kept in
 * `stores.seo.googleSiteVerification` as before. The storeId is explicit and
 * ownership is re-checked; only the token is stored (validated again in the
 * lib), and the storefront renders the tag itself through Next metadata.
 */
export async function saveSearchConsoleVerification(
  storeId: string,
  token: string,
): Promise<StoreAppsResult<{ token: string | null }>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await updateStoreGoogleSiteVerification(seller.sellerId, store.id, String(token ?? ""));
    if (!result.success) {
      const map = { invalid_input: "invalidId", store_read_only: "readOnly", not_found: "notFound" } as const;
      return { success: false, error: map[result.error] };
    }
    // The storefront layout reads stores.seo from the store profile cache.
    await applyInvalidation(invalidateStorefront([store.subdomain]), { from: "dashboard", mode: "action" });
    revalidateDashboardPath(`/stores/${store.id}/apps/google-search-console/settings`);
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    console.error("[store-apps] search console verification save failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
