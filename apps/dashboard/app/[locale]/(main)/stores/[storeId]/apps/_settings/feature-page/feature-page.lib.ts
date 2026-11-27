import type { AppFeaturePage } from "@workspace/apps";

/**
 * Where each `feature_page` app's own dashboard page is (owner, 2026-11-27).
 * Store-scoped pages get this store; the pages under /coupons and /marketing
 * pick the store themselves (`?store=` where they read it). Typed as a full
 * Record, so a new APP_FEATURE_PAGES key does not compile without its page.
 */
export const FEATURE_PAGE_HREFS: Record<AppFeaturePage, (storeId: string) => string> = {
  coupons: () => "/coupons",
  automatic_discounts: (storeId) => `/marketing/discounts?store=${encodeURIComponent(storeId)}`,
  quantity_offers: (storeId) => `/stores/${encodeURIComponent(storeId)}/products`,
  bundles: (storeId) => `/stores/${encodeURIComponent(storeId)}/products?tab=bundles`,
  email_campaigns: (storeId) => `/marketing/emails?store=${encodeURIComponent(storeId)}`,
  catalog_share: () => "/marketing/catalog",
  order_protection: (storeId) => `/stores/${encodeURIComponent(storeId)}/settings/protection`,
  missed_orders: (storeId) => `/orders/missed?store=${encodeURIComponent(storeId)}`,
  store_app: (storeId) => `/stores/${encodeURIComponent(storeId)}/settings/app`,
  languages: (storeId) => `/stores/${encodeURIComponent(storeId)}/settings#languages`,
  shoppable_gallery: (storeId) => `/stores/${encodeURIComponent(storeId)}/editor`,
  min_order: (storeId) => `/stores/${encodeURIComponent(storeId)}/settings/checkout#min-order`,
};

export function featurePageHref(page: AppFeaturePage, storeId: string): string {
  return FEATURE_PAGE_HREFS[page](storeId);
}
