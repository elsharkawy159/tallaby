import { describe, expect, it } from "vitest";
import { GENERAL_QUERIES, findIndustry, industryQueries, templatesForIndustry } from "./industries.lib";

describe("store industries", () => {
  it("matches by English or Arabic name, ignoring case and spaces", () => {
    expect(findIndustry({ en: " fashion " })?.id).toBe("fashion");
    expect(findIndustry({ ar: "إكسسوارات موبايل" })?.id).toBe("mobile-accessories");
    expect(findIndustry({ en: "Garden tools" })).toBeNull();
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
