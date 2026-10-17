import { describe, expect, it } from "vitest";
import { canCreateStore, getPlanLimits, hasFeature, resolvePlanId } from "./index";

describe("getPlanLimits", () => {
  it("gives the Free plan a limit of 3 stores", () => {
    expect(getPlanLimits("free").maxStores).toBe(3);
  });

  it("falls back to Free for an unknown plan", () => {
    expect(getPlanLimits("enterprise-gold")).toEqual(getPlanLimits("free"));
  });

  it("falls back to Free for a missing plan", () => {
    expect(getPlanLimits(null)).toEqual(getPlanLimits("free"));
    expect(getPlanLimits(undefined)).toEqual(getPlanLimits("free"));
  });
});

describe("resolvePlanId", () => {
  it("keeps a known plan and maps anything else to free", () => {
    expect(resolvePlanId("free")).toBe("free");
    expect(resolvePlanId("FREE ")).toBe("free");
    expect(resolvePlanId("pro")).toBe("free");
  });
});

describe("canCreateStore", () => {
  it("allows a third store when the seller has two", () => {
    expect(canCreateStore("free", 2)).toBe(true);
  });

  it("refuses a fourth store when the seller has three", () => {
    expect(canCreateStore("free", 3)).toBe(false);
  });

  it("refuses when the count is already above the limit", () => {
    expect(canCreateStore("free", 7)).toBe(false);
  });

  it("uses an admin override when one is set (D27)", () => {
    expect(canCreateStore("free", 3, { maxStoresOverride: 5 })).toBe(true);
    expect(canCreateStore("free", 5, { maxStoresOverride: 5 })).toBe(false);
  });

  it("ignores an invalid override", () => {
    expect(canCreateStore("free", 3, { maxStoresOverride: -1 })).toBe(false);
    expect(canCreateStore("free", 3, { maxStoresOverride: Number.NaN })).toBe(false);
  });
});

describe("hasFeature", () => {
  it("keeps AI and advanced settings off on Free", () => {
    expect(hasFeature("free", "ai")).toBe(false);
    expect(hasFeature("free", "advancedSettings")).toBe(false);
  });

  it("keeps custom domains on for Free (today's behaviour)", () => {
    expect(hasFeature("free", "customDomain")).toBe(true);
  });

  it("uses Free features for an unknown plan", () => {
    expect(hasFeature("unknown", "customDomain")).toBe(true);
    expect(hasFeature("unknown", "ai")).toBe(false);
  });
});
