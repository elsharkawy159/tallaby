import { describe, expect, it } from "vitest";
import { buildStoreSitemapEntries } from "./store-sitemap.lib";

describe("buildStoreSitemapEntries", () => {
  it("lists builder pages but never the product page template", () => {
    const entries = buildStoreSitemapEntries({
      baseUrl: "https://faster.tallaby.com",
      indexable: true,
      pages: [
        { slug: "home", isHome: true },
        { slug: "about", isHome: false },
        { slug: "product", isHome: false, kind: "product" },
      ],
      products: [],
    });
    const urls = entries.map((entry) => JSON.stringify(entry));
    expect(urls.some((url) => url.includes("/about"))).toBe(true);
    expect(urls.some((url) => url.includes("/product\""))).toBe(false);
    expect(urls.some((url) => /\/product[^s]/.test(url))).toBe(false);
  });
});
