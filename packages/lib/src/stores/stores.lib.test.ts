import { describe, expect, it } from "vitest";
import {
  createStoreInputSchema,
  facebookDomainVerificationSchema,
  SEO_DESCRIPTION_RANGE,
  SEO_KEYWORDS_MAX,
  SEO_KEYWORD_MAX_LENGTH,
  SEO_TITLE_RANGE,
  effectiveTitleTemplate,
  normalizeSeoKeywords,
  pageSearchTitle,
  parseStoreSeo,
  readSeoKeywords,
  seoChecklist,
  seoKeywordsSchema,
  seoLengthStatus,
  seoScore,
  storeSeoDefaults,
  storeSeoSchema,
  suggestPageKeywords,
  suggestStoreKeywords,
  storeGeneralSettingsSchema,
  subdomainCandidates,
} from "./stores.lib";
import { validateSubdomain } from "../storefront";
import { SAUDI_RIYAL_LABEL } from "../utils/formatPrice";

describe("subdomainCandidates", () => {
  it("suggests valid alternatives derived from the base", () => {
    const list = subdomainCandidates("my-shop");
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list).not.toContain("my-shop");
    for (const s of list) expect(validateSubdomain(s), s).toBeNull();
    expect(list.every((s) => s.startsWith("my-shop"))).toBe(true);
  });

  it("keeps suggestions within the length limit for long bases", () => {
    const base = "a".repeat(32);
    for (const s of subdomainCandidates(base)) {
      expect(s.length).toBeLessThanOrEqual(32);
      expect(validateSubdomain(s), s).toBeNull();
    }
  });

  it("never suggests reserved words", () => {
    for (const s of subdomainCandidates("shop")) expect(validateSubdomain(s), s).toBeNull();
  });

  it("returns an empty list for an unusable base", () => {
    expect(subdomainCandidates("")).toEqual([]);
    expect(subdomainCandidates("--")).toEqual([]);
  });
});

describe("createStoreInputSchema", () => {
  it("normalizes the subdomain and trims the name", () => {
    const parsed = createStoreInputSchema.parse({ name: "  متجري الجديد ", subdomain: " My-Store " });
    expect(parsed).toEqual({ name: "متجري الجديد", subdomain: "my-store" });
  });

  it("rejects too-short names", () => {
    expect(createStoreInputSchema.safeParse({ name: "a", subdomain: "abc" }).success).toBe(false);
  });
});

