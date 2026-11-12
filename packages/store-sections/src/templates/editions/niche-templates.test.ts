/**
 * One template per niche (ROADMAP F-90, docs/systems/one-template-per-niche.md
 * §1): the `NICHE_TEMPLATES` rules, and the switched-industry rules checked
 * on the real set (accessories, then every industry, 2026-11-12) and on fake
 * sets too.
 */
import { describe, expect, it } from "vitest";
import { CLASSIC_KEY } from "../classic";
import { CODE_TEMPLATES } from "../catalog";
import { EDITIONS, isEditionReady } from "./index";
import {
  NICHE_TEMPLATES,
  SWITCHED_INDUSTRIES,
  isIndustrySwitchable,
  isIndustrySwitched,
  isRetiredTemplate,
  nicheOfTemplate,
  nicheTemplateFirst,
  nicheTemplateFor,
  readyNicheTemplate,
  switchedNicheCard,
  switchedNicheTemplates,
  type NicheTemplate,
} from "./niche-templates";
import { NICHES, getNiche } from "./niches";

/** Deleted on 2026-11-12 when every industry switched to one template per niche (stores keep their copies). */
const DELETED_2026_11_12 = [
  ...["kettan", "nasig", "mawsem", "arcade", "tany", "electronics-bold", "electronics-warm"],
  ...["bashra", "kohl", "perfumes-luxe", "perfumes-warm"],
  ...["sakan", "dar", "mobilia", "nour", "salon", "furniture-bold", "furniture-warm"],
  ...["daily", "harvest", "sabaho", "grocery-bold", "mama"],
  ...["pace", "rep", "boxing", "nashat", "sports-warm"],
  ...["drive", "pitstop", "tarik", "gifts-bold"],
];

/** Every rule a switched industry must meet: its problems, empty when it may switch. */
function switchProblems(industry: string, rows: readonly NicheTemplate[] = NICHE_TEMPLATES): string[] {
  const problems: string[] = [];
  for (const niche of NICHES.filter((n) => n.industry === industry)) {
    const row = rows.find((r) => r.niche === niche.id);
    if (!row || row.status === "pending") problems.push(`niche ${niche.id} has no ready row`);
  }
  const served = new Set(rows.map((row) => row.template));
  for (const template of CODE_TEMPLATES.filter((t) => t.category === industry && t.key !== CLASSIC_KEY)) {
    if (!served.has(template.key)) problems.push(`template ${template.key} is in no row`);
  }
  return problems;
}

