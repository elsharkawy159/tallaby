import { describe, expect, it } from "vitest";
import {
  COUNTRY_CURRENCY,
  FEED_CURRENCIES,
  LOCAL_CURRENCIES,
  currencyForCountry,
  currencyLabel,
  defaultCurrency,
  visitorCurrency,
  formatLocalAmount,
  formatLocalApprox,
  localPriceVars,
  formatRate,
  minorDigits,
} from "./local-currency.lib";

describe("currencyForCountry", () => {
  it("maps the countries we show a local price for", () => {
    expect(currencyForCountry("EG")).toBe("EGP");
    expect(currencyForCountry("SA")).toBe("SAR");
    expect(currencyForCountry("ae")).toBe("AED");
    expect(currencyForCountry("DE")).toBe("EUR");
    expect(currencyForCountry("BG")).toBe("EUR");
    expect(currencyForCountry("GB")).toBe("GBP");
  });

  it("maps the countries in the analytics (owner, 2026-11-10)", () => {
    expect(currencyForCountry("SE")).toBe("SEK");
    expect(currencyForCountry("IE")).toBe("EUR");
    expect(currencyForCountry("ME")).toBe("EUR");
    expect(currencyForCountry("CN")).toBe("CNY");
    expect(currencyForCountry("US")).toBe("USD");
  });

  it("maps every country, the dollar ones to USD", () => {
    for (const country of ["EC", "PA", "SV", "TL", "PR", "FM"]) expect(currencyForCountry(country)).toBe("USD");
    expect(currencyForCountry("JP")).toBe("JPY");
    expect(currencyForCountry("KR")).toBe("KRW");
    expect(currencyForCountry("BR")).toBe("BRL");
    expect(currencyForCountry("CH")).toBe("CHF");
    expect(currencyForCountry("NG")).toBe("NGN");
    // ISO 3166-1 has 249 codes; AQ (no currency) is left out and XK added.
    expect(Object.keys(COUNTRY_CURRENCY)).toHaveLength(249);
    for (const [country, currency] of Object.entries(COUNTRY_CURRENCY)) {
      expect(country).toMatch(/^[A-Z]{2}$/);
      expect(currency).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("is null for no country and codes it doesn't know", () => {
    expect(currencyForCountry("AQ")).toBeNull();
    expect(currencyForCountry("ZZ")).toBeNull();
    expect(currencyForCountry(null)).toBeNull();
    expect(currencyForCountry("")).toBeNull();
  });

  it("lists each currency once, EGP then USD, and reads the feed for the rest", () => {
    expect(new Set(LOCAL_CURRENCIES).size).toBe(LOCAL_CURRENCIES.length);
    expect(LOCAL_CURRENCIES.slice(0, 2)).toEqual(["EGP", "USD"]);
    expect(FEED_CURRENCIES).not.toContain("EGP");
    expect(FEED_CURRENCIES).not.toContain("USD");
    for (const code of ["SAR", "SEK", "EUR", "GBP", "CNY", "JPY"]) expect(FEED_CURRENCIES).toContain(code);
  });
});

describe("visitorCurrency", () => {
  const rates: Record<string, number> = { EGP: 53.9, USD: 1, SAR: 3.75, SEK: 9.81, EUR: 0.89, GBP: 0.74, CNY: 6.69 };
  const available = (code: string) => code in rates;

  it("shows the page's default until the country is known: EGP in Arabic, USD in English", () => {
    expect(defaultCurrency("ar")).toBe("EGP");
    expect(defaultCurrency("en")).toBe("USD");
    expect(visitorCurrency(null, "ar", available)).toBe("EGP");
    expect(visitorCurrency(null, "en", available)).toBe("USD");
  });

  it.each([
    ["SE", "SEK"],
    ["IE", "EUR"],
    ["DE", "EUR"],
    ["ME", "EUR"],
    ["GB", "GBP"],
    ["CN", "CNY"],
    ["SA", "SAR"],
    ["EG", "EGP"],
    ["US", "USD"],
  ])("%s shows %s on either page", (country, currency) => {
    expect(visitorCurrency(country, "ar", available)).toBe(currency);
    expect(visitorCurrency(country, "en", available)).toBe(currency);
  });

  it("falls back to USD when the feed has no rate or the country is unknown", () => {
    expect(visitorCurrency("JP", "ar", available)).toBe("USD"); // no JPY rate here
    expect(visitorCurrency("IR", "en", available)).toBe("USD");
    expect(visitorCurrency("AQ", "ar", available)).toBe("USD");
  });
});

describe("currencyLabel", () => {
  it("keeps the Arabic word where there is one and the ISO code otherwise", () => {
    const ar = { EGP: "جنيه", SAR: "ريال", USD: "دولار" };
    expect(currencyLabel("SAR", ar)).toBe("ريال");
    expect(currencyLabel("SEK", ar)).toBe("SEK");
    expect(currencyLabel("CNY", {})).toBe("CNY");
  });
});

describe("formatLocalAmount", () => {
  it("uses the wallet's rounding for EGP", () => {
    expect(formatLocalAmount(3, "EGP", 53.9007)).toBe("1.62");
    expect(formatLocalAmount(2900, "EGP", 53.9007)).toBe("1,563");
  });

  it("keeps the nearest minor unit under 1, never 0", () => {
    expect(formatLocalAmount(3, "SAR", 3.75)).toBe("0.11");
    expect(formatLocalAmount(3, "EUR", 0.92)).toBe("0.03");
    expect(formatLocalAmount(3, "KWD", 0.307)).toBe("0.009");
    expect(formatLocalAmount(3, "BHD", 0.376)).toBe("0.011");
    expect(formatLocalAmount(1, "KWD", 0.01)).toBe("0.001");
  });

  it("shows whole units from 100 and the minor unit in between", () => {
    expect(formatLocalAmount(2900, "SAR", 3.75)).toBe("109");
    expect(formatLocalAmount(2900, "EUR", 0.92)).toBe("26.68");
    expect(formatLocalAmount(2900, "KWD", 0.307)).toBe("8.903");
    expect(formatLocalAmount(3, "IQD", 1310)).toBe("39");
    expect(formatLocalAmount(2900, "IQD", 1310)).toBe("37,990");
  });

  it("knows each currency's minor unit", () => {
    expect(minorDigits("SAR")).toBe(2);
    expect(minorDigits("JOD")).toBe(3);
    expect(minorDigits("KWD")).toBe(3);
    expect(minorDigits("IQD")).toBe(0);
    expect(minorDigits("JPY")).toBe(0);
    expect(minorDigits("KRW")).toBe(0);
    expect(minorDigits("SEK")).toBe(2);
    expect(minorDigits("not a code")).toBe(2);
  });

  it("uses the minor unit for the new currencies", () => {
    expect(formatLocalAmount(3, "SEK", 9.81)).toBe("0.29");
    expect(formatLocalAmount(2900, "SEK", 9.81)).toBe("284");
    expect(formatLocalAmount(3, "JPY", 158)).toBe("5");
    expect(formatLocalAmount(3, "KRW", 1344.8)).toBe("40");
    expect(formatLocalAmount(3, "CNY", 6.69)).toBe("0.2");
    expect(formatLocalAmount(3, "USD", 1)).toBe("0.03");
    expect(formatLocalAmount(2900, "USD", 1)).toBe("29");
  });
});

describe("formatLocalApprox", () => {
  it("shows the visitor's currency as the price, with ≈, number then currency", () => {
    expect(formatLocalApprox(2000, "SAR", 3.75, "ar", "ريال")).toBe("≈ \u206675\u2069 ريال");
    expect(formatLocalApprox(3, "SAR", 3.75, "en", "SAR")).toBe("≈ 0.11 SAR");
  });

  it("shows USD, the billing currency, without ≈ and never with a dollar sign", () => {
    expect(formatLocalApprox(3, "USD", 1, "en", "USD")).toBe("0.03 USD");
    expect(formatLocalApprox(2900, "USD", 1, "ar", "دولار")).toBe("⁦29⁩ دولار");
    expect(formatLocalApprox(3, "SEK", 9.81, "ar", "SEK")).toBe("≈ ⁦0.29⁩ SEK");
  });

  it("uses the billing module's EGP format for Egypt, never a dollar sign", () => {
    expect(formatLocalApprox(3, "EGP", 53.9007, "en", "EGP")).toBe("≈ 1.62 EGP");
    expect(formatLocalApprox(2900, "EGP", 53.9007, "ar", "جنيه")).toBe("≈ \u20661,563\u2069 جنيه");
    expect(formatLocalApprox(2900, "EGP", 53.9007, "en", "EGP")).not.toContain("$");
  });
});

describe("localPriceVars", () => {
  it("fills every token in one currency", () => {
    const vars = localPriceVars("SAR", 3.75, "en", "SAR");
    expect(vars.orderFee).toBe("≈ 0.11 SAR");
    expect(vars.pro).toBe("≈ 109 SAR");
    expect(vars.topUpMin).toBe("≈ 18.75 SAR");
  });
});

describe("formatRate", () => {
  it("keeps 4 decimals under 10 and 2 above", () => {
    expect(formatRate(53.9007)).toBe("53.9");
    expect(formatRate(3.75)).toBe("3.75");
    expect(formatRate(0.30712)).toBe("0.3071");
    expect(formatRate(1310)).toBe("1,310");
  });
});
