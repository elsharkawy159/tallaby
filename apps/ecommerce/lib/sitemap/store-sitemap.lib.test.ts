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

  const base = { baseUrl: "https://shop.com", indexable: true, pages: [], products: [] };
  const urls = (input: Parameters<typeof buildStoreSitemapEntries>[0]) => buildStoreSitemapEntries(input).map((entry) => entry.url);

  it("lists blog and CMS URLs from the providers in both languages", () => {
    const list = urls({ ...base, extra: [{ path: "/blog/summer", lastModified: "2026-01-01T00:00:00.000Z" }, { path: "/blog", lastModified: null }] });
    expect(list).toEqual(expect.arrayContaining(["https://shop.com/blog/summer", "https://shop.com/en/blog/summer", "https://shop.com/blog"]));
  });

  it("lists the catalog and its categories only on a store that has the page", () => {
    expect(urls({ ...base, categoryKeys: ["mugs"] })).toEqual(["https://shop.com/en", "https://shop.com"]);
    const list = urls({ ...base, catalogPage: true, categoryKeys: ["mugs"] });
    expect(list).toEqual(expect.arrayContaining(["https://shop.com/products", "https://shop.com/products?category=mugs", "https://shop.com/en/products?category=mugs"]));
  });

  it("encodes a category key in its URL", () => {
    expect(urls({ ...base, catalogPage: true, categoryKeys: ["a b"] })).toContain("https://shop.com/products?category=a%20b");
  });

  it("drops a language the store doesn't offer, and its hreflang", () => {
    const entries = buildStoreSitemapEntries({ ...base, pages: [{ slug: "about", isHome: false }], locales: ["ar"] });
    expect(entries.map((entry) => entry.url)).toEqual(["https://shop.com", "https://shop.com/about"]);
    expect(entries.every((entry) => Object.keys(entry.alternates).length === 0)).toBe(true);
  });

  it("keeps hreflang for a store with both languages", () => {
    const [entry] = buildStoreSitemapEntries({ ...base, locales: ["ar", "en"] });
    expect(entry?.alternates).toEqual({ en: "https://shop.com/en", ar: "https://shop.com", "x-default": "https://shop.com" });
  });

  it("lists nothing for a store kept out of search", () => {
    expect(buildStoreSitemapEntries({ ...base, indexable: false, catalogPage: true, categoryKeys: ["mugs"], extra: [{ path: "/blog", lastModified: null }] })).toEqual([]);
  });
});
