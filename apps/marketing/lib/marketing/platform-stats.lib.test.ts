import { describe, expect, it } from "vitest";
import { formatStat, roundDownClean, statFigure, toPlatformStats } from "./platform-stats.lib";

describe("roundDownClean", () => {
  it("rounds down to a clean figure, never up", () => {
    expect(roundDownClean(230)).toBe(200);
    expect(roundDownClean(299)).toBe(200);
    expect(roundDownClean(1155)).toBe(1000);
    expect(roundDownClean(4870)).toBe(4000);
    expect(roundDownClean(9999)).toBe(9000);
    expect(roundDownClean(12_345)).toBe(12_000);
    expect(roundDownClean(100)).toBe(100);
    expect(roundDownClean(7)).toBe(7);
  });

  it("gives 0 for nothing usable", () => {
    expect(roundDownClean(0)).toBe(0);
    expect(roundDownClean(-5)).toBe(0);
    expect(roundDownClean(Number.NaN)).toBe(0);
  });
});

describe("statFigure", () => {
  it("hides a count under its floor", () => {
    expect(statFigure(67, 1000)).toBeNull();
    expect(statFigure(999, 1000)).toBeNull();
    expect(statFigure(1000, 1000)).toBe(1000);
  });
});

describe("toPlatformStats", () => {
  it("is all null when the database couldn't be read", () => {
    expect(toPlatformStats(null)).toEqual({ stores: null, products: null, orders: null });
  });

  it("keeps only the counts that clear their floor", () => {
    expect(toPlatformStats({ stores: 230, products: 1155, orders: 67 })).toEqual({ stores: 200, products: 1000, orders: null });
  });
});

describe("formatStat", () => {
  it("puts the plus where each language reads it", () => {
    expect(formatStat(1000, "en")).toBe("1,000+");
    expect(formatStat(1000, "ar")).toBe("+1,000");
  });
});
