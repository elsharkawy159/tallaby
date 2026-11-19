import { resolveRouteData } from "next/dist/build/webpack/loaders/metadata/resolve-route-data";
import { describe, expect, it } from "vitest";
import { contentPagePaths } from "./content-routes.lib";
import { type MarketingSitemapEntry, sitemapEntries } from "./seo.lib";
import { CONTENT_PAGES_LASTMOD, pageLastModified, serializeMarketingSitemap, STATIC_PAGE_LASTMOD } from "./sitemap.lib";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

describe("sitemap lastModified", () => {
  it("gives every static page a real, past date", () => {
    for (const [path, date] of Object.entries(STATIC_PAGE_LASTMOD)) {
      expect(date, path).toMatch(ISO_DAY);
      expect(Number.isNaN(Date.parse(date)), path).toBe(false);
      expect(Date.parse(date) <= Date.now(), path).toBe(true);
    }
    expect(Object.keys(STATIC_PAGE_LASTMOD)).toEqual(expect.arrayContaining(["/", "/pricing", "/templates", "/privacy"]));
  });

  it("dates every content page", () => {
    expect(CONTENT_PAGES_LASTMOD).toMatch(ISO_DAY);
    for (const path of contentPagePaths(true)) expect(pageLastModified(path), path).toMatch(ISO_DAY);
    expect(pageLastModified("/pricing")).toBe(STATIC_PAGE_LASTMOD["/pricing"]);
  });
});

const PI = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n';

describe("serializeMarketingSitemap", () => {
  const entries: MarketingSitemapEntry[] = [
    ...sitemapEntries("/", undefined, "2026-11-09"),
    ...sitemapEntries("/pricing", undefined, pageLastModified("/pricing")),
    ...sitemapEntries("/templates/sage"),
    ...sitemapEntries("/blog/only-ar", ["ar"], "2026-10-01T10:20:30.000Z"),
  ];

  it("writes the XML Next's sitemap metadata route wrote, plus the stylesheet instruction", () => {
    const ours = serializeMarketingSitemap(entries);
    expect(ours.startsWith(`<?xml version="1.0" encoding="UTF-8"?>\n${PI}<urlset `)).toBe(true);
    expect(ours.replace(PI, "")).toBe(resolveRouteData(entries, "sitemap"));
  });

  it("matches Next for an entry with no languages", () => {
    const plain = [{ url: "https://www.tallaby.com/x", alternates: { languages: {} } }];
    expect(serializeMarketingSitemap(plain).replace(PI, "")).toBe(resolveRouteData(plain, "sitemap"));
  });

  it("escapes &, <, >, and quotes in URLs, alternates and lastmod", () => {
    const xml = serializeMarketingSitemap([
      {
        url: "https://www.tallaby.com/blog/a&b?x=<1>",
        lastModified: "2026-11-09",
        alternates: { languages: { ar: "https://www.tallaby.com/blog/a&b", en: `https://www.tallaby.com/en/blog/"q'` } },
      },
    ]);
    expect(xml).toContain("<loc>https://www.tallaby.com/blog/a&amp;b?x=&lt;1&gt;</loc>");
    expect(xml).toContain('hreflang="ar" href="https://www.tallaby.com/blog/a&amp;b" />');
    expect(xml).toContain('href="https://www.tallaby.com/en/blog/&quot;q&apos;" />');
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
  });
});
