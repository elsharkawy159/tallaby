/*
 * The "View" link on the product-saved toast (and the product links that open
 * the storefront): the product page on the seller's live store. Pure, so the
 * client builds it from the slug it just saved and the server only hands down
 * the store's address and whether its site is live.
 */

/** Where a store's product pages live and whether visitors can see them. */
export type ProductViewTarget = {
  /** `storeUrl(subdomain, customDomain)`, e.g. `https://faster.tallaby.com`. */
  storeBaseUrl: string;
  /** The store is active and its website published (`isStoreSiteLive`). */
  siteLive: boolean;
};

/**
 * A product page on a store. The plain (unprefixed) address serves the store's
 * default language (storefront `storeLocaleDecision`), so no locale prefix.
 */
export function productPageUrl(storeBaseUrl: string, slug: string): string {
  return `${storeBaseUrl}/products/${encodeURIComponent(slug)}`;
}

/**
 * Visitors see a store's site only while the store is active (the storefront
 * resolves no other store) and its website is published: a never-published or
 * unpublished site shows the offline page (CLAUDE.md rule 12).
 */
export function isStoreSiteLive(store: { status: string | null | undefined; siteStatus: string | null | undefined }): boolean {
  return store.status === "active" && store.siteStatus === "published";
}

/** The product's live page, or null when a visitor could not open it (draft, no slug, store offline). */
export function productViewUrl({
  status,
  slug,
  target,
}: {
  status: string | null | undefined;
  slug: string | null | undefined;
  target: ProductViewTarget | null | undefined;
}): string | null {
  const cleanSlug = slug?.trim();
  if (status !== "active" || !cleanSlug || !target?.siteLive) return null;
  return productPageUrl(target.storeBaseUrl, cleanSlug);
}
