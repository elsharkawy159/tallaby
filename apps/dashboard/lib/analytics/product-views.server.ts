import { createCachedQuery, storeTags } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { STORE_VIEWS_TTL_SECONDS } from "./store-views.lib";
import { isStoreViewsConfigured, runGa4Report } from "./store-views.server";
import { parseProductViewsReport, productViewsReportBody, type PathViews } from "./product-views.lib";

/**
 * Store product page views per page path (ROADMAP.md F-15b), one GA4
 * runReport for all of the seller's stores. Callers pass store ids that
 * already belong to the session's seller.
 */

/** Hourly per seller + stores + range; Store views › Refresh purges a store's tag. */
const getCachedProductPathViews = createCachedQuery({
  name: "dashboard:product-views:v1",
  ttl: STORE_VIEWS_TTL_SECONDS,
  tags: (sellerId: string, storeIds: string[], _days: number) => storeIds.map((id) => storeTags.views(sellerId, id)),
  query: async (_sellerId: string, storeIds: string[], days: number): Promise<PathViews[]> =>
    parseProductViewsReport(await runGa4Report(productViewsReportBody(storeIds, days))),
});

/** Null when GA4 is not set up, there are no stores, or GA4 failed (never cached). */
export async function getProductPathViews(
  sellerId: string,
  storeIds: string[],
  days: number,
): Promise<PathViews[] | null> {
  if (!isStoreViewsConfigured() || storeIds.length === 0) return null;
  try {
    return await getCachedProductPathViews(sellerId, [...storeIds].sort(), days);
  } catch (error) {
    logServerError("integration", "product views load failed", { stores: storeIds.length, days }, error);
    return null;
  }
}
