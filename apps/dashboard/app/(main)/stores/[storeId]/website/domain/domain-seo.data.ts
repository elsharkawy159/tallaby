import { parseStoreSeo } from "@workspace/lib/stores";
import {
  getPrimaryStore,
  listStoreRedirects,
  storeHasVisibleProducts,
  type StoreRow,
} from "@workspace/lib/stores/server";
import { storeUrl } from "@workspace/lib/storefront";
import { getCustomDomain, type CustomDomainView } from "@/actions/custom-domain";

/**
 * Data for the Domain & SEO pages (P4-14). Every read takes a store already
 * loaded through loadStorePage (ownership checked) and stays scoped to it.
 */

export type DomainTabData = {
  customDomain: CustomDomainView | null;
  /** The live custom domain, if any (the address to share). */
  liveDomain: string | null;
  redirects: { subdomain: string; createdAt: string }[];
  /** For a non-primary store: where custom domains are managed today. */
  primaryStore: { id: string; name: string } | null;
};

export async function loadDomainTab(store: StoreRow): Promise<DomainTabData> {
  const [domainRes, redirects, primary] = await Promise.all([
    getCustomDomain(store.id),
    listStoreRedirects(store.sellerId, store.id),
    store.isPrimary ? Promise.resolve(null) : getPrimaryStore(store.sellerId),
  ]);
  const customDomain = domainRes.success ? domainRes.domain : null;
  return {
    customDomain,
    liveDomain: customDomain?.status === "active" ? customDomain.domain : null,
    redirects,
    primaryStore: primary ? { id: primary.id, name: primary.name } : null,
  };
}

/** The store's live (active) custom domain, or null when it only has its subdomain. */
export async function loadLiveDomain(store: StoreRow): Promise<string | null> {
  const res = await getCustomDomain(store.id);
  return res.success && res.domain?.status === "active" ? res.domain.domain : null;
}

/** Why a store is kept out of search; empty = indexable. */
export type NoindexReason = "storeInactive" | "indexingOff" | "noProducts";

export type CrawlStatus = {
  baseUrl: string;
  sitemapUrl: string;
  robotsUrl: string;
  reasons: NoindexReason[];
};

/**
 * Mirrors the storefront rule (apps/ecommerce isStorefrontIndexable): a live
 * store is indexed when indexing is on and it shows at least one product.
 */
export async function loadCrawlStatus(store: StoreRow): Promise<CrawlStatus> {
  const [live, hasProducts] = await Promise.all([
    loadLiveDomain(store),
    storeHasVisibleProducts(store.sellerId, store.id),
  ]);
  const baseUrl = storeUrl(store.subdomain, live);
  const reasons: NoindexReason[] = [];
  if (store.status !== "active") reasons.push("storeInactive");
  if (!parseStoreSeo(store.seo).indexing) reasons.push("indexingOff");
  if (!hasProducts) reasons.push("noProducts");
  return { baseUrl, sitemapUrl: `${baseUrl}/sitemap.xml`, robotsUrl: `${baseUrl}/robots.txt`, reasons };
}
