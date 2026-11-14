import { and, db, eq, sql } from "@workspace/db";
import { stores, storeSiteRevisions } from "@workspace/db/schema";
import { cacheProfiles, createCachedQuery, storeTags } from "@workspace/cache";
import { listPublicCmsUrls } from "@workspace/lib/cms/server";
import { storeUrl } from "@workspace/lib/storefront";
import { storeIndexLocales } from "@/lib/store-seo/store-seo.lib";
import { getCachedPublishedSite } from "@/lib/store-site/published-site.server";
import {
  getRenamedStoreSubdomain,
  getStorefrontCategories,
  getStorefrontBySubdomain,
  isStorefrontIndexable,
  storefrontCatalog,
  type Storefront,
} from "@/lib/storefront.server";
import { fetchStoreProductTranslations } from "./sitemap.server";
import { buildStoreSitemapEntries, type StoreSitemapUrl } from "./store-sitemap.lib";
import type { SitemapEntry } from "./sitemap.lib";

/** The store a provider lists URLs for (resolved from the request host). */
export interface StoreSitemapStore {
  sellerId: string;
  storeId: string;
  subdomain: string;
}

/** A source of extra public URLs for a store's sitemap. */
export type StoreSitemapUrlProvider = (store: StoreSitemapStore) => Promise<StoreSitemapUrl[]>;

/**
 * Extra URL providers for store sitemaps: blog posts, /blog and CMS items
 * (P4-16, P4-11). A provider must list only published, public URLs of that
 * one store.
 */
export const STORE_SITEMAP_URL_PROVIDERS: StoreSitemapUrlProvider[] = [
  async ({ storeId }) => (await listPublicCmsUrls(storeId)).map(({ path, lastmod }) => ({ path, lastModified: lastmod })),
];

async function extraUrls(store: StoreSitemapStore): Promise<StoreSitemapUrl[]> {
  const results = await Promise.allSettled(STORE_SITEMAP_URL_PROVIDERS.map((provider) => provider(store)));
  return results.flatMap((result) => {
    if (result.status === "fulfilled") return result.value;
    // One failing source must not take the whole sitemap down.
    console.error("[sitemap] store URL provider failed", result.reason);
    return [];
  });
}

export interface StoreCrawlInfo {
  store: Storefront;
  /** Canonical origin: the custom domain when live, else the subdomain. */
  baseUrl: string;
  indexable: boolean;
}

/**
 * The live store behind a store host's robots.txt / sitemap.xml, or null for
 * a subdomain that is not a live store. The subdomain is the one proxy.ts
 * resolved from the request host, never a client value.
 */
export async function getStoreCrawlInfo(subdomain: string): Promise<StoreCrawlInfo | null> {
  const store = await getStorefrontBySubdomain(subdomain);
  if (!store) return null;
  return {
    store,
    baseUrl: storeUrl(store.subdomain, store.customDomain),
    indexable: await isStorefrontIndexable(store),
  };
}

/**
 * A crawl file requested on a store's previous subdomain: a permanent
 * redirect to the same file on the store's current address (as its pages
 * do), else 404.
 */
export async function renamedStoreFileResponse(subdomain: string, path: string): Promise<Response> {
  const renamed = await getRenamedStoreSubdomain(subdomain);
  const store = renamed ? await getStorefrontBySubdomain(renamed) : null;
  if (!store) return new Response("Not found", { status: 404 });
  return Response.redirect(`${storeUrl(store.subdomain, store.customDomain)}${path}`, 308);
}

/**
 * When the store's live site was published (its published revision's
 * `created_at`, UTC ISO), or null. Owner-checked: the store must belong to
 * the seller. Cached per seller and store with the site tag, so a publish
 * refreshes it as it does the site itself.
 */
const getCachedSitePublishedAt = createCachedQuery({
  name: "store-sitemap:published-at:v1",
  ttl: cacheProfiles.seller,
  tags: (sellerId: string, storeId: string) => [storeTags.site(sellerId, storeId)],
  query: async (sellerId: string, storeId: string): Promise<string | null> => {
    const [row] = await db
      .select({ at: sql<string>`to_char(${storeSiteRevisions.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')` })
      .from(stores)
      .innerJoin(storeSiteRevisions, and(eq(storeSiteRevisions.id, stores.publishedRevisionId), eq(storeSiteRevisions.storeId, stores.id)))
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId)))
      .limit(1);
    return row?.at ?? null;
  },
});

export interface StoreSitemapDataset {
  baseUrl: string;
  indexable: boolean;
  entries: SitemapEntry[];
}

/**
 * One store host's sitemap (P5-04), or null for a subdomain that is not a
 * live store. Every source below is scoped to that one store.
 */
export async function getStoreSitemapDataset(subdomain: string): Promise<StoreSitemapDataset | null> {
  const info = await getStoreCrawlInfo(subdomain);
  if (!info) return null;
  const { store, baseUrl, indexable } = info;
  if (!indexable) return { baseUrl, indexable, entries: [] };

  const scope: StoreSitemapStore = { sellerId: store.id, storeId: store.storeId, subdomain: store.subdomain };
  // The host's store and the switch (read once, outside every cache): products and categories are what this store shows.
  const catalog = await storefrontCatalog(store);
  const [site, products, extra, categories, publishedAt] = await Promise.all([
    getCachedPublishedSite(store.id, store.storeId, store.subdomain),
    fetchStoreProductTranslations(store.id, catalog),
    extraUrls(scope),
    getStorefrontCategories(store.id, store.storeId),
    // Only a lastmod: a failed read leaves it out rather than the sitemap.
    getCachedSitePublishedAt(store.id, store.storeId).catch((error: unknown) => {
      console.error("[sitemap] store publish time failed", error);
      return null;
    }),
  ]);
  const withProducts = categories.filter((category) => category.productCount > 0);

  return {
    baseUrl,
    indexable,
    entries: buildStoreSitemapEntries({
      baseUrl,
      indexable,
      pages: site?.pages ?? [],
      products,
      extra,
      catalogPage: Boolean(site),
      // One category is the whole catalog again, and the page shows no link to it.
      categoryKeys: withProducts.length > 1 ? withProducts.map((category) => category.key) : [],
      categoryLastModified: Object.fromEntries(withProducts.map((category) => [category.key, category.lastProductUpdatedAt ?? null])),
      // A store with no live site has no builder pages; its home is the classic catalog.
      publishedAt: site ? publishedAt : null,
      locales: storeIndexLocales(store.supportedLocales),
      defaultLocale: store.defaultLocale,
    }),
  };
}
