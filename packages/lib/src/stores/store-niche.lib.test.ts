import { describe, expect, it } from "vitest";
import { effectiveStoreNiche, industryOfCategory, nicheForIndustry, parseStoreNiche, storeNicheIdSchema } from "./store-niche.lib";

describe("storeNicheIdSchema", () => {
  it("accepts a known niche id and refuses anything else", () => {
    expect(storeNicheIdSchema.safeParse("tshirts").success).toBe(true);
    expect(storeNicheIdSchema.safeParse(" tshirts ").data).toBe("tshirts");
    for (const value of ["no-such-niche", "T-Shirts", "", "a".repeat(80), "../x", 3, null]) {
      expect(storeNicheIdSchema.safeParse(value).success, String(value)).toBe(false);
    }
  });
});

describe("nicheForIndustry", () => {
  it("keeps a niche of the same industry and drops the rest", () => {
    expect(nicheForIndustry("tshirts", "fashion")).toBe("tshirts");
    expect(nicheForIndustry("tshirts", "electronics")).toBeNull();
    expect(nicheForIndustry("tshirts", null)).toBeNull();
    expect(nicheForIndustry("no-such-niche", "fashion")).toBeNull();
    expect(nicheForIndustry(42, "fashion")).toBeNull();
  });
});

describe("parseStoreNiche", () => {
  it("reads a known niche id from the settings", () => {
    expect(parseStoreNiche({ niche: "watches", currency: "EGP" })).toBe("watches");
    expect(parseStoreNiche({ niche: "nope" })).toBeNull();
    expect(parseStoreNiche({ niche: 1 })).toBeNull();
    expect(parseStoreNiche({})).toBeNull();
    expect(parseStoreNiche(null)).toBeNull();
    expect(parseStoreNiche("tshirts")).toBeNull();
  });
});

describe("industryOfCategory", () => {
  it("reads today's and earlier industry names, never free text", () => {
    expect(industryOfCategory({ en: "Fashion", ar: "أزياء وملابس" })).toBe("fashion");
    expect(industryOfCategory({ en: null, ar: "أزياء وملابس" })).toBe("fashion");
    expect(industryOfCategory({ en: " fashion " })).toBe("fashion");
    expect(industryOfCategory({ en: "Jewelry & Watches" })).toBe("jewelry");
    expect(industryOfCategory({ ar: "مجوهرات وساعات" })).toBe("jewelry");
    expect(industryOfCategory({ en: "Cotton tees", ar: "تيشيرتات" })).toBeNull();
    expect(industryOfCategory({})).toBeNull();
  });
});

describe("effectiveStoreNiche", () => {
  const fashion = { storeCategory: "Fashion", storeCategoryAr: "أزياء وملابس", name: "Shop" };

  it("uses the saved niche when it belongs to the store's industry", () => {
    expect(effectiveStoreNiche({ ...fashion, settings: { niche: "dresses" } }, "fashion")).toBe("dresses");
  });

  it("ignores a saved niche of another industry and falls back to the guess", () => {
    expect(effectiveStoreNiche({ ...fashion, settings: { niche: "watches" } }, "fashion")).toBeNull();
    expect(effectiveStoreNiche({ ...fashion, name: "تيشيرتات قطن", settings: { niche: "watches" } }, "fashion")).toBe("tshirts");
  });

  it("guesses from the category and name when nothing is saved", () => {
    expect(effectiveStoreNiche({ settings: {}, storeCategory: null, storeCategoryAr: "تيشيرتات", name: null }, null)).toBe("tshirts");
    expect(effectiveStoreNiche({ ...fashion, settings: {} }, "fashion")).toBeNull();
  });
});
