import { describe, expect, it } from "vitest";
import { STORE_CATEGORY_SEO_NOUNS, storeSeoFallback } from "@workspace/lib/stores";
import { GENERAL_QUERIES, STORE_INDUSTRIES, findIndustry, industryQueries, templatesForIndustry } from "./industries.lib";

describe("store industries", () => {
  it("matches by English or Arabic name, ignoring case and spaces", () => {
    expect(findIndustry({ en: " fashion " })?.id).toBe("fashion");
    expect(findIndustry({ ar: "إكسسوارات موبايل" })?.id).toBe("mobile-accessories");
    expect(findIndustry({ en: "Garden tools" })).toBeNull();
  });

  it("keeps stores saved with an industry's earlier name (jewelry was renamed 2026-11-11)", () => {
    const jewelry = STORE_INDUSTRIES.find((i) => i.id === "jewelry")!;
    expect(jewelry.en).toBe("Accessories & Jewelry");
    expect(jewelry.ar).toBe("إكسسوارات ومجوهرات");
    expect(findIndustry({ en: "Accessories & Jewelry" })?.id).toBe("jewelry");
    expect(findIndustry({ ar: "إكسسوارات ومجوهرات" })?.id).toBe("jewelry");
    expect(findIndustry({ en: "Jewelry & Watches" })?.id).toBe("jewelry");
    expect(findIndustry({ en: " jewelry & watches ", ar: null })?.id).toBe("jewelry");
    expect(findIndustry({ ar: "مجوهرات وساعات" })?.id).toBe("jewelry");
    expect(findIndustry({ en: "Jewelry & Watches", ar: "مجوهرات وساعات" })?.id).toBe("jewelry");
    // The old names still give the industry's photo searches.
    expect(industryQueries({ en: "Jewelry & Watches" })[0]).toBe("jewelry");
    // No name, old or new, belongs to two industries.
    const names = STORE_INDUSTRIES.flatMap((i) => [i.en, i.ar, ...(i.aliases ?? [])].map((name) => name.trim().toLowerCase()));
    expect(new Set(names).size).toBe(names.length);
  });

  it("searches the industry, then the English category, then general terms", () => {
    expect(industryQueries({ en: "Electronics" })[0]).toBe("electronics gadgets");
    expect(industryQueries({ en: "Garden tools" })).toEqual(["Garden tools", ...GENERAL_QUERIES]);
    expect(industryQueries({ ar: "أدوات حدائق" })).toEqual([...GENERAL_QUERIES]);
  });

  it("keeps only the store's industry templates, plus the current one", () => {
    const templates = [
      { key: "a", category: "fashion" },
      { key: "b", category: "electronics" },
      { key: "c", category: "fashion" },
      { key: "d", category: "jewelry" },
    ];
    expect(templatesForIndustry(templates, "fashion").map((t) => t.key)).toEqual(["a", "c"]);
    expect(templatesForIndustry(templates, "fashion", "b").map((t) => t.key)).toEqual(["a", "b", "c"]);
    // No template of its own industry: the related industries' templates.
    expect(templatesForIndustry(templates, "shoes-bags").map((t) => t.key)).toEqual(["a", "c", "d"]);
    // Unknown industry, or nothing related: every template.
    expect(templatesForIndustry(templates, null)).toHaveLength(4);
    expect(templatesForIndustry(templates, "pets")).toHaveLength(4);
  });
});

describe("industry SEO nouns (@workspace/lib/stores)", () => {
  it("cover every name, old or new, of the industries they rename", () => {
    for (const entry of STORE_CATEGORY_SEO_NOUNS) {
      const industry = STORE_INDUSTRIES.find((i) => i.id === entry.industryId);
      expect(industry, entry.industryId).toBeDefined();
      expect([...entry.names].sort()).toEqual([industry!.en, industry!.ar, ...(industry!.aliases ?? [])].sort());
    }
  });

  it("use the goods noun instead of the display name", () => {
    for (const entry of STORE_CATEGORY_SEO_NOUNS) {
      const industry = STORE_INDUSTRIES.find((i) => i.id === entry.industryId)!;
      expect(storeSeoFallback("Shop", industry.ar, "ar").title).toBe(`اشتري ${entry.ar} من Shop الآن | طلبي`);
      expect(storeSeoFallback("Shop", industry.en, "en").title).toBe(`Buy ${entry.en} from Shop now | Tallaby`);
    }
    expect(STORE_CATEGORY_SEO_NOUNS.map((entry) => entry.industryId)).toContain("pets");
  });
});
