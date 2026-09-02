export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

/**
 * Public storefront origin. `BASE_URL` above is the *dashboard's* own origin,
 * so anything linking a vendor out to the customer-facing site must use this.
 */
export const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://www.tallaby.com";

export const getStorefrontProductUrl = (slug: string) =>
  `${STOREFRONT_URL}/products/${slug}`;
