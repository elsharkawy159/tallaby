import { createCachedQuery, storeTags } from "@workspace/cache";
import { runGa4Report } from "@workspace/lib/analytics/ga4";
import {
  STORE_VIEWS_TIME_ZONE,
  STORE_VIEWS_TTL_SECONDS,
  dayInZone,
  parseStoreViewsReport,
  storeViewsReportBody,
  type StoreViewsRange,
  type StoreViewsReport,
} from "./store-views.lib";

export { isStoreViewsConfigured, runGa4Report } from "@workspace/lib/analytics/ga4";

async function fetchStoreViews(storeId: string, range: StoreViewsRange): Promise<StoreViewsReport> {
  const json = await runGa4Report(storeViewsReportBody(storeId, range));
  const now = new Date();
  return parseStoreViewsReport(json, range, dayInZone(now, STORE_VIEWS_TIME_ZONE), now.toISOString());
}

/**
 * Cached per seller + store + range for 5 minutes; Refresh purges the store's
 * tag. Errors are not cached, so a failed read is retried on the next visit.
 */
export const getStoreViews = createCachedQuery({
  name: "dashboard:store-views:v1",
  ttl: STORE_VIEWS_TTL_SECONDS,
  tags: (sellerId: string, storeId: string, _range: StoreViewsRange) => [storeTags.views(sellerId, storeId)],
  query: (_sellerId: string, storeId: string, range: StoreViewsRange) => fetchStoreViews(storeId, range),
});
