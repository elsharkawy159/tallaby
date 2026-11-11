/**
 * The niche list lives in @workspace/store-sections, which cannot import this
 * package, so the checks that tie niches to `STORE_INDUSTRIES` live here.
 */
import { describe, expect, it } from "vitest";
import { matchNiche } from "../../../store-sections/src/templates/editions/match";
import { NICHE_INDUSTRY_NAMES, NICHES, nichesOfIndustry } from "../../../store-sections/src/templates/editions/niches";
import { STORE_INDUSTRIES, findIndustry } from "./industries.lib";

describe("niches and store industries", () => {
  it("puts every niche in a store industry, and gives every industry niches", () => {
    const ids = new Set(STORE_INDUSTRIES.map((industry) => industry.id));
    for (const niche of NICHES) expect(ids.has(niche.industry), `${niche.id}: ${niche.industry}`).toBe(true);
    for (const industry of STORE_INDUSTRIES) expect(nichesOfIndustry(industry.id).length, industry.id).toBeGreaterThan(0);
  });

  it("knows every industry name, today's and earlier ones", () => {
    expect(NICHE_INDUSTRY_NAMES).toEqual(Object.fromEntries(STORE_INDUSTRIES.map((industry) => [industry.id, [industry.en, industry.ar, ...(industry.aliases ?? [])]])));
  });

  it("never reads a niche from an industry name alone, and reads the industry from it", () => {
    for (const industry of STORE_INDUSTRIES) {
      for (const name of [industry.en, industry.ar, ...(industry.aliases ?? [])]) {
        expect(matchNiche({ category: { en: name } }), name).toBeNull();
        expect(matchNiche({ category: { ar: name } }), name).toBeNull();
      }
      expect(matchNiche({ category: { en: industry.en, ar: industry.ar } }), industry.id).toBeNull();
    }
    // A store saved with the old jewelry names, with watch products: the industry still helps.
    const saved = { en: "Jewelry & Watches", ar: "مجوهرات وساعات" };
    expect(findIndustry(saved)?.id).toBe("jewelry");
    expect(matchNiche({ category: saved, productTitles: ["ساعة رجالي جلد", "ساعة حريمي استانلس", "ساعة كلاسيك"] })?.nicheId).toBe("watches");
    expect(matchNiche({ category: saved, hint: "سماعات" })).toBeNull();
  });
});
