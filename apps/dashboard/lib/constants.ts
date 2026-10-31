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
export const SUPPORT_EMAIL = "omar@tallaby.com";

export const getSupportWhatsAppUrl = (message: string) =>
  `${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(message)}`;

/** Tallaby's WhatsApp channel: platform news and selling tips for sellers. */
export const TALLABY_WHATSAPP_CHANNEL_URL =
  "https://whatsapp.com/channel/0029Vb9CWoJInlqNOoVPaN2X";

/** Tallaby's official social accounts (same as the tallaby.com footer). */
export const TALLABY_SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/usetallaby",
  facebook: "https://www.facebook.com/usetallaby",
  tiktok: "https://www.tiktok.com/@tallaby_",
  youtube: "https://www.youtube.com/@usetallaby",
  x: "https://x.com/usetallaby",
  threads: "https://www.threads.net/@usetallaby",
  pinterest: "https://www.pinterest.com/tallabycommerce",
} as const;
