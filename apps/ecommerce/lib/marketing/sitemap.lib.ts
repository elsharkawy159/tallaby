import { escapeXml, SITEMAP_STYLESHEET_PATH } from "@/lib/sitemap/sitemap.lib";
import { compareLastModified } from "./compare.lib";
import type { MarketingSitemapEntry } from "./seo.lib";

/**
 * Sitemap `lastModified` dates for tallaby.com's own pages (not blog posts,
 * which carry their own). Each is the day the page's code or copy last really
 * changed: bump a page's date when you change what it says, not for every
 * deploy, so search engines can trust it.
 */
export const STATIC_PAGE_LASTMOD: Record<string, string> = {
  "/": "2026-11-09",
  "/templates": "2026-11-06",
  "/pricing": "2026-11-08",
  "/affiliates": "2026-11-04",
  "/blog": "2026-11-06",
  "/about": "2026-11-04",
  "/careers": "2026-11-04",
  "/contact": "2026-11-06",
  "/faq": "2026-11-04",
  "/terms": "2026-11-09",
  "/privacy": "2026-11-09",
  "/follow-us": "2026-11-04",
};

/** The content pages (features, integrations, tools, industries, solutions, compare) unless one is listed in STATIC_PAGE_LASTMOD. */
export const CONTENT_PAGES_LASTMOD = "2026-11-06";

/**
 * Content pages (from `contentPagePaths()`) whose copy changed after
 * CONTENT_PAGES_LASTMOD. Never put a static page here: STATIC_PAGE_LASTMOD's
 * keys are also the static path list, so it would be listed twice.
 */
export const CONTENT_PAGE_LASTMOD: Record<string, string> = {
  "/industries": "2026-11-10",
  "/industries/clothing-store": "2026-11-10",
  "/industries/beauty-store": "2026-11-10",
  "/industries/perfume-store": "2026-11-10",
  "/industries/electronics-store": "2026-11-10",
  "/industries/home-furniture-store": "2026-11-10",
  "/industries/jewelry-accessories-store": "2026-11-10",
  "/industries/food-store": "2026-11-10",
  "/industries/kids-store": "2026-11-10",
  "/industries/car-accessories-store": "2026-11-10",
  "/industries/handmade-store": "2026-11-10",
  "/industries/sports-store": "2026-11-10",
  "/solutions": "2026-11-10",
  "/features": "2026-11-10",
  "/tools": "2026-11-10",
  "/solutions/free-online-store": "2026-11-10",
  "/solutions/online-store-egypt": "2026-11-10",
  "/solutions/create-online-store": "2026-11-10",
  "/solutions/cash-on-delivery-store": "2026-11-10",
  "/features/ai-online-store": "2026-11-10",
  "/features/fake-order-protection": "2026-11-10",
  "/features/abandoned-checkouts": "2026-11-10",
  "/features/shipping": "2026-11-10",
  "/integrations/bosta": "2026-11-10",
  "/integrations/paymob": "2026-11-10",
  "/integrations/kashier": "2026-11-10",
  "/tools/store-cost-calculator": "2026-11-10",
  "/tools/profit-margin-calculator": "2026-11-10",
};

/** A page's sitemap date: its own entry, a compare page's facts date, else the content pages' date. */
export function pageLastModified(path: string): string {
  return STATIC_PAGE_LASTMOD[path] ?? CONTENT_PAGE_LASTMOD[path] ?? compareLastModified(path) ?? CONTENT_PAGES_LASTMOD;
}

/**
 * tallaby.com's /sitemap.xml text: the same XML Next's `sitemap.ts` metadata
 * route wrote (urlset, `xhtml:link` alternates, lastmod), plus the stylesheet
 * instruction that renders it as a readable page in a browser (crawlers ignore
 * it) and XML escaping of every value.
 */
export function serializeMarketingSitemap(entries: readonly MarketingSitemapEntry[]): string {
  // Next's rule: the namespace whenever any entry has an `alternates` object.
  const hasAlternates = entries.some((e) => Object.keys(e.alternates ?? {}).length > 0);
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="${SITEMAP_STYLESHEET_PATH}"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasAlternates ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ""}>\n`;
  for (const entry of entries) {
    xml += `<url>\n<loc>${escapeXml(entry.url)}</loc>\n`;
    for (const [lang, href] of Object.entries(entry.alternates?.languages ?? {})) {
      xml += `<xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />\n`;
    }
    if (entry.lastModified) xml += `<lastmod>${escapeXml(entry.lastModified)}</lastmod>\n`;
    xml += "</url>\n";
  }
  return `${xml}</urlset>\n`;
}