describe("storeGeneralSettingsSchema", () => {
  it("accepts a partial update", () => {
    expect(storeGeneralSettingsSchema.safeParse({ description: "Hi" }).success).toBe(true);
  });

  it("rejects unknown keys (no mass assignment of seller_id, status, …)", () => {
    expect(storeGeneralSettingsSchema.safeParse({ sellerId: "x" }).success).toBe(false);
    expect(storeGeneralSettingsSchema.safeParse({ status: "active" }).success).toBe(false);
  });

  it("saves a currency together with one of its own symbols", () => {
    const ok = (v: object) => storeGeneralSettingsSchema.safeParse(v).success;
    expect(ok({ currency: "SAR", currencyLabel: "ر.س" })).toBe(true);
    expect(ok({ currency: "SAR", currencyLabel: "SAR" })).toBe(true);
    expect(ok({ currency: "SAR", currencyLabel: SAUDI_RIYAL_LABEL })).toBe(true);
    expect(ok({ currency: "EGP", currencyLabel: SAUDI_RIYAL_LABEL })).toBe(false);
    expect(ok({ currency: "EGP", currencyLabel: "جنيهاً" })).toBe(true);
    expect(ok({ currency: "SAR", currencyLabel: "ج.م" })).toBe(false);
    expect(ok({ currencyLabel: "ج.م" })).toBe(false);
    expect(ok({ currency: "USD" })).toBe(false);
    expect(ok({ currency: "JPY", currencyLabel: "JPY" })).toBe(false);
  });

  it("requires the default locale to be supported", () => {
    expect(
      storeGeneralSettingsSchema.safeParse({ defaultLocale: "en", supportedLocales: ["ar"] }).success,
    ).toBe(false);
    expect(
      storeGeneralSettingsSchema.safeParse({ defaultLocale: "en", supportedLocales: ["ar", "en"] }).success,
    ).toBe(true);
  });

  it("validates contact details", () => {
    expect(storeGeneralSettingsSchema.safeParse({ contact: { email: "nope" } }).success).toBe(false);
    expect(
      storeGeneralSettingsSchema.safeParse({ contact: { email: "a@b.co", phone: "01012345678" } }).success,
    ).toBe(true);
    const parsed = storeGeneralSettingsSchema.parse({ contact: { phone: "٠١١٥٢٣٧٢٣٥٨", whatsapp: "+20 115 237 2358" } });
    expect(parsed.contact).toEqual({ phone: "01152372358", whatsapp: "01152372358" });
    expect(storeGeneralSettingsSchema.safeParse({ contact: { phone: "12" } }).success).toBe(false);
  });

  it("only accepts http(s) image URLs", () => {
    expect(storeGeneralSettingsSchema.safeParse({ logoUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(storeGeneralSettingsSchema.safeParse({ logoUrl: "https://cdn.example/logo.png" }).success).toBe(true);
    expect(storeGeneralSettingsSchema.safeParse({ logoUrl: null }).success).toBe(true);
  });
});

describe("catalog mode", () => {
  it("is not settable through general settings (only with its selection)", () => {
    expect(storeGeneralSettingsSchema.safeParse({ catalogMode: "selected" }).success).toBe(false);
  });

  it("validates mode and product ids, dedupes and keeps order", async () => {
    const { storeCatalogInputSchema, STORE_CATALOG_MAX_PRODUCTS } = await import("./stores.lib");
    const a = "11111111-1111-4111-8111-111111111111";
    const b = "22222222-2222-4222-8222-222222222222";
    expect(storeCatalogInputSchema.parse({ mode: "selected", productIds: [b, a, b.toUpperCase()] })).toEqual({
      mode: "selected",
      productIds: [b, a],
    });
    expect(storeCatalogInputSchema.safeParse({ mode: "some", productIds: [] }).success).toBe(false);
    expect(storeCatalogInputSchema.safeParse({ mode: "all", productIds: ["1; drop"] }).success).toBe(false);
    expect(storeCatalogInputSchema.safeParse({ mode: "all", productIds: [], storeId: a }).success).toBe(false);
    expect(
      storeCatalogInputSchema.safeParse({ mode: "selected", productIds: Array(STORE_CATALOG_MAX_PRODUCTS + 1).fill(a) }).success,
    ).toBe(false);
  });
});

describe("facebook domain verification", () => {
  it("accepts a Meta token and turns an empty value into null (remove)", () => {
    expect(facebookDomainVerificationSchema.parse(" abc123def456ghi789jkl012mno345 ")).toBe("abc123def456ghi789jkl012mno345");
    expect(facebookDomainVerificationSchema.parse("")).toBeNull();
  });

  it("refuses anything that could break out of the content attribute", () => {
    for (const bad of ['abc" onload="x', "<script>", "short", "a".repeat(101), "abc-def_ghi123"]) {
      expect(facebookDomainVerificationSchema.safeParse(bad).success, bad).toBe(false);
    }
  });

  it("is read from stores.seo and a bad stored value is dropped", () => {
    expect(parseStoreSeo({ facebookDomainVerification: "abc123def456" }).facebookDomainVerification).toBe("abc123def456");
    expect(parseStoreSeo({ facebookDomainVerification: '"><x' }).facebookDomainVerification).toBeNull();
    expect(parseStoreSeo(null).facebookDomainVerification).toBeNull();
  });

  it("is not part of the SEO form, so saving the form never sends it", () => {
    const parsed = storeSeoSchema.parse({ titleTemplate: "", description: "", shareImageUrl: "", indexing: true, googleSiteVerification: "" });
    expect(parsed).not.toHaveProperty("facebookDomainVerification");
  });
});

describe("SEO keywords (Website › SEO)", () => {
  const form = { titleTemplate: "", description: "", shareImageUrl: "", indexing: true, googleSiteVerification: "" };

  it("cleans keywords: split on commas, trimmed, spaces collapsed, duplicates dropped", () => {
    expect(normalizeSeoKeywords(["  Bags ,  leather   bags", "bags", "حقائب، شنط", "", 3])).toEqual(["Bags", "leather bags", "حقائب", "شنط"]);
  });

  it("saves the cleaned list and an empty list removes it", () => {
    expect(storeSeoSchema.parse({ ...form, keywords: [" shoes ", "Shoes", "sneakers"] }).keywords).toEqual(["shoes", "sneakers"]);
    expect(storeSeoSchema.parse({ ...form, keywords: [] }).keywords).toBeNull();
    expect(storeSeoSchema.parse({ ...form, keywords: ["  ", ","] }).keywords).toBeNull();
    // Not sent: the saved list is kept.
    expect(storeSeoSchema.parse(form).keywords).toBeUndefined();
  });

  it("refuses too many keywords or one that is too long, never cutting silently", () => {
    const many = Array.from({ length: SEO_KEYWORDS_MAX + 1 }, (_, i) => `k${i}`);
    expect(storeSeoSchema.safeParse({ ...form, keywords: many }).success).toBe(false);
    expect(storeSeoSchema.safeParse({ ...form, keywords: ["a".repeat(SEO_KEYWORD_MAX_LENGTH + 1)] }).success).toBe(false);
    expect(seoKeywordsSchema.safeParse(["a".repeat(SEO_KEYWORD_MAX_LENGTH)]).success).toBe(true);
  });

  it("reads stored keywords field by field: bad entries are dropped, the list capped", () => {
    expect(parseStoreSeo({ keywords: ["ok", 5, "a".repeat(60), "ok"] }).keywords).toEqual(["ok"]);
    expect(parseStoreSeo({ keywords: "not a list" }).keywords).toEqual([]);
    expect(parseStoreSeo({ keywords: Array.from({ length: 40 }, (_, i) => `k${i}`) }).keywords).toHaveLength(SEO_KEYWORDS_MAX);
    expect(parseStoreSeo({ keywords: 5, description: "kept" }).description).toBe("kept");
    expect(readSeoKeywords(null)).toEqual([]);
  });
});

describe("SEO defaults shared by the dashboard and the storefront", () => {
  const store = { name: "Sara", description: null, storeCategory: "Bags", storeCategoryAr: "حقائب" };

  it("uses the store's own text first, then its description, then the F-48a fallback", () => {
    const ar = storeSeoDefaults(store, {}, "ar");
    expect(ar.homeTitle).toBe("اشتري حقائب من Sara الآن | طلبي");
    expect(ar.titleTemplate).toBe("%s | Sara");
    expect(ar.description).toBe("تصفح حقائب من Sara واطلب أونلاين بخطوات بسيطة.");
    expect(ar.keywords).toEqual(["Sara", "حقائب", "Bags"]);
    const own = storeSeoDefaults({ ...store, description: "Handmade bags" }, { titleTemplate: "%s — Sara", keywords: ["x"] }, "en");
    expect(own.homeTitle).toBe("Sara");
    expect(own.titleTemplate).toBe("%s — Sara");
    expect(own.description).toBe("Handmade bags");
    expect(own.keywords).toEqual(["x"]);
    expect(storeSeoDefaults(store, { description: "Mine" }, "en").description).toBe("Mine");
  });

  it("ignores a broken title template", () => {
    expect(effectiveTitleTemplate("no token", "Sara")).toBe("%s | Sara");
    expect(effectiveTitleTemplate("%s %s", "Sara")).toBe("%s | Sara");
  });

  it("suggests keywords from the store, its categories and shopping phrases, capped", () => {
    const list = suggestStoreKeywords(store, [{ name: "Wallets", nameAr: "محافظ" }, { name: "bags", nameAr: null }]);
    expect(list.slice(0, 5)).toEqual(["Sara", "حقائب", "Bags", "محافظ", "Wallets"]);
    expect(list).toContain("حقائب أونلاين");
    expect(list).toContain("Bags online");
    expect(new Set(list.map((k) => k.toLowerCase())).size).toBe(list.length);
    const lots = Array.from({ length: 30 }, (_, i) => ({ name: `Cat ${i}`, nameAr: null }));
    expect(suggestStoreKeywords(store, lots)).toHaveLength(SEO_KEYWORDS_MAX);
    expect(suggestPageKeywords({ name: { ar: "عن المتجر", en: "About" } }, "Sara", ["Sara", "Bags"])).toEqual(["عن المتجر", "About", "Sara", "Bags"]);
  });

  it("shows a page's search title as the storefront renders it", () => {
    const base = { storeName: "Sara", template: "%s | Sara", homeDefault: "Shop from Sara now | Tallaby" };
    expect(pageSearchTitle({ ...base, isHome: false, title: "", pageName: "About" })).toBe("About | Sara");
    expect(pageSearchTitle({ ...base, isHome: false, title: "Our story", pageName: "About" })).toBe("Our story | Sara");
    expect(pageSearchTitle({ ...base, isHome: true, title: "", pageName: "Home" })).toBe(base.homeDefault);
    expect(pageSearchTitle({ ...base, isHome: true, title: "Sara bags", pageName: "Home" })).toBe("Sara bags");
    expect(pageSearchTitle({ ...base, isHome: true, title: "Bags", pageName: "Home" })).toBe("Bags | Sara");
  });

  it("rates lengths and builds the checklist and score", () => {
    expect(seoLengthStatus("", SEO_TITLE_RANGE)).toBe("empty");
    expect(seoLengthStatus("short", SEO_TITLE_RANGE)).toBe("short");
    expect(seoLengthStatus("a".repeat(45), SEO_TITLE_RANGE)).toBe("good");
    expect(seoLengthStatus("a".repeat(61), SEO_TITLE_RANGE)).toBe("long");
    expect(seoLengthStatus("a".repeat(100), SEO_DESCRIPTION_RANGE)).toBe("good");
    const checks = seoChecklist({
      title: "a".repeat(40),
      description: "a".repeat(100),
      ownTitle: true,
      ownDescription: false,
      keywords: ["a", "b", "c"],
      hasImage: false,
      indexing: true,
    });
    expect(checks.filter((c) => c.ok).map((c) => c.key)).toEqual(["title", "keywords", "indexing"]);
    expect(seoScore(checks)).toBe(60);
    expect(seoScore([])).toBe(0);
  });
});
