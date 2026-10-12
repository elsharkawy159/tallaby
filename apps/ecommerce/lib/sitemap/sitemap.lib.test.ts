import { describe, expect, it } from "vitest";
import {
  buildAlternates,
  buildLocalizedUrl,
  buildProductEntries,
  buildSharedSlugEntries,
  buildStaticEntries,
  chunkEntries,
  dedupeEntries,
  isValidSlug,
  latestModified,
  serializeSitemapIndex,
  serializeUrlset,
  STATIC_PAGES,
  type ProductTranslationRow,
  type SitemapEntry,
} from "./sitemap.lib";

const BASE = "https://www.tallaby.com";

function row(overrides: Partial<ProductTranslationRow>): ProductTranslationRow {
  return {
    productId: "p1",
    locale: "en",
    slug: "slug",
    title: "Title",
    updatedAt: "2026-10-01T10:00:00Z",
    createdAt: "2026-01-01T00:00:00.000000Z",
    ...overrides,
  };
}

describe("buildLocalizedUrl", () => {
  it("leaves the default locale (ar) unprefixed and prefixes en", () => {
    expect(buildLocalizedUrl(BASE, "ar", "/products/x")).toBe(`${BASE}/products/x`);
    expect(buildLocalizedUrl(BASE, "en", "/products/x")).toBe(`${BASE}/en/products/x`);
  });

  it("builds homepages without a trailing slash", () => {
    expect(buildLocalizedUrl(BASE, "ar", "")).toBe(BASE);
    expect(buildLocalizedUrl(BASE, "en", "")).toBe(`${BASE}/en`);
  });

  it("strips a trailing slash from the base URL", () => {
    expect(buildLocalizedUrl(`${BASE}/`, "en", "/about")).toBe(`${BASE}/en/about`);
  });
});

describe("buildAlternates", () => {
  it("lists only existing locales and points x-default at Arabic", () => {
    expect(buildAlternates({ en: "e", ar: "a" })).toEqual({ en: "e", ar: "a", "x-default": "a" });
  });

  it("falls back x-default to the only available translation", () => {
    expect(buildAlternates({ en: "e" })).toEqual({ en: "e", "x-default": "e" });
  });
});

describe("isValidSlug", () => {
  it.each([null, undefined, "", " lead", "trail ", "a b", "a/b", "a?b", "a#b", "a%20b", "tab\tx"])(
    "rejects %j",
    (slug) => expect(isValidSlug(slug)).toBe(false)
  );

  it.each(["power-bank-10000", "سماعة-بلوتوث", "a_b.c"])("accepts %j", (slug) =>
    expect(isValidSlug(slug)).toBe(true)
  );
});

