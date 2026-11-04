import { describe, expect, it } from "vitest";
import { billingSettingsSchema, isRateStale, rateAgeHours } from "./billing-admin.lib";

describe("billingSettingsSchema", () => {
  it("accepts a plausible rate or none, and the tax switch", () => {
    for (const input of [
      { rateOverride: null, taxEnabled: false },
      { rateOverride: 50.25, taxEnabled: true },
    ]) {
      expect(billingSettingsSchema.safeParse(input).success).toBe(true);
    }
  });

  it("refuses an implausible rate and extra fields, a margin included", () => {
    for (const input of [
      { rateOverride: 5, taxEnabled: false },
      { rateOverride: 501, taxEnabled: false },
      { rateOverride: Number.NaN, taxEnabled: false },
      { rateOverride: null, taxEnabled: false, usdLive: true },
      { marginPercent: 2, rateOverride: null, taxEnabled: false },
    ]) {
      expect(billingSettingsSchema.safeParse(input).success).toBe(false);
    }
  });
});

describe("billing page checks", () => {
  const now = new Date("2026-11-03T12:00:00Z");

  it("warns about a rate from 12 hours ago or older, or no rate at all", () => {
    expect(rateAgeHours("2026-11-03T09:30:00Z", now)).toBe(2);
    expect(isRateStale("2026-11-03T00:00:01Z", now)).toBe(false);
    expect(isRateStale("2026-11-03T00:00:00Z", now)).toBe(true);
    expect(rateAgeHours(null, now)).toBeNull();
    expect(isRateStale(null, now)).toBe(true);
  });
});
