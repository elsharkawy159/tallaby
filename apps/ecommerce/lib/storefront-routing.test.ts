import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { routeStoreCrawlFile, routeStorefrontRequest } from "./storefront-routing";

const req = (path: string) => new NextRequest(new URL(`https://sara.tallaby.com${path}`));
const rewriteOf = (path: string) => routeStorefrontRequest(req(path), "sara")?.headers.get("x-middleware-rewrite");
const redirectOf = (path: string) => routeStorefrontRequest(req(path), "sara")?.headers.get("location");

describe("store host routing (P5-01)", () => {
  it("serves the home, cart and product pages from the storefront", () => {
    expect(rewriteOf("/")).toContain("/ar/storefront/sara");
    expect(rewriteOf("/cart")).toContain("/ar/storefront/sara/cart");
    expect(rewriteOf("/products/bag")).toContain("/ar/storefront/sara/products/bag");
  });

  it("serves builder pages (one lowercase slug) from the storefront pages route", () => {
    expect(rewriteOf("/about")).toContain("/ar/storefront/sara/pages/about");
    expect(rewriteOf("/en/our-story/")).toContain("/en/storefront/sara/pages/our-story");
  });

  it("serves the catalog page at /products and /search (storefront templates)", () => {
    expect(rewriteOf("/products")).toMatch(/\/ar\/storefront\/sara\/products(?:\?|$)/);
    expect(rewriteOf("/products?category=dresses&sort=newest")).toContain("/ar/storefront/sara/products?category=dresses&sort=newest");
    expect(rewriteOf("/en/search?q=coat")).toContain("/en/storefront/sara/products?q=coat");
  });

  it("keeps deeper unknown paths on the store, as its 404", () => {
    expect(redirectOf("/categories/shoes/sale")).toBeFalsy();
    expect(redirectOf("/products/a/b")).toBeFalsy();
    expect(rewriteOf("/categories/shoes/sale")).toContain("/ar/storefront/sara/pages/_missing");
    expect(rewriteOf("/About")).toContain("/pages/_missing");
  });

  it("serves the store blog (P4-16)", () => {
    expect(rewriteOf("/blog")).toMatch(/\/ar\/storefront\/sara\/blog(?:\?|$)/);
    expect(rewriteOf("/blog/?page=2&tag=news")).toContain("/ar/storefront/sara/blog?page=2&tag=news");
    expect(rewriteOf("/blog/size-guide")).toContain("/ar/storefront/sara/blog/size-guide");
    expect(rewriteOf("/en/blog/size-guide/")).toContain("/en/storefront/sara/blog/size-guide");
    // Never a builder page called "blog".
    expect(rewriteOf("/blog")).not.toContain("/pages/");
    expect(rewriteOf("/blog/Bad_Slug")).toContain("/pages/_missing");
  });

  it("serves shared catalog links at /catalog/{token} (F-11c), apart from CMS items", () => {
    expect(rewriteOf("/catalog/AQEabc_-XYZ12.Mac_-12345678?print=1")).toContain("/ar/storefront/sara/catalog/AQEabc_-XYZ12.Mac_-12345678?print=1");
    expect(rewriteOf("/en/catalog/AQEabc_-XYZ12.Mac_-12345678/")).toContain("/en/storefront/sara/catalog/AQEabc_-XYZ12.Mac_-12345678");
    // No dot: still a CMS item of a "catalog" collection.
    expect(rewriteOf("/catalog/summer")).toContain("/ar/storefront/sara/cms/catalog/summer");
  });

  it("serves CMS items at /{collection}/{item} (P4-11); unknown ones are the store's 404", () => {
    expect(rewriteOf("/lookbook/summer-2026")).toContain("/ar/storefront/sara/cms/lookbook/summer-2026");
    expect(rewriteOf("/en/faq/returns/")).toContain("/en/storefront/sara/cms/faq/returns");
    expect(rewriteOf("/categories/shoes")).toContain("/ar/storefront/sara/cms/categories/shoes");
    expect(rewriteOf("/products/bag")).not.toContain("/cms/");
  });

  it("keeps the tallaby.com content routes off store hosts: the store's own page or 404", () => {
    // Hubs are one slug: that store's builder page of the slug, else its 404.
    expect(rewriteOf("/integrations")).toContain("/ar/storefront/sara/pages/integrations");
    expect(rewriteOf("/compare")).toContain("/ar/storefront/sara/pages/compare");
    // Detail pages are two: that store's CMS item, else its 404.
    for (const path of [
      "/features/custom-domain",
      "/integrations/meta-pixel",
      "/compare/tallaby-vs-shopify",
      "/tools/profit-margin-calculator",
      "/industries/clothing-store",
      "/solutions/create-online-store",
    ]) {
      expect(rewriteOf(path)).toContain(`/ar/storefront/sara/cms${path}`);
      expect(rewriteOf(`/en${path}`)).toContain(`/en/storefront/sara/cms${path}`);
      expect(routeStorefrontRequest(req(path), "sara")?.headers.get("location")).toBeFalsy();
    }
    // Ranking articles are three segments deep: nothing on a store matches.
    expect(rewriteOf("/blog/ranking/best-platforms")).toContain("/ar/storefront/sara/pages/_missing");
  });

  it("lets shared pages through untouched", () => {
    expect(routeStorefrontRequest(req("/cart/checkout"), "sara")).toBeNull();
    expect(routeStorefrontRequest(req("/orders/123"), "sara")).toBeNull();
    expect(routeStorefrontRequest(req("/cookies"), "sara")).toBeNull();
  });

  it("serves /privacy, /terms, /shipping and /returns as the store's own pages", () => {
    expect(rewriteOf("/privacy")).toContain("/ar/storefront/sara/pages/privacy");
    expect(rewriteOf("/en/terms")).toContain("/en/storefront/sara/pages/terms");
    expect(rewriteOf("/shipping")).toContain("/ar/storefront/sara/pages/shipping");
    expect(rewriteOf("/en/returns/")).toContain("/en/storefront/sara/pages/returns");
  });
});

describe("store crawl files (P5-04)", () => {
  const crawlRewrite = (path: string) => routeStoreCrawlFile(req(path), "sara")?.headers.get("x-middleware-rewrite");

  it("serves /sitemap.xml from sitemap-index, not a folder named sitemap.xml (a Next.js metadata route)", () => {
    expect(crawlRewrite("/sitemap.xml")).toMatch(/\/ar\/storefront\/sara\/sitemap-index$/);
  });

  it("serves robots.txt and sitemap chunks under their own names", () => {
    expect(crawlRewrite("/robots.txt")).toMatch(/\/ar\/storefront\/sara\/robots\.txt$/);
    expect(crawlRewrite("/sitemaps/2.xml")).toMatch(/\/ar\/storefront\/sara\/sitemaps\/2\.xml$/);
    expect(crawlRewrite("/about")).toBeUndefined();
  });
});
