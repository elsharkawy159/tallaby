import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COMPARE_GROUPS, COMPETITORS } from "./compare.lib";
import { FEATURE_PAGES, INTEGRATION_PAGES } from "./detail-pages.lib";
import { INDUSTRIES } from "./industries.lib";
import { INTEGRATION_ITEMS } from "./integrations-hub.lib";
import { SOLUTIONS } from "./solutions.lib";
import { TOOL_SLUGS } from "./tools.lib";

type Json = Record<string, unknown>;

const GROUPS = ["features", "integrations", "compare", "tools", "industries", "keywords"] as const;

function load(group: string, locale: string): Json {
  return JSON.parse(readFileSync(path.resolve(__dirname, `../../messages/marketing/${group}.${locale}.json`), "utf8")) as Json;
}

/** Every leaf path, array indexes included, so a missing translation shows by name. */
function leaves(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => leaves(item, `${prefix}.${i}`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => leaves(item, prefix ? `${prefix}.${key}` : key));
  return [prefix];
}

const messages = (locale: string): Json => {
  const all: Json = {};
  for (const group of GROUPS) {
    for (const [key, value] of Object.entries(load(group, locale))) {
      all[key] = { ...(all[key] as Json | undefined), ...(value as Json) };
    }
  }
  return all;
};

describe.each(["ar", "en"])("content page messages (%s)", (locale) => {
  const m = messages(locale) as Record<string, Record<string, Record<string, unknown>>>;

  it("has what every detail page needs, in the entry's order", () => {
    for (const page of [...FEATURE_PAGES, ...INTEGRATION_PAGES]) {
      const words = m.detailPages![page.slug] as Record<string, unknown[]>;
      expect(words.steps, page.slug).toHaveLength(page.steps.length);
      expect(words.related, page.slug).toHaveLength(page.related.length);
      if (page.benefits) expect(words.benefits, page.slug).toHaveLength(page.benefits.length);
      if (page.uses) expect(words.uses, page.slug).toHaveLength(page.uses.length);
      for (const name of page.events ?? []) expect((words.events as unknown as Record<string, string>)[name], name).toBeTruthy();
      expect(m.meta![`${page.kind}-${page.slug}`], page.slug).toBeTruthy();
    }
  });

  it("names every integration and competitor fact", () => {
    for (const item of INTEGRATION_ITEMS) {
      expect(m.integrationsHub!.items![item.id as never], item.id).toBeTruthy();
      expect(m.integrationsHub!.categories![item.category as never], item.category).toBeTruthy();
    }
    for (const group of COMPARE_GROUPS) {
      expect(m.comparePage!.groups![group.id as never], group.id).toBeTruthy();
      for (const row of group.rows) expect(m.comparePage!.rows![row.id as never], row.id).toBeTruthy();
    }
    for (const competitor of COMPETITORS) {
      const words = m.competitors![competitor.id] as Record<string, Record<string, string>>;
      expect(Object.keys(words.cells!).sort(), competitor.id).toEqual(Object.keys(competitor.cells).sort());
    }
  });

  it("has what tools, industries and solutions need", () => {
    for (const slug of TOOL_SLUGS) expect(m.meta![`tool-${slug}`], slug).toBeTruthy();
    for (const industry of INDUSTRIES) {
      const words = m.industryPages![industry.slug] as Record<string, unknown[]> & { store: { products: unknown[] } };
      expect(words.needs).toHaveLength(industry.needs.length);
      expect(words.steps).toHaveLength(industry.stepIcons.length);
      expect(words.store.products).toHaveLength(industry.productFocus.length);
      expect(m.meta![`industry-${industry.slug}`]).toBeTruthy();
    }
    for (const solution of SOLUTIONS) {
      const words = m.solutionPages![solution.slug] as Record<string, unknown[]>;
      expect(words.trust).toHaveLength(solution.trustIcons.length);
      expect(words.features).toHaveLength(solution.featureIcons.length);
      expect(words.related).toHaveLength(solution.related.length);
      expect(m.meta![`solution-${solution.slug}`]).toBeTruthy();
    }
  });

  it("never publishes a review placeholder or a claim the product can't back", () => {
    const text = GROUPS.map((group) => JSON.stringify(load(group, locale))).join(" ");
    expect(text).not.toContain("يُراجع");
    expect(text).not.toMatch(/5 ج\.م|EGP 5\b|24\/7|على مدار الساعة/);
  });
});

describe.each(GROUPS)("the %s group", (group) => {
  it("has the same keys in Arabic and English", () => {
    expect(leaves(load(group, "en")).sort()).toEqual(leaves(load(group, "ar")).sort());
  });
});
