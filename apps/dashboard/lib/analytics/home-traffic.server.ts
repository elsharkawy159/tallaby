import { createCachedQuery, storeTags } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { STORE_VIEWS_TIME_ZONE, STORE_VIEWS_TTL_SECONDS, dayInZone } from "./store-views.lib";
import { isStoreViewsConfigured, runGa4Report } from "./store-views.server";
import {
  homeSourcesReportBody,
  homeVisitsReportBody,
  parseHomeSources,
  parseHomeVisits,
  type HomeVisits,
  type TrafficSource,
} from "./home-traffic.lib";

/**
 * Store-website visits and traffic sources for the dashboard home. Callers
 * pass store ids that already belong to the session's seller.
 */

export type HomeTraffic = HomeVisits & { sources: TrafficSource[] };

async function fetchHomeTraffic(storeIds: string[], days: number): Promise<HomeTraffic> {
  const [visits, sources] = await Promise.all([
    runGa4Report(homeVisitsReportBody(storeIds, days)),
    runGa4Report(homeSourcesReportBody(storeIds, days)),
  ]);
  return {
    ...parseHomeVisits(visits, days, dayInZone(new Date(), STORE_VIEWS_TIME_ZONE)),
    sources: parseHomeSources(sources),
  };
}

/** Hourly per seller + stores + range; Store views › Refresh purges a store's tag. */
const getCachedHomeTraffic = createCachedQuery({
  name: "dashboard:home-traffic:v1",
  ttl: STORE_VIEWS_TTL_SECONDS,
  tags: (sellerId: string, storeIds: string[], _days: number) => storeIds.map((id) => storeTags.views(sellerId, id)),
  query: (_sellerId: string, storeIds: string[], days: number) => fetchHomeTraffic(storeIds, days),
});

/** Null when GA4 is not set up, there are no stores, or GA4 failed (never cached). */
export async function getHomeTraffic(sellerId: string, storeIds: string[], days: number): Promise<HomeTraffic | null> {
  if (!isStoreViewsConfigured() || storeIds.length === 0) return null;
  try {
    return await getCachedHomeTraffic(sellerId, [...storeIds].sort(), days);
  } catch (error) {
    logServerError("integration", "home traffic load failed", { stores: storeIds.length, days }, error);
    return null;
  }
}
