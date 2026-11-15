import { describe, expect, it } from "vitest";
import { marketingEgpFiguresChanged, usdCentsToApproxEgp } from "@workspace/lib/billing";
import { shouldInvalidateMarketingRate } from "./exchange-rate.lib";

const midday = new Date("2026-11-15T12:05:00Z");

describe("shouldInvalidateMarketingRate", () => {
  it("keeps the pages when the rate is the same", () => {
    expect(shouldInvalidateMarketingRate({ previous: 53.9007, next: 53.9007, now: midday })).toBe(false);
  });

  it("keeps the pages when the rate differs only past the 1/10000 EGP the figures use", () => {
    expect(shouldInvalidateMarketingRate({ previous: 53.9007, next: 53.90071, now: midday })).toBe(false);
  });

  it("clears the pages for the smallest stored change, since some amount up to $1,000 reads differently", () => {
    expect(shouldInvalidateMarketingRate({ previous: 53.9007, next: 53.9008, now: midday })).toBe(true);
  });

  it("clears the pages when a shown figure changes", () => {
    // $29 Pro: 1,563 → 1,566 EGP.
    expect(usdCentsToApproxEgp(2900, 53.9)).not.toBe(usdCentsToApproxEgp(2900, 54));
    expect(shouldInvalidateMarketingRate({ previous: 53.9, next: 54, now: midday })).toBe(true);
  });

  it("clears the pages when there was no rate before, or none after", () => {
    expect(shouldInvalidateMarketingRate({ previous: null, next: 53.9, now: midday })).toBe(true);
    expect(shouldInvalidateMarketingRate({ previous: 53.9, next: null, now: midday })).toBe(true);
    expect(shouldInvalidateMarketingRate({ previous: null, next: null, now: midday })).toBe(false);
  });

  it("clears the pages on the first run of the UTC day even when nothing changed", () => {
    expect(shouldInvalidateMarketingRate({ previous: 53.9, next: 53.9, now: new Date("2026-11-15T00:05:00Z") })).toBe(true);
    expect(shouldInvalidateMarketingRate({ previous: 53.9, next: 53.9, now: new Date("2026-11-15T03:05:00Z") })).toBe(false);
  });
});

describe("marketingEgpFiguresChanged", () => {
  it("matches a brute-force check of every figure", () => {
    const pairs: [number, number][] = [
      [53.9007, 53.9008],
      [53.9007, 53.9017],
      [53.9, 53.91],
      [50, 50.0001],
    ];
    for (const [a, b] of pairs) {
      let differs = false;
      for (let cents = 1; cents <= 100_000 && !differs; cents += 1) {
        differs = usdCentsToApproxEgp(cents, a) !== usdCentsToApproxEgp(cents, b);
      }
      expect(marketingEgpFiguresChanged(a, b)).toBe(differs);
    }
  });

  it("only checks up to the amount it is given", () => {
    // $0.03 at 53.9 and 53.91: 1.62 EGP both times; $1,000 differs.
    expect(marketingEgpFiguresChanged(53.9, 53.91, 3)).toBe(false);
    expect(marketingEgpFiguresChanged(53.9, 53.91)).toBe(true);
  });
});
