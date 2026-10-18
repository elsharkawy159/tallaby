import { storeUrl } from "@workspace/lib/storefront";
import { getCachedPublishedSite } from "@/lib/store-site/published-site.server";
import {
  catalogStoreId,
  getRenamedStoreSubdomain,
  getStorefrontBySubdomain,
  isStorefrontIndexable,
  type Storefront,
} from "@/lib/storefront.server";
import { fetchActiveProductTranslations } from "./sitemap.server";
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
 * Extra URL providers for store sitemaps. Blog posts and CMS items (P4-16,
 * P4-11) are added here, e.g. a provider wrapping `listPublicCmsUrls(storeId)`
 * that maps each published item to `{ path, lastModified }`. A provider must
 * list only published, public URLs of that one store.
 */
export const STORE_SITEMAP_URL_PROVIDERS: StoreSitemapUrlProvider[] = [];

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
  const [site, products, extra] = await Promise.all([
    getCachedPublishedSite(store.id, store.storeId, store.subdomain),
    fetchActiveProductTranslations({ sellerId: store.id, selectedStoreId: catalogStoreId(store) }),
    extraUrls(scope),
  ]);

  return {
    baseUrl,
    indexable,
    entries: buildStoreSitemapEntries({ baseUrl, indexable, pages: site?.pages ?? [], products, extra }),
  };
}
