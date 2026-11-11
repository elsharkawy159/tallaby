/**
 * The shortlist with a store niche (niche editions, ROADMAP F-90, plan §4.5).
 * The packs come in through the `editions` parameter (the fixture: t-shirts on
 * `fashion-luxe`), never from the registry, which may be empty. The tests
 * without a niche are in `template-shortlist.lib.test.ts`, unchanged.
 */
import { describe, expect, it } from "vitest";
import { EDITIONS } from "@workspace/store-sections/templates";
import { TSHIRTS } from "../../../store-sections/src/templates/editions/tshirts.fixture";
import { nextTemplates, rankTemplates, scoreTemplates, SHORTLIST_WEIGHTS, type ShortlistTemplate, type TemplateShortlistInput } from "./template-shortlist.lib";

const t = (key: string, category: string, style: ShortlistTemplate["style"]): ShortlistTemplate => ({
  key,
  category,
  style,
  needs: { productCards: 4, categoryTiles: 2 },
  tone: "light",
  background: "#ffffff",
});

/** `fashion-luxe` is the fixture's look (a real, edition-ready template key); the others are made up. */
const POOL: ShortlistTemplate[] = [
  t("fashion-luxe", "fashion", ["luxe"]),
  t("f-bold", "fashion", ["bold"]),
  t("f-warm", "fashion", ["warm"]),
  t("f-minimal", "fashion", ["minimal"]),
  t("shoes-luxe", "shoes-bags", ["luxe"]),
  t("classic", "general", ["classic", "minimal"]),
];

const base = (over: Partial<TemplateShortlistInput> = {}): TemplateShortlistInput => ({
  industryId: "fashion",
  styleWords: [],
  productCount: 20,
  categoryCount: 6,
  seed: "seller-1",
  templates: POOL,
  // The niche template rows come in as a parameter too (none here, so no niche template leads).
  nicheTemplates: [],
  ...over,
});

const PACKS = [TSHIRTS];
const strip = (list: ReturnType<typeof rankTemplates>) => list.map(({ key, score }) => ({ key, score }));

describe("the niche weight", () => {
  it("is above a main style match and below the exact-to-related industry gap", () => {
    expect(SHORTLIST_WEIGHTS.nicheEdition).toBeGreaterThan(SHORTLIST_WEIGHTS.styleMain);
    expect(SHORTLIST_WEIGHTS.nicheEdition).toBeGreaterThan(SHORTLIST_WEIGHTS.styleSecond + SHORTLIST_WEIGHTS.colorPoor);
    expect(SHORTLIST_WEIGHTS.nicheEdition).toBeLessThan(SHORTLIST_WEIGHTS.industryExact - SHORTLIST_WEIGHTS.industryRelated);
  });
});

describe("with a niche that has a pack", () => {
  it("gives the look with the edition the bonus and its editionId, and no other template either", () => {
    const ranked = rankTemplates(base({ nicheId: "tshirts", editions: PACKS }));
    for (const entry of ranked) {
      const has = entry.key === "fashion-luxe";
      expect(entry.parts.niche, entry.key).toBe(has ? SHORTLIST_WEIGHTS.nicheEdition : 0);
      expect(entry.editionId, entry.key).toBe(has ? "tshirts" : undefined);
      expect(entry.score).toBe(entry.parts.industry + entry.parts.style + entry.parts.fit + entry.parts.color + entry.parts.niche);
    }
  });

  it("leads its industry on every seed, even against a main style match", () => {
    for (const seed of ["a", "b", "c", "d", "e"]) {
      expect(scoreTemplates(base({ nicheId: "tshirts", editions: PACKS, seed }))[0]).toMatchObject({ key: "fashion-luxe", editionId: "tshirts" });
      // The seller asked for a bold look: the t-shirt edition on a luxe look still comes first, the bold one next.
      const picks = scoreTemplates(base({ nicheId: "tshirts", editions: PACKS, seed, styleWords: ["bold"] }));
      expect(picks.map((pick) => pick.key).slice(0, 2)).toEqual(["fashion-luxe", "f-bold"]);
    }
  });

  it("keeps the industry dominant: a borrowed look never passes the store's own industry on the bonus alone", () => {
    // A shoes store whose niche pack sits on a fashion look (fashion is related to shoes-bags).
    const ranked = rankTemplates(base({ industryId: "shoes-bags", nicheId: "tshirts", editions: PACKS }));
    const by = Object.fromEntries(ranked.map((entry) => [entry.key, entry]));
    expect(by["fashion-luxe"]!.editionId).toBe("tshirts");
    expect(by["fashion-luxe"]!.score).toBeLessThan(by["shoes-luxe"]!.score);
    expect(ranked[0]!.key).toBe("shoes-luxe");
    // And it is ahead of the other looks of its own (related) industry.
    for (const key of ["f-bold", "f-warm", "f-minimal"]) expect(by["fashion-luxe"]!.score).toBeGreaterThan(by[key]!.score);
  });

  it("carries the edition through 'show 3 more', and only on the look that has it", () => {
    const input = base({ nicheId: "tshirts", editions: PACKS });
    const first = scoreTemplates(input);
    const more = nextTemplates(input, first.map((pick) => pick.key));
    for (const pick of [...first, ...more]) expect(pick.editionId, pick.key).toBe(pick.key === "fashion-luxe" ? "tshirts" : undefined);
    expect(more.map((pick) => pick.key)).not.toContain("fashion-luxe");
  });
});

