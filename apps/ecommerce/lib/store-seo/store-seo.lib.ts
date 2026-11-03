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
import { buildAlternates, buildLocalizedUrl } from "@/lib/sitemap/sitemap.lib";

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
  /** Store settings › Languages. A language the store doesn't offer gets no hreflang and no sitemap URL. */
  supportedLocales?: readonly string[] | null;
};

export type StoreLocale = "ar" | "en";

/** The languages search engines are told about; an empty or unusable setting means both, the default. */
export function storeIndexLocales(supported: readonly string[] | null | undefined): StoreLocale[] {
  const locales = (["ar", "en"] as const).filter((locale) => supported?.includes(locale));
  return locales.length ? locales : ["ar", "en"];
}

/**
 * Canonical and hreflang of one store page. `paths` is the path in every
 * language, or per language where they differ (product slugs). A page opened
 * in a language the store doesn't offer names the offered one as canonical,
 * so it never competes with it. One language means no hreflang at all.
 */
export function storeAlternates(
  store: Pick<StoreMetadataInput, "subdomain" | "customDomain" | "supportedLocales">,
  locale: string,
  paths: string | Partial<Record<StoreLocale, string>>,
): { canonical: string; languages?: Record<string, string> } {
  const base = storeUrl(store.subdomain, store.customDomain);
  const urls: Partial<Record<StoreLocale, string>> = {};
  for (const l of storeIndexLocales(store.supportedLocales)) {
    const path = typeof paths === "string" ? paths : paths[l];
    if (path !== undefined) urls[l] = buildLocalizedUrl(base, l, path);
  }
  const current = locale === "ar" || locale === "en" ? urls[locale] : undefined;
  const anyPath = typeof paths === "string" ? paths : (paths.ar ?? paths.en ?? "");
  const canonical = current ?? urls.ar ?? urls.en ?? buildLocalizedUrl(base, locale === "en" ? "en" : "ar", anyPath);
  return { canonical, ...(Object.keys(urls).length > 1 && { languages: buildAlternates(urls) }) };
}

/** The share image of a page with none of its own. */
function storeShareImage(store: Pick<StoreMetadataInput, "seo" | "bannerUrl" | "logoUrl">): string | undefined {
  const image = store.seo.shareImageUrl || store.bannerUrl || store.logoUrl;
  return image ? getPublicUrl(image, "sellers") : undefined;
}

const ogLocale = (locale: string) => (locale === "ar" ? "ar_EG" : "en_US");

export type StorePageSeo = {
  paths: string | Partial<Record<StoreLocale, string>>;
  title: string;
  description?: string | null;
  /** An absolute URL; the store's share image when there is none. */
  image?: string | null;
  imageAlt?: string;
  article?: { publishedTime?: string | null; modifiedTime?: string | null; authors?: string[]; tags?: string[] };
  noindex?: boolean;
};

/**
 * The metadata of one store page, so every page names its own address, title
 * and image in search and in shared links.
 *
 * Next.js replaces `alternates` and `openGraph` whole, and treats a key set
 * to `undefined` as "clear it": `robots: undefined` wipes the layout's
 * store-wide noindex. So a key is only present when it has a value.
 */
export function storePageMetadata(store: StoreMetadataInput, locale: string, page: StorePageSeo): Metadata {
  const alternates = storeAlternates(store, locale, page.paths);
  const image = page.image || storeShareImage(store);
  const article = page.article;
  return {
    title: page.title,
    ...(page.description && { description: page.description }),
    alternates,
    openGraph: {
      ...(article
        ? {
            type: "article" as const,
            ...(article.publishedTime && { publishedTime: article.publishedTime }),
            ...(article.modifiedTime && { modifiedTime: article.modifiedTime }),
            ...(article.authors?.length && { authors: article.authors }),
            ...(article.tags?.length && { tags: article.tags }),
          }
        : { type: "website" as const }),
      url: alternates.canonical,
      siteName: store.displayName,
      locale: ogLocale(locale),
      title: page.title,
      ...(page.description && { description: page.description }),
      ...(image && { images: [{ url: image, ...(page.imageAlt && { alt: page.imageAlt }) }] }),
    },
    // Next fills the rest from Open Graph.
    twitter: { card: image ? "summary_large_image" : "summary" },
    ...(page.noindex && { robots: STORE_NOINDEX }),
  };
}

