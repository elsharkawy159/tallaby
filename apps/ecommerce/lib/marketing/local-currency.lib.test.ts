import { describe, expect, it } from "vitest";
import {
  FEED_CURRENCIES,
  LOCAL_CURRENCIES,
  currencyForCountry,
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

  it("shows USD only for the US, unknown countries and no country", () => {
    expect(currencyForCountry("US")).toBeNull();
    expect(currencyForCountry("BR")).toBeNull();
    expect(currencyForCountry(null)).toBeNull();
    expect(currencyForCountry("")).toBeNull();
  });

  it("lists each currency once, and reads the feed for all but EGP", () => {
    expect(new Set(LOCAL_CURRENCIES).size).toBe(LOCAL_CURRENCIES.length);
    expect(LOCAL_CURRENCIES[0]).toBe("EGP");
    expect(FEED_CURRENCIES).not.toContain("EGP");
    expect(FEED_CURRENCIES).toContain("SAR");
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
    expect(minorDigits("IQD")).toBe(0);
  });
});

describe("formatLocalApprox", () => {
  it("shows the visitor's currency as the price, with ≈, number then currency", () => {
    expect(formatLocalApprox(2000, "SAR", 3.75, "ar", "ريال")).toBe("≈ \u206675\u2069 ريال");
    expect(formatLocalApprox(3, "SAR", 3.75, "en", "SAR")).toBe("≈ 0.11 SAR");
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
