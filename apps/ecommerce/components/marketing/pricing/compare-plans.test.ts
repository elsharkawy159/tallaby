import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PLANS } from "@workspace/lib/plans";
import { COMPARE_GROUPS, COMPARE_ROW_IDS, COMPARE_VALUE_KEYS, rowDiffers } from "./compare-plans.lib";

type Json = Record<string, unknown>;

const load = (locale: string): Json =>
  JSON.parse(readFileSync(path.resolve(__dirname, `../../../messages/marketing/pricing.${locale}.json`), "utf8")) as Json;

/** Every leaf path, array indexes included, so a missing translation shows by name. */
function leaves(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => leaves(item, `${prefix}.${i}`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => leaves(item, prefix ? `${prefix}.${key}` : key));
  return [prefix];
}

describe("pricing messages", () => {
  it("have the same keys in Arabic and English", () => {
    expect(leaves(load("ar")).sort()).toEqual(leaves(load("en")).sort());
  });
});

describe.each(["ar", "en"])("compare table messages (%s)", (locale) => {
  const compare = (load(locale).pricing as Json).compare as {
    groups: Record<string, string>;
    rows: Record<string, { label?: string; desc?: string }>;
    values: Record<string, string>;
  };

  it("names every group, row and value, and nothing more", () => {
    for (const group of COMPARE_GROUPS) expect(compare.groups[group.id], group.id).toBeTruthy();
    for (const id of COMPARE_ROW_IDS) {
      expect(compare.rows[id]?.label, id).toBeTruthy();
      expect(compare.rows[id]?.desc, id).toBeTruthy();
    }
    for (const key of COMPARE_VALUE_KEYS) expect(compare.values[key], key).toBeTruthy();
    expect(Object.keys(compare.rows).sort()).toEqual([...COMPARE_ROW_IDS].sort());
    expect(Object.keys(compare.groups).sort()).toEqual(COMPARE_GROUPS.map((group) => group.id).sort());
  });

  it("never states a plan number in the copy (numbers come from the plans module)", () => {
    const copy = JSON.stringify(compare.values);
    for (const n of [PLANS.free.aiCreditsMonthly, PLANS.pro.aiCreditsMonthly, PLANS.free.emailsMonthly, PLANS.pro.emailsMonthly]) {
      expect(copy).not.toContain(n.toLocaleString("en-US"));
    }
  });
});

describe("COMPARE_GROUPS", () => {
  it("has unique row ids", () => {
    expect(new Set(COMPARE_ROW_IDS).size).toBe(COMPARE_ROW_IDS.length);
  });

  it("only differs where the plans module differs: price, AI credits and campaign emails", () => {
    const differing = COMPARE_GROUPS.flatMap((group) => group.rows.filter(rowDiffers).map((row) => row.id)).sort();
    expect(differing).toEqual(["aiCredits", "emailCampaigns", "monthlyFee", "orderFee"]);
  });
});