describe("buildProductEntries", () => {
  it("emits one URL per real translation, with reciprocal hreflang", () => {
    const { entries, stats } = buildProductEntries(BASE, [
      row({ locale: "en", slug: "speaker" }),
      row({ locale: "ar", slug: "sammaa" }),
    ]);
    const en = entries.find((e) => e.locale === "en")!;
    const ar = entries.find((e) => e.locale === "ar")!;
    expect(en.url).toBe(`${BASE}/en/products/speaker`);
    expect(ar.url).toBe(`${BASE}/products/sammaa`);
    expect(en.alternates).toEqual(ar.alternates);
    expect(en.alternates).toEqual({ en: en.url, ar: ar.url, "x-default": ar.url });
    expect(stats).toEqual({ accepted: 2, invalidSlug: 0, slugCollisions: 0 });
  });

  it("does not assume Arabic and English slugs are identical — or different", () => {
    const { entries } = buildProductEntries(BASE, [
      row({ locale: "en", slug: "same" }),
      row({ locale: "ar", slug: "same" }),
    ]);
    expect(entries.map((e) => e.url).sort()).toEqual([`${BASE}/en/products/same`, `${BASE}/products/same`]);
  });

  it("gives a product with only one translation a single URL and no fake alternate", () => {
    const { entries } = buildProductEntries(BASE, [row({ locale: "en", slug: "only-en" })]);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.alternates).toEqual({
      en: `${BASE}/en/products/only-en`,
      "x-default": `${BASE}/en/products/only-en`,
    });
  });

  it("skips missing and malformed slugs and unknown locales", () => {
    const { entries, stats } = buildProductEntries(BASE, [
      row({ productId: "a", slug: null }),
      row({ productId: "b", slug: "" }),
      row({ productId: "c", slug: "has space" }),
      row({ productId: "d", slug: "ok", locale: "fr" }),
      row({ productId: "e", slug: "fine" }),
    ]);
    expect(entries.map((e) => e.url)).toEqual([`${BASE}/en/products/fine`]);
    expect(stats.invalidSlug).toBe(4);
  });

  it("resolves a shared slug to the oldest product, like getProductIdBySlug", () => {
    const { entries, stats } = buildProductEntries(BASE, [
      row({ productId: "newer", slug: "dup", createdAt: "2026-05-01T00:00:00.000001Z" }),
      row({ productId: "older", slug: "dup", createdAt: "2026-05-01T00:00:00.000000Z" }),
      row({ productId: "newer", locale: "ar", slug: "newer-ar" }),
      row({ productId: "older", locale: "ar", slug: "older-ar" }),
    ]);
    const dup = entries.find((e) => e.url === `${BASE}/en/products/dup`)!;
    // hreflang of the shared URL belongs to the product that owns it.
    expect(dup.alternates.ar).toBe(`${BASE}/products/older-ar`);
    // The loser keeps its own Arabic page, without claiming the shared English URL.
    const newerAr = entries.find((e) => e.url === `${BASE}/products/newer-ar`)!;
    expect(newerAr.alternates.en).toBeUndefined();
    expect(stats.slugCollisions).toBe(1);
    expect(entries.filter((e) => e.url.endsWith("/dup"))).toHaveLength(1);
  });

  it("breaks created_at ties by id and puts null created_at last", () => {
    const tie = buildProductEntries(BASE, [
      row({ productId: "b", slug: "x", locale: "en" }),
      row({ productId: "a", slug: "x", locale: "en" }),
      row({ productId: "a", slug: "a-ar", locale: "ar" }),
    ]);
    expect(tie.entries.find((e) => e.locale === "en")!.alternates.ar).toBe(`${BASE}/products/a-ar`);

    const nulls = buildProductEntries(BASE, [
      row({ productId: "a", slug: "y", createdAt: null }),
      row({ productId: "b", slug: "y", createdAt: "2026-12-01T00:00:00.000000Z" }),
      row({ productId: "b", slug: "b-ar", locale: "ar" }),
    ]);
    expect(nulls.entries.find((e) => e.locale === "en")!.alternates.ar).toBe(`${BASE}/products/b-ar`);
  });

  it("uses the product's stored updated_at as lastmod, never 'now'", () => {
    const { entries } = buildProductEntries(BASE, [
      row({ updatedAt: "2026-02-03T04:05:06Z" }),
      row({ productId: "p2", slug: "no-date", updatedAt: null }),
    ]);
    expect(entries.find((e) => e.url.endsWith("/slug"))!.lastModified).toBe("2026-02-03T04:05:06Z");
    expect(entries.find((e) => e.url.endsWith("/no-date"))!.lastModified).toBeNull();
  });

  it("percent-encodes non-ASCII slugs", () => {
    const { entries } = buildProductEntries(BASE, [row({ locale: "ar", slug: "سماعة" })]);
    expect(entries[0]!.url).toBe(`${BASE}/products/${encodeURIComponent("سماعة")}`);
  });

  it("covers every row of a large, multi-page catalog", () => {
    const rows: ProductTranslationRow[] = [];
    for (let i = 0; i < 12_345; i++) {
      rows.push(row({ productId: `p${i}`, locale: "en", slug: `en-${i}` }));
      if (i % 3 !== 0) rows.push(row({ productId: `p${i}`, locale: "ar", slug: `ar-${i}` }));
    }
    const { entries } = buildProductEntries(BASE, rows);
    expect(entries.filter((e) => e.locale === "en")).toHaveLength(12_345);
    expect(entries.filter((e) => e.locale === "ar")).toHaveLength(12_345 - Math.ceil(12_345 / 3));
    expect(new Set(entries.map((e) => e.url)).size).toBe(entries.length);
  });

  it("returns entries in a stable order regardless of input order", () => {
    const rows = [row({ productId: "a", slug: "b" }), row({ productId: "b", slug: "a" })];
    const forward = buildProductEntries(BASE, rows).entries.map((e) => e.url);
    const backward = buildProductEntries(BASE, [...rows].reverse()).entries.map((e) => e.url);
    expect(forward).toEqual(backward);
  });
});

