import type { SiteConfig, SitePage } from "./schema";

/** `kind` of a site page. Absent means "page". */
export const PAGE_KINDS = ["page", "product"] as const;
export type PageKind = (typeof PAGE_KINDS)[number];

/** The product page's slug. It is reserved for normal pages (it shadows the storefront route). */
export const PRODUCT_PAGE_SLUG = "product";

export function isProductPage(page: Pick<SitePage, "kind">): boolean {
  return page.kind === "product";
}

export function productPageOf(config: Pick<SiteConfig, "pages">): SitePage | undefined {
  return config.pages.find(isProductPage);
}

/** Pages a visitor can navigate to as normal pages: everything but the product page. */
export function navPages<T extends Pick<SitePage, "kind">>(config: { pages: T[] }): T[] {
  return config.pages.filter((p) => !isProductPage(p));
}
