import { render } from "@react-email/components";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { SellerFirstWeekEmail, type SellerFirstWeekEmailProps } from "./SellerFirstWeekEmail.js";

const base = {
  storeName: "متجر النور",
  analyticsUrl: "https://dashboard.tallaby.com/stores/store-id/analytics",
  visits: 124,
  orders: 6,
};

const html = (props: Partial<SellerFirstWeekEmailProps> = {}) =>
  render(createElement(SellerFirstWeekEmail, { ...base, ...props }));

describe("seller first-week recap", () => {
  it("renders the Arabic recap with a link to the store's analytics", async () => {
    const out = await html();
    expect(out).toMatch(/<html[^>]*dir="rtl"/);
    expect(out).toContain("ملخص أسبوعك الأول على طلبي");
    expect(out).toContain("زيارات المتجر");
    expect(out).toContain("الطلبات المستلمة");
    expect(out).toContain(`href="${base.analyticsUrl}"`);
  });

  it("distinguishes missing visits from zero visits and supports English", async () => {
    const unavailable = await html({ visits: null, locale: "en" });
    expect(unavailable).toContain("Visit data is currently unavailable.");
    expect(unavailable).not.toContain("Store visits");
    const zero = await html({ visits: 0, orders: 0, locale: "en" });
    expect(zero).toContain("Store visits");
    expect(zero).toContain("Orders received");
    expect(zero).not.toContain("Visit data is currently unavailable.");
  });
});
