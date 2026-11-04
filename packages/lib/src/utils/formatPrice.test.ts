import { describe, expect, it } from "vitest";
import {
  CURRENCY_LABELS,
  PRICE_SYMBOL_MARK,
  SAUDI_RIYAL_LABEL,
  STORE_CURRENCIES,
  currencyLabelHtml,
  currencyLabelText,
  formatCurrency,
  formatPrice,
  formatPriceMarked,
  formatPricePlain,
  parseStoreCurrency,
} from "./formatPrice";

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

  describe("the Saudi Riyal symbol", () => {
    it("is SAR's default label, and no other currency's", () => {
      expect(STORE_CURRENCIES.SAR[0]).toBe(SAUDI_RIYAL_LABEL);
      expect(parseStoreCurrency({ currency: "SAR" })).toEqual({ currency: "SAR", label: SAUDI_RIYAL_LABEL });
      expect(parseStoreCurrency({ currency: "SAR", currencyLabel: "ج.م" }).label).toBe(SAUDI_RIYAL_LABEL);
      expect(parseStoreCurrency({ currency: "USD", currencyLabel: SAUDI_RIYAL_LABEL }).label).toBe("USD");
      expect(CURRENCY_LABELS).toContain(SAUDI_RIYAL_LABEL);
    });

    it("leaves a store's saved label alone", () => {
      for (const label of ["SAR", "ر.س", "ريال"]) {
        expect(parseStoreCurrency({ currency: "SAR", currencyLabel: label })).toEqual({ currency: "SAR", label });
      }
    });

    it("draws an accessible, text-sized SVG in formatPrice's HTML", () => {
      const html = formatPrice(300, "ar", "lg", SAUDI_RIYAL_LABEL);
      expect(html).toMatch(/^300 <span class="text-lg"><svg [^>]*>.*<\/svg><\/span>$/);
      expect(html).toContain('aria-label="ريال سعودي"');
      expect(html).toContain('width="1em"');
      expect(html).toContain('stroke="currentColor"');
      expect(html).toContain('d="M14 4v9.523a1 1 0 001.371.928L19 13"');
      expect(html).not.toContain(SAUDI_RIYAL_LABEL);
      expect(formatPrice(300, "en", "sm", SAUDI_RIYAL_LABEL)).toContain('aria-label="Saudi riyal"');
    });

    it("never leaks its internal value as text", () => {
      expect(formatPricePlain(300, "ar", SAUDI_RIYAL_LABEL)).toBe("300 ر.س");
      expect(formatPricePlain(300, "en", SAUDI_RIYAL_LABEL)).toBe("300 SAR");
      expect(formatCurrency(300, "ar", undefined, SAUDI_RIYAL_LABEL)).toBe("300 ر.س");
      expect(formatCurrency(300, "en-EG", undefined, SAUDI_RIYAL_LABEL)).toBe("300 SAR");
      expect(currencyLabelText(SAUDI_RIYAL_LABEL, "ar")).toBe("ر.س");
      expect(currencyLabelText("ريال", "en")).toBe("ريال");
    });

    it("marks where the symbol goes for React surfaces, and only for the symbol", () => {
      expect(formatPriceMarked(300, "ar", SAUDI_RIYAL_LABEL)).toBe(`300 ${PRICE_SYMBOL_MARK}`);
      expect(formatPriceMarked(300, "ar", "ر.س")).toBe("300 ر.س");
      expect(formatPriceMarked(300, "en")).toBe("300 EGP");
    });

    it("keeps other labels as they were", () => {
      expect(currencyLabelHtml("ر.س", "ar")).toBe("ر.س");
      expect(currencyLabelHtml(SAUDI_RIYAL_LABEL, "ar")).toContain("<svg");
      expect(formatPrice(300, "ar", "sm", "SAR")).toBe('300 <span class="text-xs">SAR</span>');
    });
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
