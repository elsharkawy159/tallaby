import { describe, expect, it } from "vitest";
import { parseUsdTopUp } from "@workspace/lib/billing";
import { DEFAULT_TOP_UP_USD, FEE_PER_ORDER_EGP, POPULAR_TOP_UP_USD, TOP_UP_PRESETS_USD, orderCountValues, ordersCovered, stepTopUpAmount, walletMoney, walletPoundLabel } from "./store-wallet.lib";

describe("walletMoney", () => {
  it("calls the pound جنيه in Arabic only", () => {
    expect(walletMoney(277, "EGP", "ar")).toBe("277 جنيه");
    expect(walletMoney(52000, null, "ar")).toBe("52,000 جنيه");
    expect(walletMoney(277, "EGP", "en")).toBe("277 EGP");
    expect(walletPoundLabel("ar")).toBe("جنيه");
    expect(walletPoundLabel("en")).toBe("EGP");
  });

  it("leaves dollars alone", () => {
    expect(walletMoney(5, "USD", "ar")).toBe("$5.00");
    expect(walletMoney(-5, "USD", "en")).toBe("-$5.00");
  });

  it("drops the left-to-right mark from a negative Arabic amount", () => {
    expect(walletMoney(-500, "EGP", "ar")).toBe("-500 جنيه");
  });
});

describe("orderCountValues", () => {
  it("groups thousands in both languages and keeps the number for the plural", () => {
    expect(orderCountValues(16666, "ar")).toEqual({ count: 16666, formatted: "16,666" });
    expect(orderCountValues(16666, "en")).toEqual({ count: 16666, formatted: "16,666" });
  });
});

describe("ordersCovered", () => {
  it("divides by the flat fee and rounds down", () => {
    expect(FEE_PER_ORDER_EGP).toBe(5);
    expect(ordersCovered(538.2)).toBe(107);
    expect(ordersCovered(250)).toBe(50);
  });

  it("covers nothing at zero or below", () => {
    expect(ordersCovered(0)).toBe(0);
    expect(ordersCovered(-40)).toBe(0);
  });
});

describe("USD presets", () => {
  it("are all valid top-ups, and the default and popular cards are among them", () => {
    expect(TOP_UP_PRESETS_USD).toEqual([5, 10, 20, 50, 100, 200, 500, 1000]);
    for (const preset of TOP_UP_PRESETS_USD) {
      expect(parseUsdTopUp(String(preset))).toEqual({ success: true, usdCents: preset * 100 });
    }
    expect(TOP_UP_PRESETS_USD).toContain(DEFAULT_TOP_UP_USD);
    expect(TOP_UP_PRESETS_USD).toContain(POPULAR_TOP_UP_USD);
    expect(DEFAULT_TOP_UP_USD).toBe(5);
  });
});

describe("stepTopUpAmount", () => {
  it("moves by the step within the limits", () => {
    expect(stepTopUpAmount(250, 50)).toBe(300);
    expect(stepTopUpAmount(100, -50)).toBe(100);
    expect(stepTopUpAmount(19_980, 50)).toBe(20_000);
    expect(stepTopUpAmount(0, 50)).toBe(100);
  });
});
