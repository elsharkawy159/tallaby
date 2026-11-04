import { describe, expect, it } from "vitest";
import { MIXED_CURRENCIES, formatMoney, moneyNumberOptions, moneyUnitText } from "@/lib/i18n/format";
import { accountMoneyOf } from "./account-money.lib";

describe("accountMoneyOf", () => {
  it("is EGP with no stores and for stores saved before currency existed", () => {
    expect(accountMoneyOf([])).toEqual({ unit: { currency: "EGP" }, mixed: false });
    expect(accountMoneyOf([null, {}]).unit.currency).toBe("EGP");
    expect(accountMoneyOf([{ currencyLabel: "ج.م" }]).mixed).toBe(false);
  });

  it("shows the one currency all stores use", () => {
    const money = accountMoneyOf([{ currency: "SAR" }, { currency: "SAR" }]);
    expect(money.mixed).toBe(false);
    expect(money.unit.currency).toBe("SAR");
  });

  it("uses no one store's symbol when stores in one currency differ", () => {
    const money = accountMoneyOf([{ currency: "SAR", currencyLabel: "ر.س" }, { currency: "SAR" }]);
    expect(money.unit).toEqual({ currency: "SAR" });
  });

  it("names no currency when stores are mixed", () => {
    const money = accountMoneyOf([{ currency: "EGP" }, { currency: "SAR" }]);
    expect(money.mixed).toBe(true);
    expect(money.unit.currency).toBe(MIXED_CURRENCIES);
    expect(formatMoney(1250, "en", money.unit)).toBe("1,250");
    expect(moneyUnitText("en", money.unit)).toBe("store currency");
    expect(moneyUnitText("ar", money.unit)).toBe("عملة المتجر");
    expect(moneyNumberOptions(money.unit)).toEqual({ maximumFractionDigits: 2 });
  });
});