describe("static and shared-slug entries", () => {
  it("emits both locales for every static page with matching alternates", () => {
    const entries = buildStaticEntries(BASE);
    expect(entries).toHaveLength(STATIC_PAGES.length * 2);
    expect(entries.every((e) => e.lastModified === null)).toBe(true);
    const home = entries.filter((e) => e.alternates.ar === BASE);
    expect(home.map((e) => e.url).sort()).toEqual([BASE, `${BASE}/en`]);
  });

  it("dedupes and skips invalid category slugs", () => {
    const entries = buildSharedSlugEntries(
      BASE,
      [
        { slug: "phones", lastModified: "2026-01-01T00:00:00Z", name: "Phones", nameAr: "هواتف" },
        { slug: "phones", lastModified: null, name: "Dup" },
        { slug: null, lastModified: null, name: "No slug" },
        { slug: "bad slug", lastModified: null, name: "Bad" },
      ],
      { type: "category", prefix: "/categories", changeFrequency: "daily", priority: 0.8 }
    );
    expect(entries.map((e) => e.url)).toEqual([`${BASE}/en/categories/phones`, `${BASE}/categories/phones`]);
    expect(entries[0]!.lastModified).toBe("2026-01-01T00:00:00Z");
    // Localized display names for the HTML /sitemap page.
    expect(entries.map((e) => e.label)).toEqual(["Phones", "هواتف"]);
    expect(entries.map((e) => e.path)).toEqual(["/categories/phones", "/categories/phones"]);
  });

  it("falls back to the other language name, then the slug", () => {
    const opts = { type: "brand", prefix: "/brands", changeFrequency: "weekly", priority: 0.6 } as const;
    const [en, ar] = buildSharedSlugEntries(BASE, [{ slug: "anker", lastModified: null, name: "Anker" }], opts);
    expect([en!.label, ar!.label]).toEqual(["Anker", "Anker"]);
    const [noName] = buildSharedSlugEntries(BASE, [{ slug: "x", lastModified: null, name: null }], opts);
    expect(noName!.label).toBe("x");
  });

  it("labels products with their own translation title and a relative path", () => {
    const { entries } = buildProductEntries(BASE, [
      row({ locale: "en", slug: "speaker", title: "Bluetooth Speaker" }),
      row({ locale: "ar", slug: "sammaa", title: "سماعة بلوتوث" }),
      row({ productId: "p2", locale: "en", slug: "untitled", title: "  " }),
    ]);
    const byUrl = Object.fromEntries(entries.map((e) => [e.url, e]));
    expect(byUrl[`${BASE}/en/products/speaker`]!.label).toBe("Bluetooth Speaker");
    expect(byUrl[`${BASE}/products/sammaa`]!.label).toBe("سماعة بلوتوث");
    expect(byUrl[`${BASE}/products/sammaa`]!.path).toBe("/products/sammaa");
    expect(byUrl[`${BASE}/en/products/untitled`]!.label).toBe("untitled");
  });
});

describe("dedupeEntries", () => {
  it("keeps the first occurrence of each URL", () => {
    const a = buildStaticEntries(BASE, [{ path: "/about", changeFrequency: "monthly", priority: 0.5 }]);
    const { entries, duplicates } = dedupeEntries([...a, ...a]);
    expect(entries).toEqual(a);
    expect(duplicates).toBe(2);
  });
});

describe("XML serialization", () => {
  const entries = buildProductEntries(BASE, [
    row({ locale: "en", slug: "a&b" }),
    row({ locale: "ar", slug: "x" }),
  ]).entries;

  it("produces a urlset with the sitemap and xhtml namespaces and escaped values", () => {
    const xml = serializeUrlset(entries);
    expect(
      xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>')
    ).toBe(true);
    // Display labels are for the HTML page only.
    expect(xml).not.toContain("Title");
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain(`<loc>${BASE}/en/products/a%26b</loc>`);
    expect(xml).toContain('hreflang="x-default"');
    expect(xml.match(/<url>/g)).toHaveLength(2);
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
  });

  it("omits lastmod when there is no reliable timestamp", () => {
    const xml = serializeUrlset(buildStaticEntries(BASE, [{ path: "/faq", changeFrequency: "weekly", priority: 0.5 }]));
    expect(xml).not.toContain("<lastmod>");
  });

  it("produces a sitemap index", () => {
    const xml = serializeSitemapIndex([
      { url: `${BASE}/sitemaps/1.xml`, lastModified: "2026-01-01T00:00:00Z" },
      { url: `${BASE}/sitemaps/2.xml`, lastModified: null },
    ]);
    expect(xml).toContain("<sitemapindex");
    expect(xml.match(/<sitemap>/g)).toHaveLength(2);
    expect(xml.match(/<lastmod>/g)).toHaveLength(1);
  });
});

describe("chunkEntries", () => {
  const many = buildProductEntries(
    BASE,
    Array.from({ length: 25 }, (_, i) => row({ productId: `p${i}`, slug: `s${i}` }))
  ).entries;

  it("keeps everything in one file under the limits", () => {
    expect(chunkEntries(many)).toHaveLength(1);
  });

  it("splits by URL count without losing or reordering entries", () => {
    const chunks = chunkEntries(many, { maxUrls: 10 });
    expect(chunks.map((c) => c.length)).toEqual([10, 10, 5]);
    expect(chunks.flat()).toEqual(many);
  });

  it("splits by byte size", () => {
    const one = new TextEncoder().encode(serializeUrlset(many.slice(0, 1))).length;
    const chunks = chunkEntries(many, { maxBytes: one * 3 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(new TextEncoder().encode(serializeUrlset(chunk)).length).toBeLessThanOrEqual(one * 3);
    }
    expect(chunks.flat()).toEqual(many);
  });

  it("returns one empty chunk for an empty sitemap", () => {
    expect(chunkEntries([])).toEqual([[]]);
  });

  it("reports the latest lastmod of a chunk", () => {
    const e = (lastModified: string | null) => ({ ...many[0]!, lastModified }) as SitemapEntry;
    expect(latestModified([e("2026-01-01T00:00:00Z"), e(null), e("2026-03-01T00:00:00Z")])).toBe(
      "2026-03-01T00:00:00Z"
    );
    expect(latestModified([e(null)])).toBeNull();
  });
});
