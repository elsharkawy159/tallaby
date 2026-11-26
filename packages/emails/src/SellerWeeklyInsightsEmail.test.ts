import { render } from "@react-email/components";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import {
  formatInsightsMoney,
  SellerWeeklyInsightsEmail,
  sellerWeeklyInsightsSubject,
  type SellerWeeklyInsightsEmailProps,
  type WeeklyInsightsStore,
} from "./SellerWeeklyInsightsEmail.js";

const store: WeeklyInsightsStore = {
  name: "متجر النور",
  analyticsUrl: "https://dashboard.tallaby.com/stores/store-id/analytics",
  currency: "EGP",
  visits: { current: 412, previous: 365 },
  orders: { current: 18, previous: 11 },
  sales: { current: 125_050, previous: 83_000 },
  topProducts: [{ name: "عباية كتان", units: 7 }],
};

const base: SellerWeeklyInsightsEmailProps = {
  weekStart: "2026-11-15",
  weekLastDay: "2026-11-21",
  firstWeek: false,
  stores: [store],
  optOutUrl: "https://dashboard.tallaby.com/api/email/weekly-insights/unsubscribe?token=t",
};

const html = (props: Partial<SellerWeeklyInsightsEmailProps> = {}) =>
  render(createElement(SellerWeeklyInsightsEmail, { ...base, ...props }));

describe("seller weekly insights email", () => {
  it("renders each store with last week's numbers, best sellers, analytics and opt-out links", async () => {
    const out = await html();
    expect(out).toMatch(/<html[^>]*dir="rtl"/);
    expect(sellerWeeklyInsightsSubject()).toBe("ملخص متجرك الأسبوعي على طلبي");
    expect(out).toContain("الزيارات");
    expect(out).toContain("الأسبوع السابق");
    expect(out).toContain("عباية كتان");
    expect(out).toContain("جنيه");
    expect(out).toContain(`href="${store.analyticsUrl}"`);
    expect(out).toContain(`href="${base.optOutUrl}"`);
    expect(out).toContain("إيقاف الملخص الأسبوعي");
  });

  it("shows missing visits as not available (not 0) and no comparison in week 1", async () => {
    const out = await html({
      locale: "en",
      firstWeek: true,
      stores: [{ ...store, visits: null, orders: { current: 0, previous: null }, sales: { current: 0, previous: null }, topProducts: [] }],
    });
    expect(out).toContain("Not available");
    expect(out).toContain("Visit data is not available right now.");
    expect(out).toContain("first week");
    expect(out).toContain("No sales this week.");
    expect(out).not.toContain("Last week:");
  });

  it("formats piastres in the store's currency", () => {
    expect(formatInsightsMoney(125_050, "EGP", "en")).toBe("EGP 1,250.5");
    expect(formatInsightsMoney(125_000, "EGP", "ar")).toMatch(/جنيه$/);
    expect(formatInsightsMoney(4_500, "USD", "en")).toContain("45");
  });
});
