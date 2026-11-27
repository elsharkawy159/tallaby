import { describe, expect, it, vi } from "vitest";
import { SITE_URL } from "./site.lib";

vi.mock("@/lib/marketing/templates.server", () => ({ getTemplateGallery: async () => [{ id: "sage" }] }));
vi.mock("@/lib/marketing/blog.server", () => ({
  getMarketingPosts: async () => [{ id: "first-post", hasArticle: true, date: "2026-11-01" }],
}));
vi.mock("@/lib/marketing/stores.server", () => ({
  getDirectoryStores: async () => [
    { name: "Wasel", url: "https://wasel.tallaby.com", logoUrl: null, industry: null, productCount: 4 },
    { name: "Tafawok", url: "https://tafawokcom.site", logoUrl: null, industry: null, productCount: 9 },
  ],
}));

const { getMarketingSitemapEntries } = await import("./sitemap.server");

describe("getMarketingSitemapEntries", () => {
  it("lists only URLs on tallaby.com's own host (a sitemap may not list other hosts)", async () => {
    const entries = await getMarketingSitemapEntries();
    const host = new URL(SITE_URL).host;
    const urls = entries.flatMap((e) => [e.url, ...Object.values(e.alternates.languages)]);
    expect(urls.some((u) => u.endsWith("/stores"))).toBe(true);
    expect(urls.some((u) => u.includes("/blog/first-post"))).toBe(true);
    for (const url of urls) expect(new URL(url).host, url).toBe(host);
  });

  it("lists no address that redirects (redirects.mjs, or the pages moved to account. and preview.)", async () => {
    const { redirects } = await import("../../redirects.mjs");
    const { platformRedirects } = await import("../../platform-redirects.mjs");
    const sources = [...redirects, ...platformRedirects("tallaby.com")].map((row: { source: string }) => row.source);
    // `/page/:path*` covers every path under /page.
    const redirected = (pathname: string) =>
      sources.some((source) => source === pathname || (source.endsWith("/:path*") && pathname.startsWith(`${source.slice(0, -"/:path*".length)}/`)));
    const entries = await getMarketingSitemapEntries();
    for (const entry of entries) {
      const { pathname } = new URL(entry.url);
      expect(redirected(pathname), pathname).toBe(false);
    }
    expect(entries.some((e) => /^(\/en)?\/(shipping|returns|products|categories|wishlist)(\/|$)/.test(new URL(e.url).pathname))).toBe(false);
  });
});
