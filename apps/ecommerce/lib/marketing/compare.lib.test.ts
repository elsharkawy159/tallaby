import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  alternativeCompetitors,
  alternativesShortlist,
  COMPARE_GROUPS,
  COMPARE_PUBLIC,
  compareLinkTargets,
  compareRobots,
  compareSlug,
  comparisonTable,
  competitorSources,
  COMPETITORS,
  factsCheckedOn,
  findCompetitorBySlug,
  isComparePublic,
  MIN_VERIFIED_FACTS,
  publicCompetitors,
  publishableCompetitors,
  verifiedFactCount,
  worksInEgypt,
  type Competitor,
} from "./compare.lib";
import { COMPETITOR_PRICES, competitorPriceUsdCents, formatNativeCompetitorPrice, marketingPriceVars, PRICE_NAMES, PRICE_TOKENS } from "./pricing.lib";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ROW_IDS = new Set(COMPARE_GROUPS.flatMap((group) => group.rows.map((row) => row.id)));

describe("competitor data", () => {
  it("gives every fact a known row, a status, an official https source (or a descriptive note) and an ISO date", () => {
    for (const competitor of COMPETITORS) {
      for (const [row, fact] of Object.entries(competitor.facts)) {
        const where = `${competitor.id}.${row}`;
        expect(ROW_IDS.has(row as never), where).toBe(true);
        expect(["y", "n", "p"], where).toContain(fact!.status);
        expect(fact!.checkedOn, where).toMatch(ISO);
        if (fact!.mark === "descriptive") expect(fact!.source.length, where).toBeGreaterThan(10);
        else expect(fact!.source, where).toMatch(/^https:\/\/\S+$/);
      }
    }
  });

  it("uses unique ids, slugs and names", () => {
    const ids = COMPETITORS.map((competitor) => competitor.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(compareSlug({ id })).toMatch(/^tallaby-vs-[a-z0-9-]+$/);
    for (const competitor of COMPETITORS) expect(competitor.arabicNames.length, competitor.id).toBeGreaterThan(0);
  });

  it("prices every competitor price token it uses, each with a source and a date", () => {
    for (const competitor of COMPETITORS) {
      for (const key of competitor.prices) {
        const price = COMPETITOR_PRICES[key];
        expect(price, key).toBeTruthy();
        expect(price.source, key).toMatch(/^https:\/\//);
        expect(price.checkedOn, key).toMatch(ISO);
        expect(Number.isInteger(price.minor), key).toBe(true);
      }
    }
  });

  it("has a comparison for each of the six researched competitors", () => {
    const built = publishableCompetitors().map((competitor) => competitor.id);
    expect(built).toEqual(expect.arrayContaining(["easyorders", "shopify", "woocommerce", "expandcart", "salla", "zid"]));
  });

  it("states at least one thing each competitor does that Tallaby doesn't, or does only partly", () => {
    const tallaby = new Map(COMPARE_GROUPS.flatMap((group) => group.rows.map((row) => [row.id, row.tallaby] as const)));
    for (const competitor of publishableCompetitors()) {
      const ahead = Object.entries(competitor.facts).some(([row, fact]) => fact!.status === "y" && tallaby.get(row as never) !== "y");
      expect(ahead, competitor.id).toBe(true);
    }
  });
});

describe("gating", () => {
  const thin: Competitor = {
    id: "x",
    category: "eg",
    latin: "X",
    arabicNames: ["اكس"],
    publish: true,
    facts: { freePlan: { status: "y", source: "https://x.example/pricing", checkedOn: "2026-11-10", mark: "official" } },
    prices: [],
    moveSteps: "excel-import",
  };
  const thirdParty: Competitor = {
    ...thin,
    id: "y",
    facts: Object.fromEntries(["freePlan", "monthly", "cod", "templates", "domain"].map((row) => [row, { status: "y", source: "https://blog.example/", checkedOn: "2026-11-10", mark: "third-party" }])),
  };

  it("counts only official facts toward the threshold", () => {
    expect(verifiedFactCount(thirdParty)).toBe(0);
    expect(publishableCompetitors([thin, thirdParty])).toEqual([]);
    for (const competitor of publishableCompetitors()) expect(verifiedFactCount(competitor)).toBeGreaterThanOrEqual(MIN_VERIFIED_FACTS);
    expect(findCompetitorBySlug("tallaby-vs-x")).toBeUndefined();
  });

  it("keeps everything noindex and unlinked from public pages while the switch is off", () => {
    expect(COMPARE_PUBLIC).toBe(false);
    expect(publicCompetitors()).toEqual([]);
    expect(compareRobots()).toEqual({ index: false, follow: false });
    for (const competitor of publishableCompetitors()) {
      expect(isComparePublic(competitor)).toBe(false);
      expect(compareRobots(competitor)).toEqual({ index: false, follow: false });
    }
  });

  it("releases only competitors with publish on when the switch flips", () => {
    const released = publicCompetitors(true).map((competitor) => competitor.id);
    for (const competitor of publishableCompetitors()) expect(released.includes(competitor.id), competitor.id).toBe(competitor.publish);
  });

  it("lets a preview page link every built comparison", () => {
    expect(compareLinkTargets()).toEqual(publishableCompetitors());
  });
});

describe("tables and sources", () => {
  it("shows only rows with a fact, and no empty group", () => {
    const groups = comparisonTable({ facts: { freePlan: { status: "y", source: "https://x.example", checkedOn: "2026-11-10", mark: "official" } } });
    expect(groups).toHaveLength(1);
    expect(groups[0]!.rows.map((row) => row.id)).toEqual(["freePlan"]);
  });

  it("lists each source once with its oldest read date, and shows the oldest date on the page", () => {
    const facts = {
      freePlan: { status: "y", source: "https://x.example/a", checkedOn: "2026-11-10", mark: "official" },
      monthly: { status: "y", source: "https://x.example/a", checkedOn: "2026-11-08", mark: "official" },
      cod: { status: "y", source: "https://x.example/b", checkedOn: "2026-11-09", mark: "official" },
      domain: { status: "n", source: "What it plainly is", checkedOn: "2026-11-01", mark: "descriptive" },
    } as const;
    expect(competitorSources({ facts, prices: [] })).toEqual([
      { url: "https://x.example/a", checkedOn: "2026-11-08" },
      { url: "https://x.example/b", checkedOn: "2026-11-09" },
    ]);
    expect(factsCheckedOn({ facts, prices: [] })).toBe("2026-11-01");
  });
});

describe("alternatives", () => {
  it("builds EasyOrders and Shopify alternatives pages", () => {
    expect(alternativeCompetitors().map((competitor) => competitor.id)).toEqual(expect.arrayContaining(["easyorders", "shopify"]));
  });

  it("recommends only options that work for sellers in Egypt (no Salla)", () => {
    for (const competitor of alternativeCompetitors()) {
      const list = alternativesShortlist(competitor);
      expect(list.length, competitor.id).toBeGreaterThan(0);
      for (const other of list) {
        expect(worksInEgypt(other), other.id).toBe(true);
        expect(other.id).not.toBe(competitor.id);
      }
      expect(list.map((other) => other.id)).not.toContain("salla");
    }
  });
});

describe("competitor price tokens", () => {
  it("joins the price tokens, so copy never writes a competitor's number", () => {
    for (const key of Object.keys(COMPETITOR_PRICES)) {
      expect(PRICE_NAMES).toContain(key);
      expect(PRICE_TOKENS[key as keyof typeof PRICE_TOKENS]).toBe(`{${key}}`);
    }
  });

  it("converts dollars and riyals like our own prices, and shows EGP list prices and percentages as published", () => {
    expect(competitorPriceUsdCents({ minor: 2700, currency: "USD" })).toBe(2700);
    expect(competitorPriceUsdCents({ minor: 37_500, currency: "SAR" })).toBe(10_000);
    expect(competitorPriceUsdCents({ minor: 59_900, currency: "EGP" })).toBeNull();
    expect(formatNativeCompetitorPrice({ minor: 59_900, currency: "EGP" }, "en")).toBe("599 EGP");
    expect(formatNativeCompetitorPrice({ minor: 112_860, currency: "EGP" }, "ar")).toBe("⁦1,128.60⁩ جنيه");
    expect(formatNativeCompetitorPrice({ minor: 200, currency: "percent" }, "en")).toBe("2%");
    const vars = marketingPriceVars(50, "ar", { isolate: false });
    for (const key of Object.keys(COMPETITOR_PRICES)) expect(vars[key as keyof typeof vars], key).not.toMatch(/[$]|USD|دولار|⁦/);
  });
});

describe("compare copy", () => {
  const load = (locale: string) => JSON.parse(readFileSync(path.resolve(__dirname, `../../messages/marketing/compare.${locale}.json`), "utf8")) as Record<string, unknown>;

  it.each(["ar", "en"])("%s: writes no price as a literal, only tokens", (locale) => {
    const text = JSON.stringify(load(locale));
    // A number next to a currency, or a dollar sign: every price goes through COMPETITOR_PRICES or our own tokens.
    expect(text).not.toMatch(/[$€]\s?\d|\d[\d,.]*\s?(EGP|USD|SAR|جنيه|دولار|ريال)/);
  });

  it.each(["ar", "en"])("%s: uses only price tokens that exist", (locale) => {
    const tokens = JSON.stringify(load(locale)).match(/\{([a-zA-Z]+)\}/g) ?? [];
    const allowed = new Set([...PRICE_NAMES, "days", "name", "date", "email", "n", "count"]);
    for (const token of tokens) expect(allowed.has(token.slice(1, -1) as never), token).toBe(true);
  });
});
