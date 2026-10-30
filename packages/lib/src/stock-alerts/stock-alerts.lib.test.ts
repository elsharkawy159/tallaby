import { describe, expect, it } from "vitest";
import {
  alertLocale,
  alertTargetInStock,
  isUnsubscribeToken,
  isUuid,
  normalizeAlertEmail,
  stockAlertUnsubscribeUrl,
} from "./stock-alerts.lib";

describe("normalizeAlertEmail", () => {
  it("trims and lower-cases a valid address", () => {
    expect(normalizeAlertEmail("  Sara.Ali@Example.COM ")).toBe("sara.ali@example.com");
  });

  it("rejects what is not an email", () => {
    for (const value of ["", "sara", "sara@", "@example.com", "sara@example", "a b@example.com", "<x>@ex.com", 42, null]) {
      expect(normalizeAlertEmail(value)).toBeNull();
    }
  });

  it("rejects addresses over 254 characters", () => {
    expect(normalizeAlertEmail(`${"a".repeat(250)}@ex.com`)).toBeNull();
  });
});

describe("alertLocale", () => {
  it("is English only when asked, else Arabic", () => {
    expect(alertLocale("en")).toBe("en");
    expect(alertLocale("ar")).toBe("ar");
    expect(alertLocale("fr")).toBe("ar");
    expect(alertLocale(undefined)).toBe("ar");
  });
});

describe("tokens and ids", () => {
  it("accepts only hex tokens of 32–128 chars", () => {
    expect(isUnsubscribeToken("a".repeat(48))).toBe(true);
    expect(isUnsubscribeToken("a".repeat(31))).toBe(false);
    expect(isUnsubscribeToken("Z".repeat(48))).toBe(false);
    expect(isUnsubscribeToken("a".repeat(48) + "'")).toBe(false);
  });

  it("checks uuids", () => {
    expect(isUuid("3f1c2b9e-1d2a-4c5b-8e7f-0a1b2c3d4e5f")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });

  it("builds the unsubscribe link on the store origin", () => {
    expect(stockAlertUnsubscribeUrl("https://shop.tallaby.com/", "ab".repeat(16))).toBe(
      `https://shop.tallaby.com/api/stock-alerts/unsubscribe?token=${"ab".repeat(16)}`,
    );
  });
});

describe("alertTargetInStock", () => {
  it("uses the variant's stock when a variant was chosen (untracked = 0)", () => {
    expect(alertTargetInStock({ variantId: "v", variantStock: 2, productQuantity: 0, variantStocks: [] })).toBe(true);
    expect(alertTargetInStock({ variantId: "v", variantStock: 0, productQuantity: 9, variantStocks: [5] })).toBe(false);
    expect(alertTargetInStock({ variantId: "v", variantStock: null, productQuantity: 9, variantStocks: [] })).toBe(false);
  });

  it("uses the product count, else any variant's stock", () => {
    expect(alertTargetInStock({ variantId: null, variantStock: null, productQuantity: "3", variantStocks: [] })).toBe(true);
    expect(alertTargetInStock({ variantId: null, variantStock: null, productQuantity: 0, variantStocks: [0, 1] })).toBe(true);
    expect(alertTargetInStock({ variantId: null, variantStock: null, productQuantity: 0, variantStocks: [0, null] })).toBe(false);
  });
});
