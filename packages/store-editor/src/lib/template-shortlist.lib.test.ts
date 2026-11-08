import { describe, expect, it } from "vitest";
import { CODE_TEMPLATES, getCodeTemplate } from "@workspace/store-sections/templates";
import { colorPenalty, fitPenalty, nextTemplates, rankTemplates, scoreTemplates, SHORTLIST_WEIGHTS, stylesFromWords, type ShortlistTemplate, type TemplateShortlistInput } from "./template-shortlist.lib";

const t = (key: string, category: string, style: ShortlistTemplate["style"], extra: Partial<ShortlistTemplate> = {}): ShortlistTemplate => ({
  key,
  category,
  style,
  needs: { productCards: 4, categoryTiles: 2 },
  tone: "light",
  background: "#ffffff",
  ...extra,
});

const POOL: ShortlistTemplate[] = [
  t("f-luxe", "fashion", ["luxe"]),
  t("f-luxe-2", "fashion", ["luxe", "classic"]),
  t("f-bold", "fashion", ["bold"]),
  t("f-warm", "fashion", ["warm"]),
  t("f-minimal", "fashion", ["minimal"]),
  t("shoes-luxe", "shoes-bags", ["luxe"]),
  t("jewel-classic", "jewelry", ["classic"]),
  t("food-playful", "food", ["playful"]),
  t("classic", "general", ["classic", "minimal"]),
];

const base = (over: Partial<TemplateShortlistInput> = {}): TemplateShortlistInput => ({
  industryId: "fashion",
  styleWords: [],
  productCount: 20,
  categoryCount: 6,
  seed: "seller-1",
  templates: POOL,
  ...over,
});

const keys = (list: { key: string }[]) => list.map((x) => x.key);

describe("stylesFromWords", () => {
  it("maps Arabic and English words", () => {
    expect(stylesFromWords(["فخم"])).toEqual(["luxe"]);
    expect(stylesFromWords(["luxury"])).toEqual(["luxe"]);
    expect(stylesFromWords(["عصري", "modern", "bold"])).toEqual(["bold"]);
    expect(stylesFromWords(["دافئ cozy"])).toEqual(["warm"]);
    expect(stylesFromWords(["بسيط", "clean"])).toEqual(["minimal"]);
    expect(stylesFromWords(["مرح", "kids"])).toEqual(["playful"]);
    expect(stylesFromWords(["كلاسيك"])).toEqual(["classic"]);
  });

  it("keeps the order first mentioned and drops repeats and unknown words", () => {
    expect(stylesFromWords(["Clean and LUXURY, clean!", "blue"])).toEqual(["minimal", "luxe"]);
    expect(stylesFromWords([])).toEqual([]);
    expect(stylesFromWords(["زرقاء"])).toEqual([]);
  });

  it("reads Arabic with the article, a prefix, hamza and taa marbuta forms", () => {
    expect(stylesFromWords(["الفخم"])).toEqual(["luxe"]);
    expect(stylesFromWords(["والعصري"])).toEqual(["bold"]);
    expect(stylesFromWords(["أنيق"])).toEqual(["luxe"]);
    expect(stylesFromWords(["فخامة"])).toEqual(["luxe"]);
    expect(stylesFromWords(["هادىء", "جرئ"])).toEqual(["minimal", "bold"]);
  });
});

