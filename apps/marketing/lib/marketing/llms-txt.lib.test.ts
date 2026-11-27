import { describe, expect, it } from "vitest";
import { loadAllMessages } from "@/i18n/messages";
import enBase from "@/messages/en.json";
import { FREE_ORDER_FEE_USD_CENTS, PRO_MONTHLY_USD_CENTS, TOP_UP_MIN_USD_CENTS } from "@workspace/lib/billing";
import { ORDER_GRACE_DAYS_SHORT } from "@workspace/lib/billing/order-grace";
import { COMPETITORS, compareSlug, publicCompetitors } from "./compare.lib";
import { buildLlmsTxt, llmsTxtSections } from "./llms-txt.lib";
import { formatUsd } from "./pricing.lib";
import { SITE_URL } from "./site.lib";

describe("llms.txt", () => {
  it("names a real English title for every linked page", async () => {
    const meta = { ...enBase.meta, ...((await loadAllMessages("en")).meta as Record<string, unknown>) } as Record<string, { title?: string }>;
    for (const section of llmsTxtSections(true)) {
      for (const link of section.links) expect(meta[link.metaKey]?.title, link.metaKey).toBeTruthy();
    }
  });

  it("states the plan prices from the billing module and links absolute English URLs", () => {
    const text = buildLlmsTxt((key) => `Title ${key}`);
    expect(text.startsWith("# Tallaby (طلبي)\n\n> ")).toBe(true);
    expect(text).toContain(`${formatUsd(FREE_ORDER_FEE_USD_CENTS)} per delivered order`);
    expect(text).toContain(`${formatUsd(PRO_MONTHLY_USD_CENTS)} a month`);
    expect(text).toContain(`(${SITE_URL}/en/pricing)`);
    expect(text).toContain(`(${SITE_URL}/en/faq)`);
    expect(text).toContain(`(${SITE_URL}/en/blog)`);
    expect(text).toContain("does not deliver");
    for (const link of text.matchAll(/\]\(([^)]+)\)/g)) expect(link[1]!.startsWith(SITE_URL), link[1]).toBe(true);
  });

  it("states the brand, the top-up window from code and only live integrations", () => {
    const text = buildLlmsTxt((key) => key);
    expect(text).toContain("Arabic brand name is طلبي");
    expect(text).toContain("based in Cairo");
    expect(text).toContain(`within ${ORDER_GRACE_DAYS_SHORT} days (from ${formatUsd(TOP_UP_MIN_USD_CENTS)}`);
    expect(text).toContain("TikTok Pixel, Snapchat Pixel");
    for (const never of ["Aramex", "J&T", "Mylerz", "PayPal", "SMS", "digital product", "coming soon", "Soon"]) expect(text, never).not.toContain(never);
  });

  it("names Tallaby Pay and its fee only while it is live", () => {
    const live = buildLlmsTxt((key) => key, llmsTxtSections(false), { live: true, feePercent: "3" });
    expect(live).toContain("Tallaby Pay's fee is 3%");
    expect(live).toContain("Tallaby takes no cut of these sales.");
    for (const pay of [null, { live: false, feePercent: "3" }]) {
      const text = buildLlmsTxt((key) => key, llmsTxtSections(false), pay);
      expect(text).not.toContain("Tallaby Pay");
      expect(text).toContain("Tallaby takes no cut of sales.");
    }
  });

  it("links only public comparisons, and none while the switch is off", () => {
    const hidden = COMPETITORS.filter((competitor) => !publicCompetitors(true).includes(competitor));
    const text = buildLlmsTxt((key) => key, llmsTxtSections(true));
    for (const competitor of hidden) expect(text, competitor.id).not.toContain(compareSlug(competitor));
    for (const competitor of publicCompetitors(true)) expect(text).toContain(`/en/compare/${compareSlug(competitor)}`);
    expect(llmsTxtSections(false).some((section) => section.heading === "Comparisons")).toBe(false);
  });
});
