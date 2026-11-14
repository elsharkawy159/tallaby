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

describe("buildStoreSitemapEntries on an English-default store (owner, 2026-11-14)", () => {
  const base = { baseUrl: "https://shop.com", indexable: true, pages: [{ slug: "about", isHome: false }], products: [], defaultLocale: "en" as const };

  it("lists English unprefixed, Arabic under /ar, with English as x-default", () => {
    const entries = buildStoreSitemapEntries(base);
    expect(entries.map((e) => e.url)).toEqual(
      expect.arrayContaining(["https://shop.com", "https://shop.com/ar", "https://shop.com/about", "https://shop.com/ar/about"]),
    );
    expect(entries.some((e) => e.url.includes("/en"))).toBe(false);
    const about = entries.find((e) => e.url === "https://shop.com/ar/about")!;
    expect(about.alternates).toEqual({ en: "https://shop.com/about", ar: "https://shop.com/ar/about", "x-default": "https://shop.com/about" });
  });

  it("an English-only store lists only its unprefixed English URLs, with no hreflang", () => {
    const entries = buildStoreSitemapEntries({ ...base, locales: ["en"] });
    expect(entries.map((e) => e.url).sort()).toEqual(["https://shop.com", "https://shop.com/about"]);
    expect(entries.every((e) => Object.keys(e.alternates).length === 0)).toBe(true);
  });
});

describe("buildStoreSitemapEntries lastmod and images", () => {
  const product = (over: Record<string, unknown>) => ({
    productId: "p1",
    locale: "ar",
    slug: "mug",
    title: "Mug",
    updatedAt: "2026-11-01T10:00:00Z",
    createdAt: "2026-01-01T00:00:00.000000Z",
    ...over,
  });
  const base = {
    baseUrl: "https://shop.com",
    indexable: true,
    pages: [{ slug: "home", isHome: true }, { slug: "about", isHome: false }],
    products: [product({}), product({ productId: "p2", slug: "cup", updatedAt: "2026-11-05T08:00:00Z", images: ["https://img/cup-1.jpg", "https://img/cup-2.jpg"] })],
    catalogPage: true,
    categoryKeys: ["mugs", "cups"],
    categoryLastModified: { mugs: "2026-11-01T10:00:00Z", cups: null },
    locales: ["ar"] as const,
  };
  const byUrl = (input: Parameters<typeof buildStoreSitemapEntries>[0]) =>
    new Map(buildStoreSitemapEntries(input).map((entry) => [entry.url, entry]));

  it("dates the home, the catalog, its categories and builder pages", () => {
    const entries = byUrl({ ...base, publishedAt: "2026-11-03T12:00:00Z" });
    // The home: the later of the publish and the newest product.
    expect(entries.get("https://shop.com")?.lastModified).toBe("2026-11-05T08:00:00Z");
    expect(entries.get("https://shop.com/products")?.lastModified).toBe("2026-11-05T08:00:00Z");
    expect(entries.get("https://shop.com/products?category=mugs")?.lastModified).toBe("2026-11-01T10:00:00Z");
    expect(entries.get("https://shop.com/products?category=cups")?.lastModified).toBeNull();
    expect(entries.get("https://shop.com/about")?.lastModified).toBe("2026-11-03T12:00:00Z");
  });

  it("dates the home by its site when it is newer, and leaves builder pages undated without a publish time", () => {
    const entries = byUrl({ ...base, publishedAt: "2026-11-10T00:00:00Z" });
    expect(entries.get("https://shop.com")?.lastModified).toBe("2026-11-10T00:00:00Z");
    expect(byUrl(base).get("https://shop.com/about")?.lastModified).toBeNull();
    expect(byUrl({ ...base, products: [] }).get("https://shop.com")?.lastModified).toBeNull();
  });

  it("lists a product's photos on its URL only", () => {
    const entries = byUrl(base);
    expect(entries.get("https://shop.com/products/cup")?.images).toEqual(["https://img/cup-1.jpg", "https://img/cup-2.jpg"]);
    expect(entries.get("https://shop.com/products/mug")).not.toHaveProperty("images");
    expect(entries.get("https://shop.com")).not.toHaveProperty("images");
  });
});