describe("NICHE_TEMPLATES", () => {
  it("has one row per niche: the 30 of wave 1 and the 53 of waves 2–13", () => {
    expect(NICHE_TEMPLATES).toHaveLength(83);
    expect(NICHE_TEMPLATES.map((row) => row.niche).sort()).toEqual(NICHES.map((niche) => niche.id).sort());
    // Every row can be shown: no niche waits for a template.
    expect(NICHE_TEMPLATES.filter((row) => row.status === "pending").map((row) => row.niche)).toEqual([]);
  });

  it("every template but Tallaby Classic serves exactly one niche, in the niche's own industry", () => {
    const served = NICHE_TEMPLATES.map((row) => row.template);
    expect(CODE_TEMPLATES.filter((t) => t.key !== CLASSIC_KEY && !served.includes(t.key)).map((t) => t.key)).toEqual([]);
    expect(CODE_TEMPLATES).toHaveLength(84);
    // A template borrowed from another industry moved to its niche's, so the niche's tab lists it.
    // kasr keeps "fashion" (its edition-ready output is guarded byte for byte); galleries list it under shoes & bags by its row.
    for (const row of NICHE_TEMPLATES.filter((r) => r.template !== "kasr")) {
      expect(CODE_TEMPLATES.find((t) => t.key === row.template)?.category, row.template).toBe(getNiche(row.niche)?.industry);
    }
  });

  it("deleted templates are gone from the catalog, and nothing treats their keys as niche templates", () => {
    expect(DELETED_2026_11_12).toHaveLength(32);
    for (const key of DELETED_2026_11_12) {
      expect(CODE_TEMPLATES.some((t) => t.key === key), key).toBe(false);
      expect(nicheOfTemplate(key), key).toBeUndefined();
      for (const edition of EDITIONS) expect(edition.looks, `${edition.niche}: ${key}`).not.toContain(key);
    }
  });

  it("lists a template in at most one row and a niche once", () => {
    const templates = NICHE_TEMPLATES.map((row) => row.template);
    const niches = NICHE_TEMPLATES.map((row) => row.niche);
    expect(templates.filter((key, i) => templates.indexOf(key) !== i)).toEqual([]);
    expect(niches.filter((id, i) => niches.indexOf(id) !== i)).toEqual([]);
  });

  it("names real niches and real templates", () => {
    const keys = new Set(CODE_TEMPLATES.map((template) => template.key));
    expect(NICHE_TEMPLATES.filter((row) => !getNiche(row.niche)).map((row) => row.niche)).toEqual([]);
    expect(NICHE_TEMPLATES.filter((row) => !keys.has(row.template)).map((row) => row.template)).toEqual([]);
  });

  it("names registered packs, and a ready row's pack draws on its template", () => {
    for (const row of NICHE_TEMPLATES.filter((r) => r.edition)) {
      const edition = EDITIONS.find((e) => e.niche === row.edition);
      expect(edition, `${row.niche}: pack ${row.edition} is not in EDITIONS`).toBeDefined();
      expect(row.edition, `${row.niche}: a row's pack is the niche's own`).toBe(row.niche);
      if (row.status === "ready") {
        expect(edition!.looks, `${row.niche}: the pack does not list ${row.template}`).toContain(row.template);
        expect(isEditionReady(row.template), `${row.template} is not edition-ready`).toBe(true);
      }
    }
  });

  it("marks a row with no pack ready only when it is native; the others show the template's own content", () => {
    // Native rows (plan §2): the template's own content is already the niche.
    const native = ["modest-wear", "silver-jewelry", "wearables"];
    for (const row of NICHE_TEMPLATES.filter((r) => !r.edition && r.status === "ready")) expect(native).toContain(row.niche);
    // "own": no pack yet, so never an edition.
    for (const row of NICHE_TEMPLATES.filter((r) => r.status === "own")) expect(row.edition, row.niche).toBeUndefined();
  });

  it("one pack, one template: every pack draws only on its niche's template", () => {
    for (const edition of EDITIONS) {
      const row = nicheTemplateFor(edition.niche);
      expect(row?.edition, edition.niche).toBe(edition.niche);
      expect(edition.looks, edition.niche).toEqual([row!.template]);
      for (const look of Object.keys(edition.perLook ?? {})) expect(look, edition.niche).toBe(row!.template);
    }
  });

  it("finds rows by niche and by template", () => {
    expect(nicheTemplateFor("dresses")?.template).toBe("fashion-luxe");
    expect(nicheOfTemplate("fashion-luxe")?.niche).toBe("dresses");
    expect(nicheTemplateFor("no-such-niche")).toBeUndefined();
    expect(nicheTemplateFor(null)).toBeUndefined();
    expect(nicheOfTemplate("no-such-template")).toBeUndefined();
    expect(readyNicheTemplate("fadda")).toBeUndefined();
    expect(readyNicheTemplate("silver-jewelry")?.template).toBe("fadda");
    // Kids' wear has no pack yet: its row shows Nawl's own content.
    expect(readyNicheTemplate("kidswear")?.template).toBe("fashion-warm");
    expect(readyNicheTemplate("kidswear", [{ niche: "kidswear", template: "fashion-warm", status: "pending" }])).toBeUndefined();
  });

  it("puts the ready niche template first among a niche's looks", () => {
    expect(nicheTemplateFirst("dresses", ["vella", "fashion-luxe"])).toEqual(["fashion-luxe", "vella"]);
    expect(nicheTemplateFirst("dresses", ["vella"])).toEqual(["vella"]);
    // An "own" row leads too; a pending row changes nothing.
    expect(nicheTemplateFirst("kidswear", ["zay", "fashion-warm"])).toEqual(["fashion-warm", "zay"]);
    expect(nicheTemplateFirst("kidswear", ["zay", "fashion-warm"], [{ niche: "kidswear", template: "fashion-warm", status: "pending" }])).toEqual(["zay", "fashion-warm"]);
    expect(nicheTemplateFirst(null, ["zay"])).toEqual(["zay"]);
  });
});

