import { describe, expect, it } from "vitest";

import { amountToPiastres, piastresToAmount, splitTallabyPay } from "./fee.lib";

describe("splitTallabyPay (design §4.4)", () => {
  it.each([
    // paid, fee, seller (piastres) — the design table at 300 bps
    [10_000, 300, 9_700],
    [25_000, 750, 24_250],
    [9_999, 300, 9_699],
    [3_333, 100, 3_233],
    [50, 2, 48],
  ])("splits %i piastres into fee %i and net %i at 3%%", (paid, fee, net) => {
    expect(splitTallabyPay(paid, 300)).toEqual({ feePiastres: fee, netPiastres: net });
  });

  it("charges nothing at 0 bps", () => {
    expect(splitTallabyPay(12_345, 0)).toEqual({ feePiastres: 0, netPiastres: 12_345 });
  });

  it("takes 20% at the 2000 bps ceiling", () => {
    expect(splitTallabyPay(10_000, 2_000)).toEqual({ feePiastres: 2_000, netPiastres: 8_000 });
  });

  it("rounds a fee below half a piastre down to zero (1 piastre at 3%)", () => {
    expect(splitTallabyPay(1, 300)).toEqual({ feePiastres: 0, netPiastres: 1 });
  });

  it("rounds exactly half a piastre up", () => {
    // 50 * 100 bps = 0.5 piastre → 1
    expect(splitTallabyPay(50, 100)).toEqual({ feePiastres: 1, netPiastres: 49 });
  });

  it("always adds back up to the paid amount", () => {
    for (let paid = 1; paid <= 5_000; paid += 7) {
      const { feePiastres, netPiastres } = splitTallabyPay(paid, 300);
      expect(feePiastres + netPiastres).toBe(paid);
      expect(feePiastres).toBeGreaterThanOrEqual(0);
      expect(netPiastres).toBeGreaterThanOrEqual(0);
    }
  });

  it.each([
    [-1, 300],
    [1.5, 300],
    [Number.NaN, 300],
    [100, -1],
    [100, 2_001],
    [100, 2.5],
  ])("refuses paid %s / bps %s", (paid, bps) => {
    expect(() => splitTallabyPay(paid, bps)).toThrow(RangeError);
  });
});

describe("piastre ⇄ numeric(10,2) boundary", () => {
  it.each([
    [0, "0.00"],
    [1, "0.01"],
    [9_700, "97.00"],
    [-9_700, "-97.00"],
    [-5, "-0.05"],
    [99_999_999_99, "99999999.99"],
  ])("formats %i piastres as %s", (piastres, text) => {
    expect(piastresToAmount(piastres)).toBe(text);
  });

  it("refuses non-integers and values past numeric(10,2)", () => {
    expect(() => piastresToAmount(1.5)).toThrow(RangeError);
    expect(() => piastresToAmount(100_000_000_00)).toThrow(RangeError);
  });

  it.each([
    ["97.00", 9_700],
    ["97", 9_700],
    ["97.5", 9_750],
    ["-0.05", -5],
    ["0", 0],
  ])("parses %s as %i piastres", (text, piastres) => {
    expect(amountToPiastres(text)).toBe(piastres);
  });

  it("refuses text that is not a 2 dp amount", () => {
    expect(() => amountToPiastres("1.234")).toThrow(RangeError);
    expect(() => amountToPiastres("abc")).toThrow(RangeError);
    expect(() => amountToPiastres("")).toThrow(RangeError);
  });
});
