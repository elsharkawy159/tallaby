import { describe, expect, it } from "vitest";
import { billingSettingsSchema, isRateStale, percentToBps, rateAgeHours } from "./billing-admin.lib";

describe("billingSettingsSchema", () => {
  it("accepts a margin, a plausible rate or none, and the tax switch", () => {
    for (const input of [
      { marginPercent: 2, rateOverride: null, taxEnabled: false },
      { marginPercent: 0, rateOverride: 50.25, taxEnabled: true },
      { marginPercent: 20, rateOverride: null, taxEnabled: false },
    ]) {
      expect(billingSettingsSchema.safeParse(input).success).toBe(true);
    }
  });

  it("refuses a margin the database would refuse, an implausible rate and extra fields", () => {
    for (const input of [
      { marginPercent: -1, rateOverride: null, taxEnabled: false },
      { marginPercent: 20.5, rateOverride: null, taxEnabled: false },
      { marginPercent: 2, rateOverride: 5, taxEnabled: false },
      { marginPercent: 2, rateOverride: 501, taxEnabled: false },
      { marginPercent: 2, rateOverride: Number.NaN, taxEnabled: false },
      { marginPercent: 2, rateOverride: null, taxEnabled: false, usdLive: true },
    ]) {
      expect(billingSettingsSchema.safeParse(input).success).toBe(false);
    }
  });
});

describe("billing page checks", () => {
  const now = new Date("2026-11-03T12:00:00Z");

  it("turns a percent into whole basis points", () => {
    expect(percentToBps(2)).toBe(200);
    expect(percentToBps(2.55)).toBe(255);
    expect(percentToBps(0.07)).toBe(7);
  });

  it("warns about a rate from 48 hours ago or older, or no rate at all", () => {
    expect(rateAgeHours("2026-11-03T09:30:00Z", now)).toBe(2);
    expect(isRateStale("2026-11-01T12:00:01Z", now)).toBe(false);
    expect(isRateStale("2026-11-01T12:00:00Z", now)).toBe(true);
    expect(rateAgeHours(null, now)).toBeNull();
    expect(isRateStale(null, now)).toBe(true);
  });
});
