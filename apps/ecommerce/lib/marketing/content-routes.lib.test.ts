import { describe, expect, it } from "vitest";
import { publicCompetitors } from "./compare.lib";
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
    expect(open).toContain("/alternatives/shopify");
    // Only released competitors: a built comparison with publish off stays out.
    for (const competitor of publicCompetitors(true)) expect(open).toContain(`/compare/tallaby-vs-${competitor.id}`);
    expect(open.filter((path) => path.startsWith("/compare/"))).toHaveLength(publicCompetitors(true).length);
  });
});

// The compare data, gating and tables are tested in compare.lib.test.ts.

describe("integrations hub", () => {
  it("links only to detail pages that exist", () => {
    expect(integrationHref("meta-pixel")).toBe("/integrations/meta-pixel");
    expect(integrationHref("bosta")).toBe("/integrations/bosta");
    expect(integrationHref("aramex")).toBeUndefined();
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
        { href: "/solutions/free-online-store", metaKey: "solution-free-online-store" },
        { href: "/solutions/create-online-store", metaKey: "solution-create-online-store" },
        { href: "/industries/clothing-store", metaKey: "industry-clothing-store" },
        { href: "/features/ai-online-store", metaKey: "feature-ai-online-store" },
        { href: "/features/fake-order-protection", metaKey: "feature-fake-order-protection" },
        { href: "/tools/store-cost-calculator", metaKey: "tool-store-cost-calculator" },
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
