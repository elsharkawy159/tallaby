import { describe, expect, it } from "vitest";
import { formatStat, roundUpStat, statFigure, toPlatformStats } from "./platform-stats.lib";

describe("roundUpStat", () => {
  it("rounds up to the next round step", () => {
    expect(roundUpStat(7)).toBe(10);
    expect(roundUpStat(19)).toBe(20);
    expect(roundUpStat(80)).toBe(80);
    expect(roundUpStat(100)).toBe(100);
    expect(roundUpStat(201)).toBe(250);
    expect(roundUpStat(230)).toBe(250);
    expect(roundUpStat(250)).toBe(250);
    expect(roundUpStat(251)).toBe(300);
    expect(roundUpStat(399)).toBe(400);
    expect(roundUpStat(1155)).toBe(1200);
    expect(roundUpStat(9999)).toBe(10_000);
    expect(roundUpStat(12_345)).toBe(13_000);
  });

  it("gives 0 for nothing usable", () => {
    expect(roundUpStat(0)).toBe(0);
    expect(roundUpStat(-5)).toBe(0);
    expect(roundUpStat(Number.NaN)).toBe(0);
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
    expect(toPlatformStats({ stores: 230, products: 1155, orders: 67 })).toEqual({ stores: 250, products: 1200, orders: null });
  });
});

describe("formatStat", () => {
  it("puts the plus where each language reads it", () => {
    expect(formatStat(1000, "en")).toBe("1,000+");
    expect(formatStat(1000, "ar")).toBe("+1,000");
  });
});
