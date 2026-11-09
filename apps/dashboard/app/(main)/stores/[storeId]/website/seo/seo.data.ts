import { parseStoreSeo, storeSeoDefaults, suggestStoreKeywords } from "@workspace/lib/stores";
import { storeHasVisibleProducts, type StoreRow } from "@workspace/lib/stores/server";
import { storeCategoryGroups } from "@workspace/lib/store-sites/catalog-data";
import { storeUrl } from "@workspace/lib/storefront";
import { loadWebsitePages } from "../website.data";
import type { WebsitePageRow } from "../website.types";

/**
 * Data for Website › SEO (2026-11-09). Every read takes a store already loaded
 * through loadStorePage (ownership checked) and stays scoped to it.
 */

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
export async function loadCrawlStatus(store: StoreRow, liveDomain: string | null): Promise<CrawlStatus> {
  const hasProducts = await storeHasVisibleProducts(store.sellerId, store.id);
  const baseUrl = storeUrl(store.subdomain, liveDomain);
  const reasons: NoindexReason[] = [];
  if (store.status !== "active") reasons.push("storeInactive");
  if (!parseStoreSeo(store.seo).indexing) reasons.push("indexingOff");
  if (!hasProducts) reasons.push("noProducts");
  return { baseUrl, sitemapUrl: `${baseUrl}/sitemap.xml`, robotsUrl: `${baseUrl}/robots.txt`, reasons };
}

/** What the storefront uses when a field is left empty, in the store's default language. */
export type StoreSeoDefaultsView = {
  locale: "ar" | "en";
  homeTitle: string;
  titleTemplate: string;
  description: string;
  /** Keywords rendered when the seller saved none. */
  keywords: string[];
  /** "Use suggestion" for the store keywords: name, category and product categories. */
  suggestedKeywords: string[];
};

const CATEGORY_SUGGESTIONS = 8;

export async function loadSeoDefaults(store: StoreRow): Promise<StoreSeoDefaultsView> {
  const locale = store.defaultLocale === "en" ? "en" : "ar";
  const source = { name: store.name, description: store.description, storeCategory: store.storeCategory, storeCategoryAr: store.storeCategoryAr };
  // The categories shoppers see, biggest first; a failed read only means fewer suggestions.
  const groups = await storeCategoryGroups(store.sellerId, store.catalogMode === "selected" ? store.id : undefined).catch(() => []);
  const categories = [...groups].sort((a, b) => b.productCount - a.productCount).slice(0, CATEGORY_SUGGESTIONS);
  // Defaults that ignore what is saved: the form shows them for empty fields.
  const defaults = storeSeoDefaults(source, {}, locale);
  return {
    locale,
    homeTitle: defaults.homeTitle,
    titleTemplate: defaults.titleTemplate,
    description: defaults.description,
    keywords: defaults.keywords,
    suggestedKeywords: suggestStoreKeywords(source, categories),
  };
}

/** The pages whose SEO the seller edits here: every draft page but the product page (its products have their own SEO). */
export async function loadSeoPages(store: StoreRow): Promise<WebsitePageRow[]> {
  const pages = await loadWebsitePages(store);
  return pages.filter((page) => page.kind !== "product");
}
