import { describe, expect, it } from "vitest";
import { DEFAULT_STORE_SEO } from "@workspace/lib/stores";
import {
  buildStoreMetadata,
  SHARE_DESCRIPTION_MAX,
  shareDescription,
  STORE_NOINDEX,
  storeXHandle,
  storeAlternates,
  storeCatalogSeo,
  storeHomeMetadata,
  storeIndexLocales,
  storePageMetadata,
  storeSeoFallback,
  storeStructuredData,
  type StoreMetadataInput,
} from "./store-seo.lib";

const store = (seo: Partial<StoreMetadataInput["seo"]>): StoreMetadataInput => ({
  displayName: "Shop",
  subdomain: "shop",
  customDomain: "shop.com",
  description: null,
  logoUrl: null,
  bannerUrl: null,
  seo: { ...DEFAULT_STORE_SEO, ...seo },
});

describe("buildStoreMetadata verification", () => {
  it("renders Meta's facebook-domain-verification tag", () => {
    const meta = buildStoreMetadata(store({ facebookDomainVerification: "abc123def456" }), "ar", { indexable: true });
    expect(meta.verification).toEqual({ other: { "facebook-domain-verification": "abc123def456" } });
  });

  it("renders Google and Meta together", () => {
    const meta = buildStoreMetadata(
      store({ googleSiteVerification: "google-token_1", facebookDomainVerification: "abc123def456" }),
      "ar",
      { indexable: true },
    );
    expect(meta.verification).toEqual({
      google: "google-token_1",
      other: { "facebook-domain-verification": "abc123def456" },
    });
  });

  it("renders nothing for a missing or bad token", () => {
    expect(buildStoreMetadata(store({}), "ar", { indexable: true }).verification).toBeUndefined();
    const bad = buildStoreMetadata(store({ facebookDomainVerification: '"><script>' }), "ar", { indexable: true });
    expect(bad.verification).toBeUndefined();
  });
});

describe("storeSeoFallback", () => {
  it("uses the category label in both languages", () => {
    expect(storeSeoFallback("Shop", "Fashion", "en").title).toBe("Buy Fashion from Shop now | Tallaby");
    expect(storeSeoFallback("شوب", "أزياء", "ar").title).toBe("اشتري أزياء من شوب الآن | طلبي");
    expect(storeSeoFallback("Shop", "Fashion", "en").description).toContain("Fashion from Shop");
    expect(storeSeoFallback("شوب", "أزياء", "ar").description).toContain("أزياء من شوب");
  });

  it("has a sensible phrase without a category", () => {
    for (const category of [null, undefined, "  "]) {
      expect(storeSeoFallback("Shop", category, "en").title).toBe("Shop from Shop now | Tallaby");
      expect(storeSeoFallback("شوب", category, "ar").title).toBe("تسوّق من شوب الآن | طلبي");
    }
    expect(storeSeoFallback("Shop", null, "en").description).toContain("Shop's products");
    expect(storeSeoFallback("شوب", null, "ar").description).toContain("منتجات شوب");
  });
});

describe("buildStoreMetadata title and description", () => {
  const title = (meta: ReturnType<typeof buildStoreMetadata>) => meta.title as { default: string; template: string };

  it("falls back when the seller wrote nothing, and the store name appears once", () => {
    const meta = buildStoreMetadata(store({}), "en", { indexable: true, category: "Fashion" });
    expect(title(meta).default).toBe("Buy Fashion from Shop now | Tallaby");
    // Next.js runs the template over child pages' titles only, never over the default.
    expect(title(meta).template).toBe("%s | Shop");
    expect(meta.description).toBe("Browse Fashion from Shop and order online in a few simple steps.");
    expect(meta.openGraph?.title).toBe("Buy Fashion from Shop now | Tallaby");
  });

  it("uses the Arabic wording on the Arabic site", () => {
    const meta = buildStoreMetadata(store({}), "ar", { indexable: true, category: "أزياء" });
    expect(title(meta).default).toBe("اشتري أزياء من Shop الآن | طلبي");
  });

  it("the seller's own text always wins", () => {
    const written = buildStoreMetadata(store({ description: "My words", titleTemplate: "%s - Mine" }), "en", { indexable: true, category: "Fashion" });
    expect(written.description).toBe("My words");
    expect(title(written)).toEqual({ default: "Shop", template: "%s - Mine" });
    const bio = buildStoreMetadata({ ...store({}), description: "About us" }, "en", { indexable: true });
    expect(bio.description).toBe("About us");
    const storeBio = buildStoreMetadata({ ...store({}), storeDescription: "Store text" }, "en", { indexable: true });
    expect(storeBio.description).toBe("Store text");
  });
});

