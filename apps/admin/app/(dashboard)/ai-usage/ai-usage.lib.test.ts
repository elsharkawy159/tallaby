import { describe, expect, it } from "vitest";
import { aiFeatureLabel, aiUsageRangeStart, errorRate, formatMicroUsd, formatTokens, toNumber } from "./ai-usage.lib";

describe("ai usage lib", () => {
  it("starts each range the right number of days back", () => {
    const now = new Date("2026-10-28T12:00:00Z");
    expect(aiUsageRangeStart("7d", now)?.toISOString()).toBe("2026-10-21T12:00:00.000Z");
    expect(aiUsageRangeStart("all", now)).toBeNull();
  });

  it("formats micro-USD without hiding small costs", () => {
    expect(formatMicroUsd(0)).toBe("$0.00");
    expect(formatMicroUsd(1_800)).toBe("$0.0018");
    expect(formatMicroUsd(12_345_678)).toBe("$12.35");
  });

  it("shortens large token counts", () => {
    expect(formatTokens(950)).toBe("950");
    expect(formatTokens(12_400)).toBe("12k");
    expect(formatTokens(2_350_000)).toBe("2.4M");
  });

  it("counts only errors in the error rate", () => {
    expect(errorRate(0, 0)).toBe("—");
    expect(errorRate(9, 1)).toBe("10.0%");
  });

  it("labels known features and keeps unknown keys", () => {
    expect(aiFeatureLabel("product_autofill")).toBe("Product autofill");
    expect(aiFeatureLabel("new_thing")).toBe("new_thing");
  });

  it("reads numeric strings from sums", () => {
    expect(toNumber("1200")).toBe(1200);
    expect(toNumber(null)).toBe(0);
    expect(toNumber("x")).toBe(0);
  });
});
