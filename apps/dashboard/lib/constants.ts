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

/** Tallaby seller-support WhatsApp username. Our mobile number is never shown. */
export const SUPPORT_WHATSAPP_HANDLE = "@tallaby";

export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_HANDLE}`;

/** Tallaby seller-support inbox. */
export const SUPPORT_EMAIL = "tallabycommerce@gmail.com";

export const getSupportWhatsAppUrl =(message: string) =>
  `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
