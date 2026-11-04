import { describe, expect, it } from "vitest";
import { PRICE_SYMBOL_MARK, SAUDI_RIYAL_LABEL } from "@workspace/lib";
import { formatMoney, formatMoneyMarked, moneyLabel, moneyParams, moneyUnitMarked, moneyUnitText, totalsByCurrency } from "./format";

describe("formatMoney", () => {
  it("reads the same as before with no currency, a null one and EGP", () => {
    for (const unit of [undefined, {}, { currency: null }, { currency: "EGP" }]) {
      expect(formatMoney("1250.5", "en", unit)).toBe("1,250.5 EGP");
      expect(formatMoney(300, "ar", unit)).toBe("300 EGP");
    }
    expect(formatMoney(null, "en")).toBe("0 EGP");
    expect(formatMoney("not a number", "en")).toBe("0 EGP");
  });

  it("ignores a store's EGP label, so the dashboard always says EGP", () => {
    expect(moneyLabel({ currency: "EGP", label: "جنيهاً" })).toBe("EGP");
  });

  it("writes SAR as text in plain places", () => {
    expect(formatMoney(100, "en", { currency: "SAR" })).toBe("100 SAR");
    expect(formatMoney(100, "ar", { currency: "SAR" })).toBe("100 ر.س");
  });

  it("uses a store's label for its currency, and refuses another currency's label", () => {
    expect(formatMoney(100, "en", { currency: "AED", label: "د.إ" })).toBe("100 د.إ");
    expect(formatMoney(100, "en", { currency: "AED", label: "ر.س" })).toBe("100 AED");
    expect(moneyLabel({ currency: "SAR", label: "EGP" })).toBe(SAUDI_RIYAL_LABEL);
  });

  it("shows an unknown code as it is rather than calling it EGP", () => {
    expect(formatMoney(100, "en", { currency: "JPY" })).toBe("100 JPY");
  });
});

describe("marked money", () => {
  it("marks only the Saudi symbol", () => {
    expect(formatMoneyMarked(100, "en", { currency: "SAR" })).toBe(`100 ${PRICE_SYMBOL_MARK}`);
    expect(formatMoneyMarked(100, "en", { currency: "SAR", label: "ر.س" })).toBe("100 ر.س");
    expect(formatMoneyMarked(100, "en")).toBe("100 EGP");
    expect(moneyUnitMarked("en", { currency: "SAR" })).toBe(PRICE_SYMBOL_MARK);
    expect(moneyUnitMarked("ar", {})).toBe("EGP");
  });

  it("gives text for labels", () => {
    expect(moneyUnitText("ar", { currency: "SAR" })).toBe("ر.س");
    expect(moneyParams("en", { currency: "SAR" })).toEqual({ code: "SAR", unit: "SAR" });
    expect(moneyParams("ar")).toEqual({ code: "EGP", unit: "EGP" });
  });
});

describe("totalsByCurrency", () => {
  const read = (row: { c?: string | null; a: string | number }) => ({ currency: row.c, amount: row.a });

  it("never adds different currencies, and lists EGP first", () => {
    const totals = totalsByCurrency(
      [
        { c: "SAR", a: "100.10" },
        { c: "AED", a: 5 },
        { c: "EGP", a: "250.50" },
        { c: "SAR", a: "0.20" },
        { c: null, a: "49.50" },
      ],
      read,
    );
    expect(totals).toEqual([
      { currency: "EGP", total: 300 },
      { currency: "AED", total: 5 },
      { currency: "SAR", total: 100.3 },
    ]);
  });

  it("is empty with no rows", () => {
    expect(totalsByCurrency([], read)).toEqual([]);
  });
});