describe("storeIndexLocales", () => {
  it("keeps the store's languages and treats a missing or unusable setting as both", () => {
    expect(storeIndexLocales(["ar"])).toEqual(["ar"]);
    expect(storeIndexLocales(["en", "ar"])).toEqual(["ar", "en"]);
    expect(storeIndexLocales(null)).toEqual(["ar", "en"]);
    expect(storeIndexLocales(["fr"])).toEqual(["ar", "en"]);
  });
});

describe("storeAlternates", () => {
  const both = store({});

  it("names the page itself in its language, with ar unprefixed and en under /en", () => {
    expect(storeAlternates(both, "ar", "/about")).toEqual({
      canonical: "https://shop.com/about",
      languages: { en: "https://shop.com/en/about", ar: "https://shop.com/about", "x-default": "https://shop.com/about" },
    });
    expect(storeAlternates(both, "en", "/about").canonical).toBe("https://shop.com/en/about");
    expect(storeAlternates(both, "en", "").canonical).toBe("https://shop.com/en");
  });

  it("uses each language's own slug", () => {
    const alternates = storeAlternates(both, "en", { ar: "/products/kob", en: "/products/mug" });
    expect(alternates.canonical).toBe("https://shop.com/en/products/mug");
    expect(alternates.languages?.ar).toBe("https://shop.com/products/kob");
  });

  it("lists only a language the page really has", () => {
    const alternates = storeAlternates(both, "ar", { ar: "/products/kob" });
    expect(alternates).toEqual({ canonical: "https://shop.com/products/kob" });
  });

  it("points a language the store doesn't offer at the one it does", () => {
    const arOnly = { ...both, supportedLocales: ["ar"] };
    expect(storeAlternates(arOnly, "en", "/about")).toEqual({ canonical: "https://shop.com/about" });
    const enOnly = { ...both, supportedLocales: ["en"] };
    expect(storeAlternates(enOnly, "ar", "")).toEqual({ canonical: "https://shop.com/en" });
  });

  it("still has a canonical when the only translation is in a language the store doesn't offer", () => {
    const arOnly = { ...both, supportedLocales: ["ar"] };
    expect(storeAlternates(arOnly, "en", { en: "/products/mug" }).canonical).toBe("https://shop.com/en/products/mug");
  });
});

describe("storePageMetadata", () => {
  it("never sets an empty key: Next would treat it as clearing the layout's value", () => {
    const meta = storePageMetadata(store({}), "ar", { paths: "/about", title: "About" });
    expect("robots" in meta).toBe(false);
    expect("description" in meta).toBe(false);
    const noFlag = storePageMetadata(store({}), "ar", { paths: "/about", title: "About", noindex: undefined });
    expect("robots" in noFlag).toBe(false);
  });

  it("gives the page its own Open Graph address, title and language", () => {
    const meta = storePageMetadata(store({}), "en", { paths: "/about", title: "About", description: "Who we are", image: "https://img/x.jpg" });
    expect(meta.openGraph).toMatchObject({
      url: "https://shop.com/en/about",
      title: "About",
      description: "Who we are",
      siteName: "Shop",
      locale: "en_US",
      images: [{ url: "https://img/x.jpg" }],
    });
    expect(meta.twitter).toEqual({ card: "summary_large_image" });
  });

  it("falls back to the store's share image", () => {
    const meta = storePageMetadata(store({ shareImageUrl: "https://img/store.jpg" }), "ar", { paths: "/about", title: "About" });
    expect(meta.openGraph?.images).toEqual([{ url: "https://img/store.jpg" }]);
  });

  it("adds article dates only for an article, and noindex only when asked", () => {
    const meta = storePageMetadata(store({}), "ar", {
      paths: "/blog/x",
      title: "X",
      article: { publishedTime: "2026-01-01T00:00:00Z" },
      noindex: true,
    });
    expect(meta.openGraph).toMatchObject({ type: "article", publishedTime: "2026-01-01T00:00:00Z" });
    expect(meta.robots).toEqual(STORE_NOINDEX);
  });
});

