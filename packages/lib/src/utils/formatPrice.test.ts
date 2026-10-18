import { describe, expect, it } from "vitest";
import { formatCurrency, formatPrice, formatPricePlain, parseCurrencyLabel } from "./formatPrice";

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

  it("falls back to EGP for unknown labels", () => {
    expect(parseCurrencyLabel("USD")).toBe("EGP");
    expect(parseCurrencyLabel("ج.م")).toBe("ج.م");
  });
});
