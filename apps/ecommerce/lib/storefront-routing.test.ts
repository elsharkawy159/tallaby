import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  DEFAULT_STORE_LOCALES,
  routeStoreCrawlFile,
  routeStorefrontRequest,
  storeLocaleDecision,
  storeLocalesOf,
  type StoreLocales,
} from "./storefront-routing";

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

  it("serves the sitemap stylesheet per store, so its page carries the store's name", () => {
    expect(crawlRewrite("/sitemap.xsl")).toMatch(/\/ar\/storefront\/sara\/sitemap-xsl$/);
  });
});

describe("store default language routing (owner, 2026-11-14)", () => {
  const AR_BOTH = storeLocalesOf({ defaultLocale: "ar", supportedLocales: ["ar", "en"] });
  const AR_ONLY = storeLocalesOf({ defaultLocale: "ar", supportedLocales: ["ar"] });
  const EN_BOTH = storeLocalesOf({ defaultLocale: "en", supportedLocales: ["ar", "en"] });
  const EN_ONLY = storeLocalesOf({ defaultLocale: "en", supportedLocales: ["en"] });
  const route = (path: string, store: StoreLocales) => routeStorefrontRequest(req(path), "sara", store);
  const rewrite = (path: string, store: StoreLocales) => route(path, store)?.headers.get("x-middleware-rewrite");
  const redirect = (path: string, store: StoreLocales) => {
    const res = route(path, store);
    return res ? { status: res.status, location: res.headers.get("location") } : null;
  };

  it("decides every cell of the table", () => {
    const cases: [StoreLocales, string, ReturnType<typeof storeLocaleDecision>][] = [
      [AR_BOTH, "/x", { action: "serve", locale: "ar", path: "/x" }],
      [AR_BOTH, "/ar/x", { action: "serve", locale: "ar", path: "/x" }],
      [AR_BOTH, "/en/x", { action: "serve", locale: "en", path: "/x" }],
      [AR_ONLY, "/x", { action: "serve", locale: "ar", path: "/x" }],
      [AR_ONLY, "/ar/x", { action: "serve", locale: "ar", path: "/x" }],
      [AR_ONLY, "/en/x", { action: "redirect", path: "/x" }],
      [EN_BOTH, "/x", { action: "serve", locale: "en", path: "/x" }],
      [EN_BOTH, "/ar/x", { action: "serve", locale: "ar", path: "/x" }],
      [EN_BOTH, "/en/x", { action: "redirect", path: "/x" }],
      [EN_ONLY, "/x", { action: "serve", locale: "en", path: "/x" }],
      [EN_ONLY, "/ar/x", { action: "redirect", path: "/x" }],
      [EN_ONLY, "/en/x", { action: "redirect", path: "/x" }],
    ];
    for (const [store, path, expected] of cases) expect(storeLocaleDecision(path, store)).toEqual(expected);
    // A bare prefix is the home page.
    expect(storeLocaleDecision("/en", EN_BOTH)).toEqual({ action: "redirect", path: "/" });
    expect(storeLocaleDecision("/ar", EN_BOTH)).toEqual({ action: "serve", locale: "ar", path: "/" });
    // "/english" is a page slug, not a prefix.
    expect(storeLocaleDecision("/english", EN_BOTH)).toEqual({ action: "serve", locale: "en", path: "/english" });
  });

  it("leaves Arabic-default stores exactly as before", () => {
    for (const path of ["/", "/products/bag", "/en/products/bag", "/ar/about", "/blog?page=2", "/en/search?q=coat"]) {
      expect(rewrite(path, AR_BOTH)).toBe(rewriteOf(path));
    }
    expect(route("/cart/checkout", AR_BOTH)).toBeNull();
    expect(route("/en/orders/1", AR_BOTH)).toBeNull();
    expect(route("/ar/auth", AR_BOTH)).toBeNull();
    // No languages known (lookup failed): the Arabic-default rules.
    expect(rewrite("/products/bag", DEFAULT_STORE_LOCALES)).toBe(rewriteOf("/products/bag"));
  });

  it("serves an English store's unprefixed address in English and /ar in Arabic", () => {
    expect(rewrite("/", EN_BOTH)).toMatch(/\/en\/storefront\/sara(?:\?|$)/);
    expect(rewrite("/products/bag", EN_BOTH)).toContain("/en/storefront/sara/products/bag");
    expect(rewrite("/blog/size-guide/", EN_BOTH)).toContain("/en/storefront/sara/blog/size-guide");
    expect(rewrite("/products?category=dresses&sort=newest", EN_BOTH)).toContain("/en/storefront/sara/products?category=dresses&sort=newest");
    expect(rewrite("/ar", EN_BOTH)).toMatch(/\/ar\/storefront\/sara(?:\?|$)/);
    expect(rewrite("/ar/products/bag", EN_BOTH)).toContain("/ar/storefront/sara/products/bag");
    expect(rewrite("/ar/lookbook/summer-2026", EN_BOTH)).toContain("/ar/storefront/sara/cms/lookbook/summer-2026");
    expect(route("/products/bag", EN_BOTH)?.headers.get("x-middleware-request-x-next-intl-locale")).toBe("en");
    expect(route("/ar/products/bag", EN_BOTH)?.headers.get("x-middleware-request-x-next-intl-locale")).toBe("ar");
  });

  it("308s an English store's /en links to the unprefixed address, query kept", () => {
    expect(redirect("/en", EN_BOTH)).toEqual({ status: 308, location: "https://sara.tallaby.com/" });
    expect(redirect("/en/products/bag?color=red&size=m", EN_BOTH)).toEqual({ status: 308, location: "https://sara.tallaby.com/products/bag?color=red&size=m" });
    expect(redirect("/en/blog/size-guide/", EN_BOTH)).toEqual({ status: 308, location: "https://sara.tallaby.com/blog/size-guide/" });
    expect(redirect("/en/cart/checkout?step=2", EN_BOTH)).toEqual({ status: 308, location: "https://sara.tallaby.com/cart/checkout?step=2" });
  });

  it("308s the prefix of a language a one-language store doesn't offer", () => {
    expect(redirect("/ar/products/bag?x=1", EN_ONLY)).toEqual({ status: 308, location: "https://sara.tallaby.com/products/bag?x=1" });
    expect(redirect("/en/about", AR_ONLY)).toEqual({ status: 308, location: "https://sara.tallaby.com/about" });
    expect(redirect("/en/orders/1", AR_ONLY)).toEqual({ status: 308, location: "https://sara.tallaby.com/orders/1" });
    expect(rewrite("/products/bag", EN_ONLY)).toContain("/en/storefront/sara/products/bag");
  });

  it("rewrites an English store's shared pages itself, in the right language", () => {
    const shared = (path: string) => route(path, EN_BOTH);
    expect(shared("/cart/checkout")?.headers.get("x-middleware-rewrite")).toBe("https://sara.tallaby.com/en/cart/checkout");
    expect(shared("/cart/checkout/payment?orderId=1")?.headers.get("x-middleware-rewrite")).toBe("https://sara.tallaby.com/en/cart/checkout/payment?orderId=1");
    expect(shared("/ar/orders/1?t=abc")?.headers.get("x-middleware-rewrite")).toBe("https://sara.tallaby.com/ar/orders/1?t=abc");
    expect(shared("/auth")?.headers.get("x-middleware-request-x-next-intl-locale")).toBe("en");
    expect(shared("/ar/profile/orders")?.headers.get("x-middleware-request-x-next-intl-locale")).toBe("ar");
  });

  it("makes stored languages safe", () => {
    expect(storeLocalesOf(null)).toEqual(DEFAULT_STORE_LOCALES);
    expect(storeLocalesOf({ defaultLocale: "fr", supportedLocales: ["fr"] })).toEqual({ defaultLocale: "ar", supportedLocales: ["en", "ar"] });
    expect(storeLocalesOf({ defaultLocale: "en", supportedLocales: ["ar"] })).toEqual({ defaultLocale: "en", supportedLocales: ["en", "ar"] });
    expect(storeLocalesOf({ defaultLocale: "en", supportedLocales: ["en"] })).toEqual({ defaultLocale: "en", supportedLocales: ["en"] });
  });
});
