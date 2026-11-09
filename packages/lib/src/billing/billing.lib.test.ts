import { describe, expect, it } from "vitest";
import {
  egpRateFromResponse,
  exchangeRateSource,
  formatEgpApprox,
  usdCentsToApproxEgp,
  addOneMonth,
  cairoMonthKey,
  isPlausibleRate,
  isProActive,
  minorToAmount,
  parseUsdTopUp,
  piastresToUsdCents,
  quoteTopUp,
  usdCentsToPiastres,
  usdRatesFromResponse,
} from "./billing.lib";

const state = { marketRate: 50, taxEnabled: false, taxRateBps: 1400 };

describe("rates", () => {
  it("converts without floats drifting", () => {
    expect(usdCentsToPiastres(500, 51)).toBe(25_500);
    expect(usdCentsToPiastres(3, 50)).toBe(150);
    expect(usdCentsToPiastres(1, 50.0001)).toBe(51);
    expect(piastresToUsdCents(50_000, 50)).toBe(1000);
    expect(piastresToUsdCents(500, 50)).toBe(10);
  });

  it("rejects implausible rates", () => {
    expect(isPlausibleRate(50)).toBe(true);
    expect(isPlausibleRate(0.02)).toBe(false);
    expect(isPlausibleRate(Number.NaN)).toBe(false);
  });
});

describe("EGP display of USD prices", () => {
  it("matches the top-up quote for whole dollars and keeps piastres under a dollar", () => {
    for (const cents of [100, 500, 2900, 4321, 100_000]) {
      expect(usdCentsToApproxEgp(cents, 53.9007)).toBe(quoteTopUp(cents, { ...state, marketRate: 53.9007 })!.basePiastres / 100);
    }
    expect(usdCentsToApproxEgp(2900, 53.9007)).toBe(1563);
    expect(usdCentsToApproxEgp(3, 53.9007)).toBe(1.62);
    expect(usdCentsToApproxEgp(3, 54.2)).toBe(1.63);
    expect(usdCentsToApproxEgp(-500, 50)).toBe(-250);
    expect(usdCentsToApproxEgp(0, 50)).toBe(0);
  });

  it("formats with ≈, Latin digits and en-US grouping", () => {
    expect(formatEgpApprox(3, 54.2, "en")).toBe("≈ 1.63 EGP");
    expect(formatEgpApprox(2900, 54.2, "en")).toBe("≈ 1,571 EGP");
    expect(formatEgpApprox(50, 50, "en")).toBe("≈ 25.00 EGP");
    expect(formatEgpApprox(-500, 50, "en")).toBe("≈ -250 EGP");
    expect(formatEgpApprox(0, 50, "en")).toBe("0 EGP");
  });

  it("isolates only the number in Arabic, so ≈ stays to its right", () => {
    expect(formatEgpApprox(3, 54.2, "ar")).toBe("≈ \u20661.63\u2069 جنيه");
    expect(formatEgpApprox(100_000, 50, "ar")).toBe("≈ \u206650,000\u2069 جنيه");
    expect(formatEgpApprox(-3, 50, "ar")).toBe("≈ \u2066-1.50\u2069 جنيه");
    expect(formatEgpApprox(0, 50, "ar")).toBe("\u20660\u2069 جنيه");
  });
});

describe("top-up quote", () => {
  it("prices $5 at the market rate, with no margin and no tax while tax is off", () => {
    expect(quoteTopUp(500, state)).toEqual({
      usdCents: 500,
      rate: 50,
      basePiastres: 25_000,
      taxPiastres: 0,
      totalPiastres: 25_000,
    });
  });

  it("rounds the EGP down to a whole pound, never up", () => {
    // $30 at 49.0523 is 1471.57 EGP.
    expect(quoteTopUp(3000, { ...state, marketRate: 49.0523 })!.totalPiastres).toBe(147_100);
  });

  it("adds 14% once when tax is on, in whole pounds", () => {
    const quote = quoteTopUp(500, { ...state, taxEnabled: true })!;
    expect(quote.taxPiastres).toBe(3500);
    expect(quote.totalPiastres).toBe(28_500);
  });

  it("can't quote before there is a rate", () => {
    expect(quoteTopUp(500, { ...state, marketRate: null })).toBeNull();
  });
});