describe("store product page share card", () => {
  const product = (overrides: Partial<Parameters<typeof storePageMetadata>[2]> = {}) =>
    storePageMetadata({ ...store({}), customDomain: null, subdomain: "sandy", displayName: "Sandy" }, "ar", {
      paths: { ar: "/products/messi-wall-art", en: "/products/messi-wall-art-en" },
      title: "لوحة ميسي",
      description: "لوحة فنية",
      image: { url: "https://x.supabase.co/storage/v1/render/image/public/products/a.jpg?width=1200&height=630&resize=cover&quality=80", width: 1200, height: 630, type: "image/jpeg" },
      imageAlt: "لوحة ميسي",
      price: { amount: 450, currency: "EGP" },
      ...overrides,
    });

  it("names the store's own address as canonical and og:url, never tallaby.com", () => {
    const meta = product();
    expect(meta.alternates?.canonical).toBe("https://sandy.tallaby.com/products/messi-wall-art");
    expect(meta.openGraph).toMatchObject({ url: "https://sandy.tallaby.com/products/messi-wall-art", siteName: "Sandy", locale: "ar_EG", type: "website" });
    const onDomain = storePageMetadata({ ...store({}), displayName: "Sandy" }, "en", { paths: { en: "/products/x" }, title: "X" });
    expect(onDomain.alternates?.canonical).toBe("https://shop.com/en/products/x");
  });

  it("gives the first product image with its size, type and alt, and the price in the store's currency", () => {
    const meta = product();
    expect(meta.openGraph?.images).toEqual([
      { url: expect.stringContaining("resize=cover"), width: 1200, height: 630, type: "image/jpeg", alt: "لوحة ميسي" },
    ]);
    expect(meta.other).toEqual({ "product:price:amount": "450", "product:price:currency": "EGP" });
    expect(product({ price: { amount: 99.5, currency: "SAR" } }).other).toEqual({ "product:price:amount": "99.50", "product:price:currency": "SAR" });
    expect("other" in product({ price: { amount: 0, currency: "EGP" } })).toBe(false);
    expect("other" in product({ price: { amount: 10, currency: "egp" } })).toBe(false);
  });

  it("falls back to the store's logo, then to Tallaby's default card", () => {
    const logo = storePageMetadata({ ...store({}), logoUrl: "https://img/logo.png" }, "ar", { paths: "/products/x", title: "X", image: null });
    expect(logo.openGraph?.images).toEqual([{ url: "https://img/logo.png" }]);
    const none = product({ image: null, imageAlt: undefined });
    expect(none.openGraph?.images).toEqual([{ url: "https://sandy.tallaby.com/og-image.jpg", width: 1200, height: 630, type: "image/jpeg" }]);
    expect(product({ image: "", imageAlt: undefined }).openGraph?.images).toEqual(none.openGraph?.images);
  });

  it("uses the store's X handle as twitter:site, never Tallaby's", () => {
    expect(product().twitter).toEqual({ card: "summary_large_image" });
    const withX = storePageMetadata(
      { ...store({}), social: [{ platform: "instagram", url: "https://instagram.com/sandy" }, { platform: "x", url: "https://x.com/SandyArt" }] },
      "ar",
      { paths: "/products/x", title: "X" },
    );
    expect(withX.twitter).toEqual({ card: "summary_large_image", site: "@SandyArt" });
  });

  it("keeps the share description to one short line", () => {
    const long = `<p>${"كلمة ".repeat(80)}</p>`;
    const description = product({ description: long }).openGraph?.description as string;
    expect(description.length).toBeLessThanOrEqual(SHARE_DESCRIPTION_MAX);
    expect(description.endsWith("…")).toBe(true);
    expect(description).not.toContain("<");
  });
});

describe("storeXHandle and shareDescription", () => {
  it("reads only a real X profile link", () => {
    expect(storeXHandle([{ platform: "x", url: "https://twitter.com/abc_1/" }])).toBe("@abc_1");
    expect(storeXHandle([{ platform: "x", url: "https://x.com/intent/tweet" }])).toBeUndefined();
    expect(storeXHandle([{ platform: "facebook", url: "https://x.com/abc" }])).toBeUndefined();
    expect(storeXHandle(null)).toBeUndefined();
  });

  it("returns nothing for empty text", () => {
    expect(shareDescription("  ")).toBeUndefined();
    expect(shareDescription(" a \n b ")).toBe("a b");
  });
});

