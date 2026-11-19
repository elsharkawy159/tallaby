import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { alternativesShortlist, COMPARE_GROUPS, COMPETITORS, hasCostExample, publishableCompetitors } from "./compare.lib";

/**
 * Every message key the compare and alternatives pages read
 * (`components/marketing/compare/*`), in both locales. A missing key is a
 * visible "missing message" error on a page, so it fails here first.
 */
const load = (locale: string) => JSON.parse(readFileSync(path.resolve(__dirname, `../../messages/marketing/compare.${locale}.json`), "utf8")) as Record<string, unknown>;

function at(root: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), root);
}

const isText = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const isList = (value: unknown) => Array.isArray(value) && value.length > 0;

/** The comparePage keys `compare-page.tsx` and `compare-table.tsx` read for every competitor. */
const PAGE_TEXT = [
  "crumb", "vs", "vsLabel", "title", "checkedOn", "byTeam", "verdictTitle", "chooseTallaby", "chooseCompetitor",
  "priceNoteTitle", "costTitle", "costLead", "costTallaby", "costNote", "tableTitle", "tableNote", "tableCaption",
  "rowsHeader", "sourceN", "strengthsTitle", "strengthsOfTallaby", "strengthsOfCompetitor", "moveTitle", "moveProducts",
  "moveBodyShopify", "moveBodyExcel", "moveLinkShopify", "othersTitle", "alternativesLink", "pricingLink", "pricingLinkBody",
  "closingTitle", "closingBody", "sourcesTitle", "sourcesLead", "sourceRead",
  "legend.y", "legend.n", "legend.p",
  ...["price", "move", "domain", "try", "methods"].flatMap((key) => [`faq.${key}.q`, `faq.${key}.a`]),
  "faq.how.q", "faq.how.a",
];

describe.each(["ar", "en"])("compare messages (%s)", (locale) => {
  const messages = load(locale);
  const page = at(messages, "comparePage");

  it("has every comparePage string the page reads", () => {
    for (const key of PAGE_TEXT) expect(isText(at(page, key)), `comparePage.${key}`).toBe(true);
    expect(isList(at(page, "steps")), "comparePage.steps").toBe(true);
    expect(isList(at(page, "strengthsTallaby")), "comparePage.strengthsTallaby").toBe(true);
  });

  it("labels every group and every row, with Tallaby's own text", () => {
    for (const group of COMPARE_GROUPS) {
      expect(isText(at(page, `groups.${group.id}`)), `comparePage.groups.${group.id}`).toBe(true);
      for (const row of group.rows) {
        expect(isText(at(page, `rows.${row.id}.label`)), `comparePage.rows.${row.id}.label`).toBe(true);
        expect(isText(at(page, `rows.${row.id}.tallaby`)), `comparePage.rows.${row.id}.tallaby`).toBe(true);
      }
    }
  });

  it.each(publishableCompetitors().map((competitor) => [competitor.id, competitor] as const))("%s: has every string its page reads", (id, competitor) => {
    const c = at(messages, `competitors.${id}`);
    for (const key of ["name", "intro", "priceNote"]) expect(isText(at(c, key)), `competitors.${id}.${key}`).toBe(true);
    for (const key of ["verdictTallaby", "verdict", "strengths"]) expect(isList(at(c, key)), `competitors.${id}.${key}`).toBe(true);
    // A cell for every row with a fact (the table shows exactly those rows).
    for (const row of Object.keys(competitor.facts)) expect(isText(at(c, `cells.${row}`)), `competitors.${id}.cells.${row}`).toBe(true);
    if (competitor.alternative) {
      expect(isText(at(c, "alternatives.intro")), `competitors.${id}.alternatives.intro`).toBe(true);
      for (const key of ["why", "steps", "faq"]) expect(isList(at(c, `alternatives.${key}`)), `competitors.${id}.alternatives.${key}`).toBe(true);
      for (const other of alternativesShortlist(competitor)) expect(at(messages, `competitors.${other.id}.shortlist.bestFor`), `competitors.${other.id}.shortlist`).toBeTruthy();
    }
  });

  it("has a cost line for every competitor with a cost example, and none is skipped by accident", () => {
    for (const competitor of COMPETITORS) {
      const cost = at(messages, `competitors.${competitor.id}.cost`);
      if (hasCostExample(competitor)) expect(isText(cost), `competitors.${competitor.id}.cost`).toBe(true);
    }
    // Only a competitor with no published price may skip the block.
    for (const competitor of COMPETITORS.filter((other) => !hasCostExample(other))) expect(competitor.prices, competitor.id).toEqual([]);
  });

  it("writes cost lines with the cost-example tokens, never a number", () => {
    for (const competitor of COMPETITORS.filter(hasCostExample)) {
      const cost = at(messages, `competitors.${competitor.id}.cost`) as string;
      expect(cost, competitor.id).not.toMatch(/\d/);
    }
  });
});

describe("compare messages in both locales", () => {
  it("have the same competitor cells, so a row never shows in one language only", () => {
    const [ar, en] = [load("ar"), load("en")];
    for (const competitor of COMPETITORS) {
      const keys = (messages: Record<string, unknown>) => Object.keys((at(messages, `competitors.${competitor.id}.cells`) as object) ?? {}).sort();
      expect(keys(ar), competitor.id).toEqual(keys(en));
    }
  });
});
