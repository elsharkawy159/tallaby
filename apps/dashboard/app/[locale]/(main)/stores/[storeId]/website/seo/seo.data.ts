import { storeSeoDefaults, suggestStoreKeywords } from "@workspace/lib/stores";
import { storeHasVisibleProducts, type StoreRow } from "@workspace/lib/stores/server";
import { storeCategoryGroups } from "@workspace/lib/store-sites/catalog-data";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { loadWebsitePages } from "../website.data";
import type { WebsitePageRow } from "../website.types";

/**
 * Data for Website › SEO (2026-11-09). Every read takes a store already loaded
 * through loadStorePage (ownership checked) and stays scoped to it.
 */

/** Why a store is kept out of search besides its own switch; empty = indexable. */
export type NoindexReason = "storeInactive" | "noProducts";

/**
 * Why the store is kept out of search, besides the seller's own "Show in
 * search engines" switch (the form shows that one live). Mirrors the
 * storefront rule (apps/ecommerce isStorefrontIndexable): a live store is
 * indexed when indexing is on and it shows at least one product. The sitemap
 * and robots addresses moved to Apps › Google Search Console (2026-11-27).
 */
export async function loadNoindexReasons(store: StoreRow): Promise<NoindexReason[]> {
  const hasProducts = await storeHasVisibleProducts(store.sellerId, store.id, { catalogSplit: await isSwitchOn("stores_catalog_split") });
  const reasons: NoindexReason[] = [];
  if (store.status !== "active") reasons.push("storeInactive");
  if (!hasProducts) reasons.push("noProducts");
  return reasons;
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
  const groups = await storeCategoryGroups(store.sellerId, { storeId: store.id, catalogSplit: await isSwitchOn("stores_catalog_split") }).catch(() => []);
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
