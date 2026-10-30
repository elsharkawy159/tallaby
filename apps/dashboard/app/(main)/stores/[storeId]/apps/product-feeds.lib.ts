/**
 * Product feed addresses for Apps › Product feeds (ROADMAP.md F-11b). Pure.
 * The feed itself is served by the store host (apps/ecommerce
 * app/api/feeds/[file]/route.ts), which resolves the store from the host:
 * the URL never carries a store or seller id.
 */

/** The three catalog apps a feed card is shown for, in display order. */
export const FEED_PLATFORMS = ["meta", "google", "tiktok"] as const;
export type FeedPlatform = (typeof FEED_PLATFORMS)[number];

/** Numbered setup steps per platform (message keys `productFeeds.<platform>.step1…`). */
export const FEED_STEP_KEYS = ["step1", "step2", "step3", "step4"] as const;

export interface StoreFeedUrls {
  /** RSS 2.0 XML in the store's default language: what every platform takes. */
  xml: string;
  /** Same feed as CSV. */
  csv: string;
  /** English content, when the store offers English as well. */
  xmlEnglish: string | null;
}

/**
 * The feed addresses of a store, on its live origin (its active custom
 * domain, else its subdomain: `storeUrl`).
 */
export function storeFeedUrls(origin: string, supportedLocales: readonly string[] | null | undefined): StoreFeedUrls {
  const base = `${origin.replace(/\/$/, "")}/api/feeds`;
  const locales = supportedLocales ?? [];
  const defaultLocale = locales[0] === "en" ? "en" : "ar";
  return {
    xml: `${base}/products.xml`,
    csv: `${base}/products.csv`,
    xmlEnglish: defaultLocale !== "en" && locales.includes("en") ? `${base}/products.xml?lang=en` : null,
  };
}
