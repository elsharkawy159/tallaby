import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { routeStorefrontRequest } from "./storefront-routing";

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

  it("keeps the old redirects for the catalog and deeper marketplace paths", () => {
    expect(redirectOf("/products")).toMatch(/\/$/);
    expect(redirectOf("/categories/shoes")).toContain("/categories/shoes");
    expect(rewriteOf("/About")).toBeFalsy();
  });

  it("lets shared pages through untouched", () => {
    expect(routeStorefrontRequest(req("/cart/checkout"), "sara")).toBeNull();
    expect(routeStorefrontRequest(req("/orders/123"), "sara")).toBeNull();
    expect(routeStorefrontRequest(req("/privacy"), "sara")).toBeNull();
  });
});
