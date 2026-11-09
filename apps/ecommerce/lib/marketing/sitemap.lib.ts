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

/** A page's sitemap date: its own entry, else the content pages' date. */
export function pageLastModified(path: string): string {
  return STATIC_PAGE_LASTMOD[path] ?? CONTENT_PAGES_LASTMOD;
}
