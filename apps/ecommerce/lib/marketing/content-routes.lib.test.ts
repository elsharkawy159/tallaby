import { describe, expect, it } from "vitest";
import { compareRobots, comparisonTable, COMPARE_PUBLIC, COMPETITORS, findCompetitorBySlug, MIN_VERIFIED_FACTS, publishableCompetitors, type Competitor } from "./compare.lib";
import { contentPagePaths, footerSolutionLinks } from "./content-routes.lib";
import { loadAllMessages } from "@/i18n/messages";
import { filterHubItems, hubCategoryCounts } from "./hub.lib";
import { integrationHref, INTEGRATION_ITEMS } from "./integrations-hub.lib";

describe("contentPagePaths", () => {
  it("lists the public content pages once each", () => {
    const paths = contentPagePaths(false);
    expect(paths).toEqual(expect.arrayContaining(["/integrations", "/features/custom-domain", "/integrations/meta-pixel", "/tools/profit-margin-calculator", "/industries/clothing-store", "/solutions/create-online-store"]));
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("keeps compare pages out until they are switched public", () => {
    expect(contentPagePaths(false).some((path) => path.startsWith("/compare"))).toBe(false);
    const open = contentPagePaths(true);
    expect(open).toContain("/compare");
    expect(open).toContain("/compare/tallaby-vs-shopify");
  });
});

describe("compare switch", () => {
  it("is noindex while the switch is off", () => {
    expect(compareRobots()).toEqual(COMPARE_PUBLIC ? undefined : { index: false, follow: false });
  });
});

describe("competitor pages", () => {
  const thin: Competitor = { id: "x", category: "eg", latin: "X", factsCheckedOn: "2026-01-01", cells: { freePlan: "y" }, sources: [] };

  it("gives a competitor with too few verified facts no page", () => {
    expect(publishableCompetitors([thin])).toEqual([]);
    expect(findCompetitorBySlug("tallaby-vs-salla")).toBeUndefined();
    for (const competitor of publishableCompetitors()) {
      expect(Object.keys(competitor.cells).length).toBeGreaterThanOrEqual(MIN_VERIFIED_FACTS);
    }
  });

  it("shows only rows with a verified value, and no empty group", () => {
    const groups = comparisonTable(thin);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.rows.map((row) => row.id)).toEqual(["freePlan"]);
  });

  it("records a source for every competitor", () => {
    for (const competitor of COMPETITORS) expect(competitor.sources.length).toBeGreaterThan(0);
  });
});

describe("integrations hub", () => {
  it("links only to detail pages that exist", () => {
    expect(integrationHref("meta-pixel")).toBe("/integrations/meta-pixel");
    expect(integrationHref("bosta")).toBeUndefined();
  });

  it("marks what the code does not have yet as soon", () => {
    const soon = INTEGRATION_ITEMS.filter((item) => item.soon).map((item) => item.id);
    expect(soon).toEqual(expect.arrayContaining(["aramex", "jt", "mylerz", "whatsapp", "tiktok-pixel", "snap-pixel"]));
    expect(soon).not.toContain("wassalha");
  });
});

describe("hub filtering", () => {
  const items = [
    { name: "Bosta", description: "waybills", category: "ship" },
    { name: "الدفع عند الاستلام", description: "cash", category: "pay", keywords: "COD" },
  ];

  it("filters by category and by text, keywords included", () => {
    expect(filterHubItems(items, "ship", "")).toHaveLength(1);
    expect(filterHubItems(items, "all", "cod")).toHaveLength(1);
    expect(filterHubItems(items, "all", " BOSTA ")).toHaveLength(1);
    expect(filterHubItems(items, "ship", "cod")).toHaveLength(0);
  });

  it("counts per category", () => {
    expect(hubCategoryCounts(items)).toEqual({ ship: 1, pay: 1 });
  });
});

describe("footerSolutionLinks", () => {
  it("lists each kind of page, capped per kind, with its meta key", () => {
    const links = footerSolutionLinks();
    expect(links).toEqual(
      expect.arrayContaining([
        { href: "/solutions/create-online-store", metaKey: "solution-create-online-store" },
        { href: "/industries/clothing-store", metaKey: "industry-clothing-store" },
        { href: "/features/custom-domain", metaKey: "feature-custom-domain" },
        { href: "/tools/profit-margin-calculator", metaKey: "tool-profit-margin-calculator" },
      ]),
    );
    expect(footerSolutionLinks(0)).toEqual([]);
  });

  it("has a meta title for every link in both languages", async () => {
    for (const locale of ["ar", "en"]) {
      const meta = (await loadAllMessages(locale)).meta as Record<string, { title?: string }>;
      for (const link of footerSolutionLinks(Infinity)) expect(meta[link.metaKey]?.title, `${locale} ${link.metaKey}`).toBeTruthy();
    }
  });
});
