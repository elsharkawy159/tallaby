import { describe, expect, it } from "vitest";
import { isProductPage, navPages, productPageOf } from "./product-page.lib";
import type { SitePage } from "./schema";

const page = (slug: string, kind?: "page" | "product") =>
  ({ slug, kind, isHome: false, name: slug, seo: {}, content: { sections: [] } }) as SitePage;

describe("product page helpers", () => {
  const config = { pages: [page("home"), page("product", "product"), page("about", "page")] };

  it("isProductPage is true only for kind product", () => {
    expect(isProductPage(page("a"))).toBe(false);
    expect(isProductPage(page("a", "page"))).toBe(false);
    expect(isProductPage(page("product", "product"))).toBe(true);
  });

  it("productPageOf returns the product page or undefined", () => {
    expect(productPageOf(config)?.slug).toBe("product");
    expect(productPageOf({ pages: [page("home")] })).toBeUndefined();
  });

  it("navPages leaves out the product page", () => {
    expect(navPages(config).map((p) => p.slug)).toEqual(["home", "about"]);
  });
});
