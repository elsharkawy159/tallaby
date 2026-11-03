/**
 * Pure SEO rules for the tallaby.com pages: URLs, hreflang, sitemap entries and
 * template descriptions. Shared by metadata.lib.ts and app/sitemap.ts so the
 * pages and the sitemap always advertise the same alternates.
 */
import { routing } from "@/i18n/routing";
import { SITE_URL } from "./site.lib";

/** Absolute URL for a path in a locale ("as-needed": Arabic is unprefixed). */
export function localizedUrl(locale: string, path: string): string {
  const clean = path === "/" ? "" : path;
  return locale === routing.defaultLocale ? `${SITE_URL}${clean}` || SITE_URL : `${SITE_URL}/${locale}${clean}`;
}

/** hreflang map for the locales a page exists in; x-default is Arabic when it exists, else the first. */
export function hreflangMap(path: string, locales: readonly string[] = routing.locales): Record<string, string> {
  const fallback = locales.includes(routing.defaultLocale) ? routing.defaultLocale : locales[0]!;
  return {
    ...Object.fromEntries(locales.map((l) => [l, localizedUrl(l, path)])),
    "x-default": localizedUrl(fallback, path),
  };
}

export type MarketingSitemapEntry = {
  url: string;
  lastModified?: string;
  alternates: { languages: Record<string, string> };
};

/** One sitemap row per language version, each listing all of its alternates (Google's recommended form). */
export function sitemapEntries(
  path: string,
  locales: readonly string[] = routing.locales,
  lastModified?: string,
): MarketingSitemapEntry[] {
  const languages = hreflangMap(path, locales);
  return locales.map((locale) => ({
    url: localizedUrl(locale, path),
    ...(lastModified && { lastModified }),
    alternates: { languages },
  }));
}

/** Room for a template blurb so "{desc}. Free, fully editable and mobile-ready." stays near 160 characters. */
const TEMPLATE_DESC_MAX = 115;

/**
 * A template blurb ready for the "{desc}. ..." message: no closing punctuation
 * (blurbs end in "." and would render ".."), cut on a word when too long.
 */
export function templateMetaDesc(desc: string): string {
  const trimmed = desc.trim();
  const cut =
    trimmed.length > TEMPLATE_DESC_MAX
      ? trimmed.slice(0, TEMPLATE_DESC_MAX).replace(/\s+\S*$/, "")
      : trimmed;
  return cut.replace(/[\s.,،؛;:!?؟…]+$/u, "");
}