/**
 * The catalog page's own address and whether it may be indexed. A category is
 * a landing page of its own; sorting is the same page; a search result is not
 * worth indexing. Later pages name themselves, so their products stay reachable.
 */
export function storeCatalogSeo(query: { category?: string; search?: string; page?: number }): { path: string; noindex: boolean } {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const qs = params.toString();
  return { path: `/products${qs ? `?${qs}` : ""}`, noindex: Boolean(query.search) };
}

/** The store's own identity for search engines, on its home page. */
export function storeStructuredData(
  store: Pick<StoreMetadataInput, "displayName" | "subdomain" | "customDomain" | "logoUrl" | "description"> & {
    social?: readonly { url: string }[] | null;
    supportEmail?: string | null;
    supportPhone?: string | null;
  },
  locale: string,
): Record<string, unknown>[] {
  const url = storeUrl(store.subdomain, store.customDomain);
  const sameAs = (store.social ?? []).map((link) => link.url).filter((link) => /^https?:\/\//i.test(link));
  return [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      "@id": `${url}/#store`,
      name: store.displayName,
      url,
      ...(store.logoUrl && { logo: getPublicUrl(store.logoUrl, "sellers") }),
      ...(store.description && { description: store.description }),
      ...(store.supportEmail && { email: store.supportEmail }),
      ...(store.supportPhone && { telephone: store.supportPhone }),
      ...(sameAs.length && { sameAs }),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${url}/#website`,
      name: store.displayName,
      url,
      inLanguage: locale,
      publisher: { "@id": `${url}/#store` },
    },
  ];
}

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
  const { title, description } = storeHomeDefaults(store, locale, category);
  const image = storeShareImage(store);
  const verification = storeVerification(seo);
  const alternates = storeAlternates(store, locale, "");

  return {
    // Other pages carry the store's name, not Tallaby's.
    title: { default: title, template: storeTitleTemplate(seo, store.displayName) },
    description,
    metadataBase: new URL(url),
    alternates,
    openGraph: {
      type: "website",
      url: alternates.canonical,
      siteName: store.displayName,
      locale: ogLocale(locale),
      title,
      description,
      ...(image && { images: [image] }),
    },
    // The (shop) layout above this one speaks for tallaby.com: nothing of it stays on a store.
    twitter: { card: image ? "summary_large_image" : "summary" },
    keywords: null,
    authors: null,
    creator: null,
    publisher: null,
    category: null,
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

/** The home page's title and description when its page has no SEO text of its own. */
function storeHomeDefaults(store: StoreMetadataInput, locale: string, category: string | null | undefined) {
  const fallback = storeSeoFallback(store.displayName, category, locale);
  return {
    title: store.seo.titleTemplate ? store.displayName : fallback.title,
    description: store.seo.description || store.description || store.storeDescription || fallback.description,
  };
}

/**
 * What the seller wrote in Website › Pages for the home page, on top of the
 * layout's metadata (which still gives its canonical and hreflang). Nothing
 * written means nothing changes. The store name isn't added to a title that
 * already has it.
 */
export function storeHomeMetadata(
  store: StoreMetadataInput,
  locale: string,
  seo: { title?: string; description?: string; ogImage?: string; noindex?: boolean } | null | undefined,
  category?: string | null,
): Metadata {
  if (!seo?.title && !seo?.description && !seo?.ogImage && !seo?.noindex) return {};
  const defaults = storeHomeDefaults(store, locale, category);
  const title = seo.title || defaults.title;
  const description = seo.description || defaults.description;
  const image = seo.ogImage ? getPublicUrl(seo.ogImage, "sellers") : storeShareImage(store);
  return {
    ...(seo.title && { title: seo.title.includes(store.displayName) ? { absolute: seo.title } : seo.title }),
    ...(seo.description && { description: seo.description }),
    openGraph: {
      type: "website",
      url: storeAlternates(store, locale, "").canonical,
      siteName: store.displayName,
      locale: ogLocale(locale),
      title,
      description,
      ...(image && { images: [image] }),
    },
    ...(seo.noindex && { robots: STORE_NOINDEX }),
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
