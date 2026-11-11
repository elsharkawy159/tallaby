import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES } from "../catalog";
import { normalizeText } from "./match";
import { getNiche, NICHE_INDUSTRY_NAMES, NICHE_LOOKS, NICHES, nichesOfIndustry } from "./niches";

/**
 * Keywords listed in more than one niche on purpose (normalised spelling →
 * niche ids, sorted). A new overlap fails the test until it is added here, so
 * no word lands in two niches by accident.
 */
const SHARED_KEYWORDS: Record<string, string[]> = {
  // Plain "earphones" is right for both; the store's industry decides (the two are kin in match.ts).
  سماعات: ["audio", "earbuds"],
  سماعه: ["audio", "earbuds"],
};

describe("niche list", () => {
  it("has the 83 niches of the plan, each id once", () => {
    expect(NICHES).toHaveLength(83);
    expect(new Set(NICHES.map((niche) => niche.id)).size).toBe(83);
    for (const niche of NICHES) expect(niche.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it("puts every niche in a known industry, and every industry has niches", () => {
    const industries = Object.keys(NICHE_INDUSTRY_NAMES);
    expect(industries).toHaveLength(17);
    for (const niche of NICHES) expect(industries, niche.id).toContain(niche.industry);
    for (const industry of industries) expect(nichesOfIndustry(industry).length, industry).toBeGreaterThanOrEqual(3);
    expect(nichesOfIndustry("jewelry").map((niche) => niche.id)).toEqual(["glasses", "watches", "gold-jewelry", "silver-jewelry", "fashion-jewelry", "hair-accessories", "belts-wallets"]);
    expect(nichesOfIndustry("nothing")).toEqual([]);
  });

  it("names every niche in both languages", () => {
    for (const niche of NICHES) {
      expect(niche.name.ar.trim(), niche.id).not.toBe("");
      expect(niche.name.en.trim(), niche.id).not.toBe("");
      expect(niche.name.ar, niche.id).toMatch(/[ء-ي]/);
      expect(niche.name.en, niche.id).not.toMatch(/[ء-ي]/);
    }
    expect(getNiche("dresses")?.name).toEqual({ ar: "فساتين", en: "Dresses" });
    expect(getNiche("watches")?.name).toEqual({ ar: "ساعات يد", en: "Hand watches" });
    expect(getNiche("nope")).toBeNull();
    expect(getNiche(null)).toBeNull();
  });

  it("gives every niche 8 to 20 keywords per language, none twice", () => {
    for (const niche of NICHES) {
      for (const language of ["ar", "en"] as const) {
        const words = niche.keywords[language];
        expect(words.length, `${niche.id} ${language}`).toBeGreaterThanOrEqual(8);
        expect(words.length, `${niche.id} ${language}`).toBeLessThanOrEqual(20);
        for (const word of words) {
          if (language === "ar") expect(word, niche.id).toMatch(/[ء-ي]/);
          else expect(word, niche.id).not.toMatch(/[ء-ي]/);
        }
      }
      const spellings = [...niche.keywords.ar, ...niche.keywords.en].map(normalizeText);
      const twice = spellings.filter((word, index) => spellings.indexOf(word) !== index);
      expect(twice, niche.id).toEqual([]);
    }
  });

  it("shares a keyword between niches only on purpose", () => {
    const owners = new Map<string, Set<string>>();
    for (const niche of NICHES) {
      for (const word of [...niche.keywords.ar, ...niche.keywords.en]) {
        const key = normalizeText(word);
        owners.set(key, (owners.get(key) ?? new Set()).add(niche.id));
      }
    }
    const shared = Object.fromEntries([...owners].filter(([, ids]) => ids.size > 1).map(([word, ids]) => [word, [...ids].sort()]));
    expect(shared).toEqual(SHARED_KEYWORDS);
  });

  it("picks only looks that exist, two or three per niche, best first", () => {
    const keys = new Set(CODE_TEMPLATES.map((template) => template.key));
    expect(Object.keys(NICHE_LOOKS).sort()).toEqual(NICHES.map((niche) => niche.id).sort());
    for (const [niche, looks] of Object.entries(NICHE_LOOKS)) {
      expect(looks.length, niche).toBeGreaterThanOrEqual(2);
      expect(looks.length, niche).toBeLessThanOrEqual(3);
      expect(new Set(looks).size, niche).toBe(looks.length);
      for (const look of looks) expect(keys.has(look), `${niche}: ${look}`).toBe(true);
    }
    expect(NICHE_LOOKS.dresses).toEqual(["fashion-luxe", "vella", "kasr"]);
    // 197 editions in the plan (§2.2 totals).
    expect(Object.values(NICHE_LOOKS).reduce((sum, looks) => sum + looks.length, 0)).toBe(199);
  });
});
