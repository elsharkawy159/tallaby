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

  it("keeps the old redirects for deeper marketplace paths", () => {
    expect(redirectOf("/categories/shoes/sale")).toContain("/categories/shoes/sale");
    expect(redirectOf("/products/a/b")).toContain("/products/a/b");
    expect(rewriteOf("/About")).toBeFalsy();
  });

  it("serves the store blog (P4-16)", () => {
    expect(rewriteOf("/blog")).toMatch(/\/ar\/storefront\/sara\/blog(?:\?|$)/);
    expect(rewriteOf("/blog/?page=2&tag=news")).toContain("/ar/storefront/sara/blog?page=2&tag=news");
    expect(rewriteOf("/blog/size-guide")).toContain("/ar/storefront/sara/blog/size-guide");
    expect(rewriteOf("/en/blog/size-guide/")).toContain("/en/storefront/sara/blog/size-guide");
    // Never a builder page called "blog".
    expect(rewriteOf("/blog")).not.toContain("/pages/");
    expect(rewriteOf("/blog/Bad_Slug")).toBeFalsy();
  });

  it("serves CMS items at /{collection}/{item} (P4-11); unknown ones are redirected by the route", () => {
    expect(rewriteOf("/lookbook/summer-2026")).toContain("/ar/storefront/sara/cms/lookbook/summer-2026");
    expect(rewriteOf("/en/faq/returns/")).toContain("/en/storefront/sara/cms/faq/returns");
    expect(rewriteOf("/categories/shoes")).toContain("/ar/storefront/sara/cms/categories/shoes");
    expect(rewriteOf("/products/bag")).not.toContain("/cms/");
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
