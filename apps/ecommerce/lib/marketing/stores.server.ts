import { cache } from "react";
import { createCachedQuery, marketingStoreTags } from "@workspace/cache";
import { db, sql } from "@workspace/db";
import { products } from "@workspace/db/schema";
import { storeUrl } from "@workspace/lib/storefront";
import { productInStoreOf } from "@workspace/lib/stores/scope/server";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { isSwitchOn } from "@/lib/platform-switches.server";
import { type DirectoryStore, type DirectoryStoreRow, shapeDirectoryStore } from "./store-directory.lib";
import { RECENT_STORES_LIMIT, storeIndustryId, type RecentStore } from "./recent-stores.lib";

/** The line is optional: past this, the page renders without it rather than wait for the database. */
const READ_TIMEOUT_MS = 3000;

/**
 * The newest created stores, by `created_at`, whatever their status: active or
 * pending, draft, unpublished or published, and whatever the seller's status
 * (owner, 2026-11-07). Only deleted stores are left out. Only the store's
 * industry (when it is one of the listed ones) and its creation time leave this
 * function: no store name and nothing about the seller (owner, 2026-11-05, F-73).
 */
export async function readRecentStores(windowDays = 7): Promise<RecentStore[]> {
  const result = await db.execute(sql`
    SELECT st.store_category, st.store_category_ar, st.created_at
    FROM stores st
    WHERE st.deleted_at IS NULL
      AND st.created_at <= now()
      AND st.created_at >= now() - make_interval(days => ${windowDays})
    ORDER BY st.created_at DESC
    LIMIT ${RECENT_STORES_LIMIT}
  `);
  return ([...result] as Record<string, unknown>[]).map((row) => ({
    industry: storeIndustryId({ en: row.store_category as string | null, ar: row.store_category_ar as string | null }),
    publishedAt: row.created_at ? new Date(row.created_at as string | Date).toISOString() : null,
  }));
}

/** One short-lived read for every visitor. It holds no store name, customer or seller data. */
const getCachedRecentStores = createCachedQuery({
  name: "marketing:recent-stores:v3",
  ttl: 60,
  tags: () => [marketingStoreTags.recent()],
  query: () => readRecentStores(),
});

/**
 * The stores for the home page's live line, and when they were read, which the
 * page and the browser both start from so their first render matches. Empty (the
 * line hides) if the database cannot be read.
 */
export const getRecentStores = cache(async (): Promise<{ stores: RecentStore[]; readAt: number }> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const stores = await Promise.race([
      getCachedRecentStores(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`no answer in ${READ_TIMEOUT_MS} ms`)), READ_TIMEOUT_MS);
      }),
    ]);
    return { stores, readAt: Date.now() };
  } catch (error) {
    console.error("[marketing] recent stores failed", error);
    return { stores: [], readAt: Date.now() };
  } finally {
    clearTimeout(timer);
  }
});

/** The directory is a list of links: it can wait a little longer than the live line, then the page renders without it. */
const DIRECTORY_TIMEOUT_MS = 4000;
/** A safety cap on one cached entry; /stores pages through it. */
const DIRECTORY_MAX_ROWS = 3000;

/**
 * Every store tallaby.com may list (home logo strip, /stores, sitemap): website
 * published, store active and not deleted, seller approved (the storefront's own
 * host rule), search indexing not turned off (`seo.indexing`, as
 * `isStorefrontIndexable`), and at least one active, non-trashed product the
 * store shows (`productInStoreOf`, per catalog mode), counted in one query.
 * Only public store data leaves this function: name, address, logo, listed
 * industry and the product count. Nothing about the seller.
 */
export async function readDirectoryStores(catalogSplit: boolean): Promise<DirectoryStore[]> {
  const result = await db.execute(sql`
    SELECT st.name, st.subdomain, st.logo_url, st.store_category, st.store_category_ar, pc.product_count,
      (SELECT d.domain FROM seller_custom_domains d
        WHERE d.store_id = st.id AND d.status = 'active'
        ORDER BY d.verified_at DESC NULLS LAST LIMIT 1) AS custom_domain
    FROM stores st
    JOIN sellers s ON s.id = st.seller_id
    CROSS JOIN LATERAL (
      SELECT count(*)::int AS product_count FROM ${products}
      WHERE ${products.status} = 'active'
        AND ${products.deletedAt} IS NULL
        AND ${productInStoreOf(sql`st.id`, { catalogSplit })}
    ) pc
    WHERE st.deleted_at IS NULL
      AND st.status = 'active'
      AND st.site_status = 'published'
      AND s.status = 'approved'
      AND (st.seo -> 'indexing') IS DISTINCT FROM 'false'::jsonb
      AND st.subdomain <> ''
      AND pc.product_count >= 1
    ORDER BY pc.product_count DESC, st.created_at
    LIMIT ${DIRECTORY_MAX_ROWS}
  `);
  return ([...result] as DirectoryStoreRow[])
    .map((row) => shapeDirectoryStore(row, storeUrl, (logo) => getPublicUrl(logo, "sellers")))
    .filter((store): store is DirectoryStore => store !== null);
}

/** One entry per catalog mode for every visitor. Public store data only, no customer or seller data. */
const getCachedDirectoryStores = createCachedQuery<[catalogSplit: boolean], DirectoryStore[]>({
  name: "marketing:store-directory:v1",
  ttl: 900,
  tags: () => [marketingStoreTags.directory()],
  query: (catalogSplit: boolean) => readDirectoryStores(catalogSplit),
});

/**
 * The directory stores, read once per request. The catalog switch is read here,
 * outside the cached function, and is part of its key. Empty (the strip hides,
 * /stores shows its empty state, the sitemap lists pages only) when the
 * database can't be read in time.
 */
export const getDirectoryStores = cache(async (): Promise<DirectoryStore[]> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const catalogSplit = await isSwitchOn("stores_catalog_split");
    return await Promise.race([
      getCachedDirectoryStores(catalogSplit),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`no answer in ${DIRECTORY_TIMEOUT_MS} ms`)), DIRECTORY_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.error("[marketing] store directory failed", error);
    return [];
  } finally {
    clearTimeout(timer);
  }
});
