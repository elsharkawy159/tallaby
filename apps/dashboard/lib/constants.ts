export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

/**
 * Public storefront origin. `BASE_URL` above is the *dashboard's* own origin,
 * so anything linking a vendor out to the customer-facing site must use this.
 */
export const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL || "https://www.tallaby.com";

export const getStorefrontProductUrl = (slug: string) =>
  `${STOREFRONT_URL}/products/${slug}`;

export const getStorefrontStoreUrl = (slug: string) =>
  `${STOREFRONT_URL}/stores/${slug}`;

/** Tallaby seller-support WhatsApp line (digits only, international format). */
export const SUPPORT_WHATSAPP_NUMBER = "201003272830";

export const getSupportWhatsAppUrl = (message: string) =>
  `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
