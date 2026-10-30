import { cacheProfiles, createCachedQuery, storeTags } from "@workspace/cache";
import { getStorefrontTracking } from "@workspace/lib/integrations/server";
import { logServerError } from "@workspace/db/log";

/**
 * A store's own tracking ids (Pixel, GA4, GTM) for its storefront (PLAN.md
 * §9.1, P7-03). Callers pass the store resolved from the request host, never
 * client input. Cached per seller + store; the dashboard Apps page
 * invalidates the tag on every change.
 */
export const getCachedStorefrontTracking = createCachedQuery({
  name: "storefront:tracking:v2", // v2: + metaBlockedEvents (F-30)
  ttl: cacheProfiles.seller,
  tags: (sellerId: string, storeId: string) => [storeTags.integrations(sellerId, storeId)],
  query: (_sellerId: string, storeId: string) => getStorefrontTracking(storeId),
});

/**
 * Tracking must never break a storefront page: on a failure the page renders
 * without trackers and the error is logged as `[integration]` (P9-03).
 */
export async function loadStorefrontTracking(sellerId: string, storeId: string) {
  try {
    return await getCachedStorefrontTracking(sellerId, storeId);
  } catch (error) {
    logServerError("integration", "storefront tracking load failed", { sellerId, storeId }, error);
    return null;
  }
}
