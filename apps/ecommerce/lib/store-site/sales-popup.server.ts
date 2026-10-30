import { createCachedQuery, storeTags } from "@workspace/cache";
import { buildSalesFeed, type SalesFeedItem } from "@workspace/lib/stores/sales-popup";
import { storeRecentOrderRows } from "@workspace/lib/stores/sales-popup/server";
import type { Storefront } from "@/lib/storefront.server";

/**
 * The sales pop-up feed of the store on this host (ROADMAP.md F-22a).
 *
 * Cached for 5 minutes per seller, store and language (CLAUDE.md rule 8: the
 * key and tag carry the seller id). Caching an order read is fine here
 * because the result is an anonymised, store-wide aggregate (product name,
 * governorate and time only, the same for every visitor), never one
 * customer's cart or order. The cache keeps the order times, not "minutes
 * ago", so the age is worked out fresh on every render.
 */
const SALES_FEED_TTL_SECONDS = 300;

const getCachedStoreRecentOrderRows = createCachedQuery({
  name: "storefront:store-recent-orders:v1",
  ttl: SALES_FEED_TTL_SECONDS,
  tags: (sellerId: string, storeId: string, _locale: string) => [storeTags.recentOrders(sellerId, storeId)],
  query: (sellerId: string, storeId: string, locale: string) => storeRecentOrderRows(sellerId, storeId, locale),
});

/**
 * `store` comes from the request host (`resolveStorefront`), never from the
 * client. Empty when the seller switched the pop-up off or the store has
 * fewer than 3 recent orders; a failed read only loses the pop-up.
 */
export async function loadStoreSalesFeed(store: Pick<Storefront, "id" | "storeId" | "salesPopup">, locale: string): Promise<SalesFeedItem[]> {
  if (!store.salesPopup.enabled) return [];
  const lang = locale === "en" ? "en" : "ar";
  try {
    const rows = await getCachedStoreRecentOrderRows(store.id, store.storeId, lang);
    return buildSalesFeed(rows, lang, Date.now());
  } catch (error) {
    console.error("Store sales pop-up failed to load:", (error as Error)?.message);
    return [];
  }
}
