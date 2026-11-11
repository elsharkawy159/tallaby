/**
 * One template per niche (ROADMAP F-90, docs/systems/one-template-per-niche.md
 * §1): the `NICHE_TEMPLATES` rules, and the switched-industry rules checked
 * on the real set and, since that is empty for now, on fake sets too.
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

/** Every rule a switched industry must meet: its problems, empty when it may switch. */
function switchProblems(industry: string, rows: readonly NicheTemplate[] = NICHE_TEMPLATES): string[] {
  const problems: string[] = [];
  for (const niche of NICHES.filter((n) => n.industry === industry)) {
    const row = rows.find((r) => r.niche === niche.id);
    if (!row || row.status !== "ready") problems.push(`niche ${niche.id} has no ready row`);
  }
  const served = new Set(rows.map((row) => row.template));
  for (const template of CODE_TEMPLATES.filter((t) => t.category === industry && t.key !== CLASSIC_KEY)) {
    if (!served.has(template.key)) problems.push(`template ${template.key} is in no row`);
  }
  return problems;
}

describe("NICHE_TEMPLATES", () => {
  it("has the 30 wave-1 rows", () => {
    expect(NICHE_TEMPLATES).toHaveLength(30);
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

  it("marks a row with no pack ready only when it is native", () => {
    // Native rows (plan §2): the template's own content is already the niche.
    const native = ["modest-wear", "silver-jewelry", "wearables"];
    for (const row of NICHE_TEMPLATES.filter((r) => !r.edition && r.status === "ready")) expect(native).toContain(row.niche);
  });

  it("finds rows by niche and by template", () => {
    expect(nicheTemplateFor("dresses")?.template).toBe("fashion-luxe");
    expect(nicheOfTemplate("fashion-luxe")?.niche).toBe("dresses");
    expect(nicheTemplateFor("no-such-niche")).toBeUndefined();
    expect(nicheTemplateFor(null)).toBeUndefined();
    expect(nicheOfTemplate("no-such-template")).toBeUndefined();
    expect(readyNicheTemplate("fadda")).toBeUndefined();
    expect(readyNicheTemplate("silver-jewelry")?.template).toBe("fadda");
    expect(readyNicheTemplate("kidswear")).toBeUndefined();
  });

  it("puts the ready niche template first among a niche's looks", () => {
    expect(nicheTemplateFirst("dresses", ["vella", "fashion-luxe"])).toEqual(["fashion-luxe", "vella"]);
    expect(nicheTemplateFirst("dresses", ["vella"])).toEqual(["vella"]);
    // A pending row changes nothing.
    expect(nicheTemplateFirst("sportswear", ["zay", "sports-luxe"])).toEqual(["zay", "sports-luxe"]);
    expect(nicheTemplateFirst(null, ["zay"])).toEqual(["zay"]);
  });
});

describe("switched industries", () => {
  it("every real switched industry meets the switch rules", () => {
    for (const industry of SWITCHED_INDUSTRIES) {
      expect(isIndustrySwitchable(industry), industry).toBe(true);
      expect(switchProblems(industry), industry).toEqual([]);
    }
  });

  // The real set is empty for now: the same checks on fake rows and sets.
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
    // Today: earbuds is pending, so mobile accessories cannot switch.
    expect(isIndustrySwitchable("mobile-accessories")).toBe(false);
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
    expect(switchedNicheTemplates("mobile-accessories")).toEqual([]);
  });

  it("a switched card is a ready row of a switched industry", () => {
    expect(switchedNicheCard("volt", FAKE_SWITCHED, FAKE)?.niche).toBe("phone-cases");
    expect(switchedNicheCard("volt")).toBeUndefined();
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