describe("with nothing to add", () => {
  const plain = strip(rankTemplates(base()));

  it("is the list without a niche when the niche has no pack, is unknown, or is not approved on any template in the pool", () => {
    const cases: Partial<TemplateShortlistInput>[] = [
      { nicheId: null, editions: PACKS },
      { nicheId: "", editions: PACKS },
      { nicheId: "dresses", editions: PACKS },
      { nicheId: "no-such-niche", editions: PACKS },
      { nicheId: "tshirts'; --", editions: PACKS },
      { nicheId: "tshirts", editions: [] },
      // A pack whose look is not in the pool, and one on a template that takes no editions.
      { nicheId: "tshirts", editions: PACKS, templates: POOL.filter((template) => template.key !== "fashion-luxe") },
      { nicheId: "tshirts", editions: [{ ...TSHIRTS, looks: ["f-bold", "tallaby-classic"] }] },
    ];
    for (const over of cases) {
      const ranked = rankTemplates(base(over));
      for (const entry of ranked) {
        expect(entry.parts.niche).toBe(0);
        expect("editionId" in entry).toBe(false);
      }
      if (!over.templates) expect(strip(ranked)).toEqual(plain);
    }
  });

  it("with the registered packs and none of this niche, a niche changes nothing", () => {
    // Today the registry is empty; when packs ship, a niche without one still changes nothing.
    const niche = ["tshirts", "dresses", "watches"].find((id) => !EDITIONS.some((edition) => edition.niche === id));
    if (!niche) return;
    expect(strip(rankTemplates(base({ nicheId: niche })))).toEqual(plain);
    expect(scoreTemplates(base({ nicheId: niche }))).toEqual(scoreTemplates(base()));
  });
});

describe("the niche template (one template per niche, ROADMAP F-90)", () => {
  const ROWS = [
    { niche: "dresses", template: "f-minimal", status: "ready" as const },
    { niche: "tshirts", template: "shoes-luxe", status: "pending" as const },
  ];

  // The list with the same niche and no rows: the niche template is the only change.
  const plainFor = (nicheId: string) => rankTemplates(base({ nicheId })).map((entry) => entry.key);

  it("ranks the niche's ready template first and keeps the others in order", () => {
    const plain = plainFor("dresses");
    const ranked = rankTemplates(base({ nicheId: "dresses", nicheTemplates: ROWS })).map((entry) => entry.key);
    expect(ranked).toEqual(["f-minimal", ...plain.filter((key) => key !== "f-minimal")]);
    expect(scoreTemplates(base({ nicheId: "dresses", nicheTemplates: ROWS }))[0]!.key).toBe("f-minimal");
  });

  it("changes nothing for a pending row, another niche, or an excluded template", () => {
    expect(rankTemplates(base({ nicheId: "tshirts", nicheTemplates: ROWS })).map((entry) => entry.key)).toEqual(plainFor("tshirts"));
    expect(rankTemplates(base({ nicheId: "menswear", nicheTemplates: ROWS })).map((entry) => entry.key)).toEqual(plainFor("menswear"));
    expect(rankTemplates(base({ nicheId: "dresses", nicheTemplates: ROWS, exclude: ["f-minimal"] })).map((entry) => entry.key)).toEqual(plainFor("dresses").filter((key) => key !== "f-minimal"));
  });

  it("uses the real rows when none are passed (dresses → fashion-luxe)", () => {
    const { nicheTemplates: _rows, ...rest } = base({ nicheId: "dresses", styleWords: ["warm"] });
    expect(rankTemplates(rest)[0]!.key).toBe("fashion-luxe");
  });
});