describe("scores", () => {
  it("industry: exact > related (nearest first) > the default > other", () => {
    const ranked = rankTemplates(base({ industryId: "fashion" }));
    const by = Object.fromEntries(ranked.map((r) => [r.key, r.parts.industry]));
    expect(by["f-bold"]).toBe(SHORTLIST_WEIGHTS.industryExact);
    expect(by["shoes-luxe"]).toBe(SHORTLIST_WEIGHTS.industryRelated); // shoes-bags is fashion's nearest
    expect(by["jewel-classic"]).toBe(SHORTLIST_WEIGHTS.industryRelated - SHORTLIST_WEIGHTS.relatedStep);
    expect(by["classic"]).toBe(SHORTLIST_WEIGHTS.industryGeneral);
    expect(by["food-playful"]).toBe(0);
  });

  it("no industry: only the default gets industry points", () => {
    const ranked = rankTemplates(base({ industryId: null }));
    for (const r of ranked) expect(r.parts.industry).toBe(r.key === "classic" ? SHORTLIST_WEIGHTS.industryGeneral : 0);
  });

  it("style: main match beats a second match", () => {
    const ranked = rankTemplates(base({ styleWords: ["classic"] }));
    const by = Object.fromEntries(ranked.map((r) => [r.key, r.parts.style]));
    expect(by["jewel-classic"]).toBe(SHORTLIST_WEIGHTS.styleMain);
    expect(by["f-luxe-2"]).toBe(SHORTLIST_WEIGHTS.styleSecond);
    expect(by["f-bold"]).toBe(0);
  });

  it("explicit styles count like words", () => {
    const a = rankTemplates(base({ styles: ["warm"] }));
    expect(a[0]!.key).toBe("f-warm");
  });

  it("fit: penalises a home that needs more than the seller has, capped", () => {
    expect(fitPenalty({ productCards: 12, categoryTiles: 6 }, 5, 1)).toBe(-(7 * 2 + 5 * 4));
    expect(fitPenalty({ productCards: 24, categoryTiles: 8 }, 0, 0)).toBe(-(SHORTLIST_WEIGHTS.productShortfallMax + SHORTLIST_WEIGHTS.categoryShortfallMax));
    expect(fitPenalty({ productCards: 4, categoryTiles: 2 }, 10, 3)).toBe(0);
    expect(fitPenalty({ productCards: 4, categoryTiles: 2 }, Number.NaN, -3)).toBe(-(4 * 2 + 2 * 4));
  });

  it("fit moves a smaller home ahead for a small catalog", () => {
    const pool = [t("big", "fashion", ["bold"], { needs: { productCards: 12, categoryTiles: 6 } }), t("small", "fashion", ["bold"], { needs: { productCards: 4, categoryTiles: 1 } })];
    for (const seed of ["a", "b", "c", "d"]) expect(rankTemplates(base({ templates: pool, productCount: 5, categoryCount: 1, seed }))[0]!.key).toBe("small");
  });

  it("colour: a very light primary on a light template, or a very dark one on a dark template", () => {
    expect(colorPenalty({ tone: "light", background: "#ffffff" }, "#fafafa")).toBe(-SHORTLIST_WEIGHTS.colorPoor);
    expect(colorPenalty({ tone: "light", background: "#ffffff" }, "#c8c8c8")).toBe(-SHORTLIST_WEIGHTS.colorWeak);
    expect(colorPenalty({ tone: "light", background: "#ffffff" }, "#145163")).toBe(0);
    expect(colorPenalty({ tone: "dark", background: "#0f1117" }, "#111111")).toBe(-SHORTLIST_WEIGHTS.colorPoor);
    expect(colorPenalty({ tone: "dark", background: "#0f1117" }, "#fdad28")).toBe(0);
    expect(colorPenalty({ tone: "dark" }, "#000000")).toBe(-SHORTLIST_WEIGHTS.colorPoor);
    expect(colorPenalty({ tone: "light" }, null)).toBe(0);
    expect(colorPenalty({ tone: "light" }, "teal")).toBe(0);
  });

  it("colour moves a dark template ahead for a very light primary", () => {
    const pool = [t("light", "fashion", ["bold"]), t("dark", "fashion", ["bold"], { tone: "dark", background: "#111111" })];
    for (const seed of ["a", "b", "c", "d"]) expect(rankTemplates(base({ templates: pool, primaryColor: "#fff8f0", seed }))[0]!.key).toBe("dark");
  });
});

