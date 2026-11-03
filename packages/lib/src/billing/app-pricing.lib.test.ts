import { describe, expect, it } from "vitest";
import {
  APP_USAGE_UNITS,
  appChargeAmount,
  appChargeReference,
  isPaidAppPricing,
  isValidAppPricing,
  isValidAppUsageEvent,
  MAX_APP_USAGE_QUANTITY,
  type AppPricing,
} from "./app-pricing.lib";

describe("app pricing", () => {
  it("treats only free as unpaid", () => {
    expect(isPaidAppPricing({ model: "free" })).toBe(false);
    expect(isPaidAppPricing({ model: "one_time", usdCents: 100 })).toBe(true);
    expect(isPaidAppPricing({ model: "usage", usdCents: 1, unit: "action" })).toBe(true);
  });

  it("wants paid prices in whole, positive cents", () => {
    expect(isValidAppPricing({ model: "free" })).toBe(true);
    expect(isValidAppPricing({ model: "monthly", usdCents: 500 })).toBe(true);
    expect(isValidAppPricing({ model: "monthly", usdCents: 0 })).toBe(false);
    expect(isValidAppPricing({ model: "monthly", usdCents: -5 })).toBe(false);
    expect(isValidAppPricing({ model: "per_order", usdCents: 1.5 })).toBe(false);
  });

  it("wants a known unit for usage", () => {
    for (const unit of APP_USAGE_UNITS) expect(isValidAppPricing({ model: "usage", usdCents: 2, unit })).toBe(true);
    expect(isValidAppPricing({ model: "usage", usdCents: 2, unit: "week" } as unknown as AppPricing)).toBe(false);
  });

  it("makes a signed 2-decimal debit, also below a dollar and across a quantity", () => {
    expect(appChargeAmount(2900)).toBe("-29.00");
    expect(appChargeAmount(3)).toBe("-0.03");
    expect(appChargeAmount(7, 3)).toBe("-0.21");
  });

  it("claims per store and app, per period, per order and per event", () => {
    const start = new Date("2026-11-03T10:00:00.000Z");
    expect(appChargeReference("s1", "a", { model: "one_time" })).toBe("s1:a");
    expect(appChargeReference("s1", "a", { model: "monthly", periodStart: start })).toBe("s1:a:2026-11-03T10:00:00.000Z");
    expect(appChargeReference("s1", "a", { model: "per_order", orderId: "o1" })).toBe("s1:a:order:o1");
    expect(appChargeReference("s1", "a", { model: "usage", eventId: "e1" })).toBe("s1:a:usage:e1");
    expect(appChargeReference("s2", "a", { model: "one_time" })).not.toBe(appChargeReference("s1", "a", { model: "one_time" }));
  });

  it("checks usage events", () => {
    expect(isValidAppUsageEvent("job-1:part.2", 1)).toBe(true);
    expect(isValidAppUsageEvent("job-1", MAX_APP_USAGE_QUANTITY)).toBe(true);
    expect(isValidAppUsageEvent("", 1)).toBe(false);
    expect(isValidAppUsageEvent("has space", 1)).toBe(false);
    expect(isValidAppUsageEvent("job-1", 0)).toBe(false);
    expect(isValidAppUsageEvent("job-1", 1.5)).toBe(false);
    expect(isValidAppUsageEvent("job-1", MAX_APP_USAGE_QUANTITY + 1)).toBe(false);
  });
});