describe("switched industries", () => {
  it("every industry with niches is switched", () => {
    expect([...SWITCHED_INDUSTRIES].sort()).toEqual([...new Set(NICHES.map((niche) => niche.industry))].sort());
    expect(isIndustrySwitched("general")).toBe(false);
    expect(CODE_TEMPLATES.filter((t) => isRetiredTemplate(t)).map((t) => t.key)).toEqual([]);
  });

  it("every real switched industry meets the switch rules", () => {
    for (const industry of SWITCHED_INDUSTRIES) {
      expect(isIndustrySwitchable(industry), industry).toBe(true);
      expect(switchProblems(industry), industry).toEqual([]);
    }
  });

  it("accessories (jewelry) is switched: seven niche cards, one template each, nothing retired left in code", () => {
    expect(SWITCHED_INDUSTRIES.has("jewelry")).toBe(true);
    expect(isIndustrySwitchable("jewelry")).toBe(true);
    const cards = switchedNicheTemplates("jewelry");
    expect(cards.map((row) => [row.niche, row.template, row.edition ?? null])).toEqual([
      ["glasses", "karat", "glasses"],
      ["watches", "saat", "watches"],
      ["gold-jewelry", "jewelry-luxe", "gold-jewelry"],
      ["silver-jewelry", "fadda", null],
      ["fashion-jewelry", "zahra", "fashion-jewelry"],
      ["hair-accessories", "kholkhal", "hair-accessories"],
      ["belts-wallets", "jewelry-warm", "belts-wallets"],
    ]);
    // Every accessories template in code is a niche card; the deleted ones are gone.
    expect(CODE_TEMPLATES.filter((t) => t.category === "jewelry").map((t) => t.key).sort()).toEqual(cards.map((row) => row.template).sort());
    for (const key of ["lulu", "mahr", "jewelry-bold"]) expect(CODE_TEMPLATES.some((t) => t.key === key), key).toBe(false);
    expect(switchedNicheCard("zahra")?.niche).toBe("fashion-jewelry");
    // One pack, one template: each accessories pack draws only on its niche's template.
    for (const row of cards.filter((r) => r.edition)) expect(EDITIONS.find((e) => e.niche === row.edition)?.looks, row.niche).toEqual([row.template]);
  });

  // The other industries are not switched yet: the same checks on fake rows and sets.
  const FAKE: readonly NicheTemplate[] = [
    { niche: "phone-cases", template: "volt", edition: "phone-cases", status: "ready" },
    { niche: "chargers-cables", template: "kabl", edition: "chargers-cables", status: "ready" },
    { niche: "earbuds", template: "wasla", status: "ready" },
  ];
  const FAKE_SWITCHED = new Set(["mobile-accessories"]);

  it("isIndustrySwitchable: every niche of the industry needs a ready row", () => {
    expect(isIndustrySwitchable("mobile-accessories", FAKE)).toBe(true);
    expect(isIndustrySwitchable("mobile-accessories", FAKE.slice(0, 2))).toBe(false);
    expect(isIndustrySwitchable("mobile-accessories", [...FAKE.slice(0, 2), { niche: "earbuds", template: "wasla", status: "pending" }])).toBe(false);
    // An industry with no niche never switches.
    expect(isIndustrySwitchable("general", FAKE)).toBe(false);
    // Earbuds shows Wasla's own content until its pack is built, so mobile accessories could switch.
    expect(isIndustrySwitchable("mobile-accessories")).toBe(true);
  });

  it("the template rule: every template of a switched industry is in a row", () => {
    const mobileTemplates = CODE_TEMPLATES.filter((t) => t.category === "mobile-accessories").map((t) => t.key);
    const missing = mobileTemplates.filter((key) => !FAKE.some((row) => row.template === key));
    expect(switchProblems("mobile-accessories", FAKE)).toEqual(missing.map((key) => `template ${key} is in no row`));
    const full: NicheTemplate[] = [...FAKE, ...missing.map((key, i): NicheTemplate => ({ niche: `fake-${i}`, template: key, status: "ready" }))];
    expect(switchProblems("mobile-accessories", full)).toEqual([]);
    expect(switchProblems("mobile-accessories", FAKE.slice(1))).toContain("niche phone-cases has no ready row");
  });

  it("lists a switched industry's ready rows in NICHES order, nothing for an unswitched one", () => {
    expect(isIndustrySwitched("mobile-accessories", FAKE_SWITCHED)).toBe(true);
    expect(isIndustrySwitched("fashion", FAKE_SWITCHED)).toBe(false);
    expect(isIndustrySwitched(null, FAKE_SWITCHED)).toBe(false);
    const order = NICHES.filter((n) => n.industry === "mobile-accessories").map((n) => n.id);
    expect(switchedNicheTemplates("mobile-accessories", FAKE_SWITCHED, FAKE).map((row) => row.niche)).toEqual(order);
    expect(switchedNicheTemplates("fashion", FAKE_SWITCHED, FAKE)).toEqual([]);
    expect(switchedNicheTemplates("mobile-accessories", new Set<string>())).toEqual([]);
    expect(switchedNicheTemplates("mobile-accessories").map((row) => row.template)).toEqual(["volt", "kabl", "wasla"]);
  });

  it("a switched card is a ready row of a switched industry", () => {
    expect(switchedNicheCard("volt", FAKE_SWITCHED, FAKE)?.niche).toBe("phone-cases");
    expect(switchedNicheCard("volt", new Set<string>())).toBeUndefined();
    expect(switchedNicheCard("volt")?.niche).toBe("phone-cases");
    expect(switchedNicheCard("fashion-luxe", FAKE_SWITCHED)).toBeUndefined();
    expect(switchedNicheCard("wasla", FAKE_SWITCHED, [{ niche: "earbuds", template: "wasla", status: "pending" }])).toBeUndefined();
  });

  it("retires the switched industry's templates that serve no row, never Tallaby Classic", () => {
    expect(isRetiredTemplate({ key: "volt", category: "mobile-accessories" }, FAKE_SWITCHED, FAKE)).toBe(false);
    expect(isRetiredTemplate({ key: "other", category: "mobile-accessories" }, FAKE_SWITCHED, FAKE)).toBe(true);
    expect(isRetiredTemplate({ key: "other", category: "fashion" }, FAKE_SWITCHED, FAKE)).toBe(false);
    expect(isRetiredTemplate({ key: CLASSIC_KEY, category: "mobile-accessories" }, FAKE_SWITCHED, FAKE)).toBe(false);
    expect(CODE_TEMPLATES.filter((t) => isRetiredTemplate(t))).toEqual([]);
  });
});
