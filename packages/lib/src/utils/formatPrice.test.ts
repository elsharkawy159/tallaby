import { describe, expect, it } from "vitest";
import { formatCurrency, formatPrice, formatPricePlain, parseStoreCurrency } from "./formatPrice";

describe("price formatting", () => {
  it("labels amounts EGP by default, in both languages, with Western digits", () => {
    expect(formatPricePlain(1250, "en")).toBe("1,250 EGP");
    expect(formatPricePlain(1250, "ar")).toBe("1,250 EGP");
    expect(formatCurrency(99.5, "ar")).toBe("99.5 EGP");
  });

  it("uses a store's chosen label", () => {
    expect(formatPricePlain(300, "ar", "جنيهاً")).toBe("300 جنيهاً");
    expect(formatPrice(300, "ar", "sm", "ج.م")).toBe('300 <span class="text-xs">ج.م</span>');
  });

  it("reads a store's currency and label from its settings", () => {
    expect(parseStoreCurrency({ currency: "SAR", currencyLabel: "ر.س" })).toEqual({ currency: "SAR", label: "ر.س" });
    expect(formatPricePlain(300, "ar", "ر.س")).toBe("300 ر.س");
  });

  it("reads stores saved before currencies as EGP with their label", () => {
    expect(parseStoreCurrency({ currencyLabel: "ج.م" })).toEqual({ currency: "EGP", label: "ج.م" });
    expect(parseStoreCurrency(null)).toEqual({ currency: "EGP", label: "EGP" });
  });

  it("falls back to the currency's code for a label from another currency or an unknown value", () => {
    expect(parseStoreCurrency({ currency: "USD", currencyLabel: "ج.م" })).toEqual({ currency: "USD", label: "USD" });
    expect(parseStoreCurrency({ currency: "XYZ", currencyLabel: "<b>" })).toEqual({ currency: "EGP", label: "EGP" });
    expect(parseStoreCurrency({ currency: "toString" })).toEqual({ currency: "EGP", label: "EGP" });
  });
});
