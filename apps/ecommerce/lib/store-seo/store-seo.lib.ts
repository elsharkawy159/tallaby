/**
 * Storefront metadata built from the store and its SEO settings (PLAN.md
 * §10.4, P4-14, P5-04). Pure, so the layout and the tests share one rule set.
 */
import type { Metadata } from "next";
import { storeUrl } from "@workspace/lib/storefront";
import { appIconVersion, appShortName } from "@workspace/lib/stores/app";
import {
  FACEBOOK_DOMAIN_VERIFICATION_RE,
  GOOGLE_SITE_VERIFICATION_RE,
  TITLE_TEMPLATE_TOKEN,
  type StoreSeo,
} from "@workspace/lib/stores";
import { getPublicUrl } from "@workspace/ui/lib/utils";

/** Robots value for a store kept out of search; links are still followed. */
export const STORE_NOINDEX = { index: false, follow: true } as const;

export type StoreMetadataInput = {
  displayName: string;
  subdomain: string;
  customDomain: string | null;
  description: string | null;
  storeDescription?: string | null;
  logoUrl: string | null;
  /** Website › Design system › Brand (P4-13); the logo is the fallback icon. */
  faviconUrl?: string | null;
  bannerUrl: string | null;
  seo: StoreSeo;
};

/**
 * The title template, with the store name as the fallback. A template that
 * lost its single "%s" (only possible in hand-edited data) is not used.
 */
export function storeTitleTemplate(seo: StoreSeo, displayName: string): string {
  const template = seo.titleTemplate;
  if (template && template.split(TITLE_TEMPLATE_TOKEN).length === 2) return template;
  return `${TITLE_TEMPLATE_TOKEN} | ${displayName}`;
}

/**
 * The store's title and description when the seller wrote none (ROADMAP.md
 * F-48a). Built at render time, so existing stores get it too: their saved
 * template copies never change. `category` is the store's category label in
 * the visitor's language, when it has one.
 */
export function storeSeoFallback(name: string, category: string | null | undefined, locale: string): { title: string; description: string } {
  const label = category?.trim() || null;
  if (locale === "ar") {
    return {
      title: label ? `اشتري ${label} من ${name} الآن | طلبي` : `تسوّق من ${name} الآن | طلبي`,
      description: label
        ? `تصفح ${label} من ${name} واطلب أونلاين بخطوات بسيطة.`
        : `تصفح منتجات ${name} واطلب أونلاين بخطوات بسيطة.`,
    };
  }
  return {
    title: label ? `Buy ${label} from ${name} now | Tallaby` : `Shop from ${name} now | Tallaby`,
    description: label
      ? `Browse ${label} from ${name} and order online in a few simple steps.`
      : `Browse ${name}'s products and order online in a few simple steps.`,
  };
}

/**
 * Layout-level metadata for a store host. Builder pages and product pages
 * override the title/description of their own page. The Search Console and
 * Meta tokens are passed only through Next's `verification` field, which
 * renders them as escaped `<meta name="google-site-verification">` and
 * `<meta name="facebook-domain-verification">` tags.
 *
 * The fallback title is only `title.default` (pages with no title of their
 * own, like the home page): Next.js does not run a layout's template over its
 * own default, so the store name is never added twice. A seller who wrote a
 * title template keeps the plain store name there, as before.
 */
export function buildStoreMetadata(
  store: StoreMetadataInput,
  locale: string,
  { indexable, category }: { indexable: boolean; category?: string | null },
): Metadata {
  const url = storeUrl(store.subdomain, store.customDomain);
  const { seo } = store;
  const fallback = storeSeoFallback(store.displayName, category, locale);
  const description = seo.description || store.description || store.storeDescription || fallback.description;
  const title = seo.titleTemplate ? store.displayName : fallback.title;
  const image = seo.shareImageUrl || store.bannerUrl || store.logoUrl;
  const verification = storeVerification(seo);

  return {
    // Other pages carry the store's name, not Tallaby's.
    title: { default: title, template: storeTitleTemplate(seo, store.displayName) },
    description,
    metadataBase: new URL(url),
    alternates: {
      canonical: locale === "ar" ? url : `${url}/${locale}`,
      languages: { ar: url, en: `${url}/en`, "x-default": url },
    },
    openGraph: {
      type: "website",
      url,
      siteName: store.displayName,
      title,
      description,
      images: image ? [getPublicUrl(image, "sellers")] : undefined,
    },
    icons: {
      ...((store.faviconUrl || store.logoUrl) && { icon: getPublicUrl((store.faviconUrl || store.logoUrl)!, "sellers") }),
      // The store app's home-screen icon (ROADMAP.md F-36), drawn from the favicon by /app-icon.
      apple: `/app-icon/180.png?v=${appIconVersion(store.faviconUrl || store.logoUrl || null, store.displayName)}`,
    },
    // Added to the iPhone home screen: the store's name, full screen.
    appleWebApp: { capable: true, title: appShortName(store.displayName), statusBarStyle: "default" },
    // Zero visible products or indexing switched off (PLAN.md §10.3).
    ...(!indexable && { robots: STORE_NOINDEX }),
    ...(verification && { verification }),
  };
}

/**
 * Search Console and Meta domain verification tags. Each token is checked
 * against its pattern again here, so a bad stored value renders nothing.
 */
function storeVerification(seo: StoreSeo): Metadata["verification"] | undefined {
  const google = seo.googleSiteVerification;
  const facebook = seo.facebookDomainVerification;
  const hasGoogle = Boolean(google && GOOGLE_SITE_VERIFICATION_RE.test(google));
  const hasFacebook = Boolean(facebook && FACEBOOK_DOMAIN_VERIFICATION_RE.test(facebook));
  if (!hasGoogle && !hasFacebook) return undefined;
  return {
    ...(hasGoogle && { google: google! }),
    ...(hasFacebook && { other: { "facebook-domain-verification": facebook! } }),
  };
}