describe("buildStoreMetadata", () => {
  it("clears what the Tallaby layout above it sets", () => {
    const meta = buildStoreMetadata(store({}), "ar", { indexable: true });
    expect(meta).toMatchObject({ keywords: null, authors: null, creator: null, publisher: null, category: null });
    // Tallaby's default card is the last share image, so the card is large; no Tallaby handle.
    expect(meta.twitter).toEqual({ card: "summary_large_image" });
    expect(JSON.stringify(meta.twitter)).not.toContain("tallaby");
    expect(meta.openGraph?.images).toEqual([{ url: "https://shop.com/og-image.jpg", width: 1200, height: 630, type: "image/jpeg" }]);
  });

  it("gives /en its own Open Graph address, and adds no noindex to an indexable store", () => {
    const meta = buildStoreMetadata(store({}), "en", { indexable: true });
    expect(meta.openGraph).toMatchObject({ url: "https://shop.com/en", locale: "en_US" });
    expect("robots" in meta).toBe(false);
    expect(buildStoreMetadata(store({}), "ar", { indexable: false }).robots).toEqual(STORE_NOINDEX);
  });
});

describe("storeHomeMetadata", () => {
  it("changes nothing when the seller wrote nothing", () => {
    expect(storeHomeMetadata(store({}), "ar", {})).toEqual({});
    expect(storeHomeMetadata(store({}), "ar", undefined)).toEqual({});
  });

  it("uses the seller's text and keeps the rest of the home page's values", () => {
    const meta = storeHomeMetadata(store({}), "ar", { title: "Best mugs", description: "Mugs in Cairo" });
    expect(meta.title).toBe("Best mugs");
    expect(meta.description).toBe("Mugs in Cairo");
    expect(meta.openGraph).toMatchObject({ url: "https://shop.com", title: "Best mugs", description: "Mugs in Cairo" });
    expect("robots" in meta).toBe(false);
    expect("alternates" in meta).toBe(false);
  });

  it("doesn't add the store name to a title that has it, and honours noindex", () => {
    expect(storeHomeMetadata(store({}), "ar", { title: "Shop for mugs" }).title).toEqual({ absolute: "Shop for mugs" });
    const hidden = storeHomeMetadata(store({}), "ar", { noindex: true });
    expect(hidden.robots).toEqual(STORE_NOINDEX);
    expect("title" in hidden).toBe(false);
  });
});

describe("storeCatalogSeo", () => {
  it("keeps the category and page, and drops sort", () => {
    expect(storeCatalogSeo({})).toEqual({ path: "/products", noindex: false });
    expect(storeCatalogSeo({ category: "mugs", page: 1 }).path).toBe("/products?category=mugs");
    expect(storeCatalogSeo({ category: "mugs", page: 3 }).path).toBe("/products?category=mugs&page=3");
  });

  it("keeps search results out of the index, under the catalog's address", () => {
    expect(storeCatalogSeo({ search: "red mug" })).toEqual({ path: "/products", noindex: true });
  });
});

describe("storeStructuredData", () => {
  const input = {
    displayName: "Shop",
    subdomain: "shop",
    customDomain: "shop.com",
    logoUrl: "https://img/logo.png",
    description: "Mugs",
    social: [{ url: "https://instagram.com/shop" }, { url: "01000000000" }],
    supportEmail: "hi@shop.com",
    supportPhone: null,
  };

  it("describes the store at its own address, never Tallaby", () => {
    const [organization, website] = storeStructuredData(input, "ar");
    expect(organization).toMatchObject({ "@type": "OnlineStore", name: "Shop", url: "https://shop.com", logo: "https://img/logo.png", email: "hi@shop.com" });
    expect(organization).not.toHaveProperty("telephone");
    expect(organization?.sameAs).toEqual(["https://instagram.com/shop"]);
    expect(website).toMatchObject({ "@type": "WebSite", name: "Shop", url: "https://shop.com", inLanguage: "ar" });
    expect(JSON.stringify([organization, website]).toLowerCase()).not.toContain("tallaby");
  });
});