describe("scoreTemplates", () => {
  it("returns 3 by default, with different main styles", () => {
    const picks = scoreTemplates(base({ styleWords: ["luxury"] }));
    expect(picks).toHaveLength(3);
    expect(picks[0]!.mainStyle).toBe("luxe");
    expect(new Set(picks.map((p) => p.mainStyle)).size).toBe(3);
    // The second luxe fashion template scores higher than f-bold but repeats a main style.
    expect(keys(picks)).not.toContain("f-luxe-2");
  });

  it("repeats a main style when nothing else is close enough", () => {
    const pool = [t("a", "fashion", ["luxe"]), t("b", "fashion", ["luxe"]), t("c", "food", ["bold"])];
    const picks = scoreTemplates(base({ templates: pool }));
    expect(keys(picks).slice(0, 2).sort()).toEqual(["a", "b"]);
    expect(picks[2]!.key).toBe("c");
  });

  it("repeats a main style when the pool has only one", () => {
    const pool = [t("a", "fashion", ["luxe"]), t("b", "fashion", ["luxe"]), t("c", "fashion", ["luxe"])];
    expect(scoreTemplates(base({ templates: pool }))).toHaveLength(3);
  });

  it("is deterministic per seed and can differ between seeds on ties", () => {
    const pool = Array.from({ length: 12 }, (_, i) => t(`tie-${i}`, "fashion", ["bold"]));
    const one = keys(scoreTemplates(base({ templates: pool, seed: "s1" })));
    expect(keys(scoreTemplates(base({ templates: pool, seed: "s1" })))).toEqual(one);
    const seeds = ["s2", "s3", "s4", "s5", "s6"].map((seed) => keys(scoreTemplates(base({ templates: pool, seed }))).join());
    expect(seeds.some((s) => s !== one.join())).toBe(true);
  });

  it("honours exclude and count", () => {
    const picks = scoreTemplates(base({ exclude: ["f-luxe", "f-bold"], count: 5 }));
    expect(picks).toHaveLength(5);
    expect(keys(picks)).not.toContain("f-luxe");
    expect(keys(picks)).not.toContain("f-bold");
    expect(scoreTemplates(base({ count: 0 }))).toEqual([]);
  });

  it("skips a template with no style", () => {
    const pool = [t("none", "fashion", []), t("a", "fashion", ["warm"])];
    expect(keys(scoreTemplates(base({ templates: pool })))).toEqual(["a"]);
  });

  it("score is the sum of its parts", () => {
    for (const p of scoreTemplates(base({ styleWords: ["warm"], primaryColor: "#fafafa", productCount: 1 })))
      expect(p.score).toBe(p.parts.industry + p.parts.style + p.parts.fit + p.parts.color);
  });
});

describe("nextTemplates", () => {
  it("never repeats what was shown, and walks the whole pool", () => {
    const input = base({ styleWords: ["luxury"] });
    const seen: string[] = [];
    for (let round = 0; round < 5; round++) {
      const next = nextTemplates(input, seen);
      for (const key of keys(next)) expect(seen).not.toContain(key);
      seen.push(...keys(next));
    }
    expect(new Set(seen).size).toBe(POOL.length);
    expect(nextTemplates(input, seen)).toEqual([]);
  });

  it("keeps the input's own excludes", () => {
    expect(keys(nextTemplates(base({ exclude: ["f-warm"] }), ["f-luxe"]))).not.toContain("f-warm");
  });
});

describe("with the real catalog", { timeout: 30_000 }, () => {
  it("suggests three templates of the industry with different main styles", () => {
    const picks = scoreTemplates({ industryId: "fashion", styleWords: ["فخم"], productCount: 30, categoryCount: 6, seed: "store-1" });
    expect(picks).toHaveLength(3);
    expect(new Set(picks.map((p) => p.mainStyle)).size).toBe(3);
    expect(picks[0]!.mainStyle).toBe("luxe");
    for (const p of picks) expect(getCodeTemplate(p.key)!.category).toBe("fashion");
  });

  it("an industry with few templates falls back to related ones", () => {
    const picks = scoreTemplates({ industryId: "pets", styleWords: [], productCount: 10, categoryCount: 3, seed: "store-2" });
    expect(picks).toHaveLength(3);
    for (const p of picks) expect(["home", "food", "kids", "general"]).toContain(getCodeTemplate(p.key)!.category);
  });

  it("show more walks every template once", () => {
    const input: TemplateShortlistInput = { industryId: "electronics", styleWords: ["modern"], productCount: 8, categoryCount: 3, seed: "x" };
    const seen: string[] = [];
    for (let i = 0; i < 60 && seen.length < CODE_TEMPLATES.length; i++) seen.push(...nextTemplates(input, seen).map((p) => p.key));
    expect(new Set(seen).size).toBe(CODE_TEMPLATES.length);
  });
});