describe("parseUsdTopUp", () => {
  it("accepts $5 to $1,000", () => {
    expect(parseUsdTopUp("5")).toEqual({ success: true, usdCents: 500 });
    expect(parseUsdTopUp(1000)).toEqual({ success: true, usdCents: 100_000 });
    expect(parseUsdTopUp("12,50")).toEqual({ success: true, usdCents: 1250 });
  });

  it("refuses anything else", () => {
    expect(parseUsdTopUp("4.99")).toEqual({ success: false, error: "too_small" });
    expect(parseUsdTopUp("1000.01")).toEqual({ success: false, error: "too_large" });
    expect(parseUsdTopUp("abc")).toEqual({ success: false, error: "invalid" });
    expect(parseUsdTopUp("-5")).toEqual({ success: false, error: "invalid" });
    expect(parseUsdTopUp(null)).toEqual({ success: false, error: "invalid" });
  });
});

describe("plan dates", () => {
  const now = new Date("2026-11-10T00:00:00Z");

  it("is Pro only on the pro plan and inside the paid period", () => {
    expect(isProActive({ plan: "free" }, now)).toBe(false);
    expect(isProActive({ plan: "pro", planExpiresAt: "2026-12-01T00:00:00Z" }, now)).toBe(true);
    expect(isProActive({ plan: "pro", planExpiresAt: "2026-11-01T00:00:00Z" }, now)).toBe(false);
  });

  it("keeps Pro during grace", () => {
    expect(
      isProActive({ plan: "pro", planExpiresAt: "2026-11-09T00:00:00Z", planGraceUntil: "2026-11-12T00:00:00Z" }, now),
    ).toBe(true);
  });

  it("treats no end date as an open-ended grant", () => {
    expect(isProActive({ plan: "pro" }, now)).toBe(true);
  });

  it("adds a month without spilling over", () => {
    expect(addOneMonth(new Date("2026-01-31T10:00:00Z")).toISOString()).toBe("2026-02-28T10:00:00.000Z");
    expect(addOneMonth(new Date("2026-11-03T10:00:00Z")).toISOString()).toBe("2026-12-03T10:00:00.000Z");
  });
});

describe("helpers", () => {
  it("formats ledger amounts", () => {
    expect(minorToAmount(3)).toBe("0.03");
    expect(minorToAmount(2900)).toBe("29.00");
  });

  it("uses the Cairo month", () => {
    expect(cairoMonthKey(new Date("2026-10-31T22:30:00Z"))).toBe("2026-11");
    expect(cairoMonthKey(new Date("2026-10-31T20:00:00Z"))).toBe("2026-10");
  });
});

describe("exchange rate source", () => {
  it("uses the keyed endpoint only when a key is set", () => {
    expect(exchangeRateSource("abc").url).toBe("https://v6.exchangerate-api.com/v6/abc/latest/USD");
    expect(exchangeRateSource("  ").url).toBe("https://open.er-api.com/v6/latest/USD");
    expect(exchangeRateSource(undefined).source).toBe("open.er-api.com");
  });

  it("reads EGP from either response shape and refuses bad answers", () => {
    expect(egpRateFromResponse({ result: "success", rates: { EGP: 50 } })).toBe(50);
    expect(egpRateFromResponse({ result: "success", conversion_rates: { EGP: 51 } })).toBe(51);
    expect(egpRateFromResponse({ result: "error", rates: { EGP: 50 } })).toBeNull();
    expect(egpRateFromResponse({ result: "success", rates: { EGP: 0 } })).toBeNull();
    expect(egpRateFromResponse(null)).toBeNull();
  });

  it("reads the asked-for USD rates from either shape and drops bad ones", () => {
    const codes = ["SAR", "KWD", "IQD", "EUR", "XYZ"];
    expect(
      usdRatesFromResponse({ result: "success", rates: { SAR: 3.75, KWD: 0.307, IQD: 1310, EUR: "0.92", GBP: 0.78 } }, codes),
    ).toEqual({ SAR: 3.75, KWD: 0.307, IQD: 1310, EUR: 0.92 });
    expect(usdRatesFromResponse({ result: "success", conversion_rates: { SAR: 3.75 } }, codes)).toEqual({ SAR: 3.75 });
    expect(usdRatesFromResponse({ result: "success", rates: { SAR: 0, KWD: -1, IQD: 1e9, EUR: null } }, codes)).toEqual({});
    expect(usdRatesFromResponse({ result: "error", rates: { SAR: 3.75 } }, codes)).toEqual({});
    expect(usdRatesFromResponse(null, codes)).toEqual({});
    expect(usdRatesFromResponse({ result: "success", rates: "nope" }, codes)).toEqual({});
  });
});
