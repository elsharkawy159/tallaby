import { describe, expect, it } from "vitest";
import {
  cairoToday,
  isAllowedPreorderDay,
  isPreorderDay,
  latestPreorderDay,
  preorderSnapshotDate,
  storefrontPreorder,
} from "./preorder.lib";

describe("cairoToday", () => {
  it("uses the Cairo calendar day", () => {
    // 23:30 UTC on Nov 24 is already Nov 25 in Cairo (UTC+2).
    expect(cairoToday(new Date("2026-11-24T23:30:00Z"))).toBe("2026-11-25");
    expect(cairoToday(new Date("2026-11-25T10:00:00Z"))).toBe("2026-11-25");
  });
});

describe("isPreorderDay", () => {
  it("accepts real YYYY-MM-DD days only", () => {
    expect(isPreorderDay("2026-12-01")).toBe(true);
    expect(isPreorderDay("2028-02-29")).toBe(true);
    expect(isPreorderDay("2026-02-30")).toBe(false);
    expect(isPreorderDay("2026-1-5")).toBe(false);
    expect(isPreorderDay("2026-12-01T00:00:00Z")).toBe(false);
    expect(isPreorderDay(null)).toBe(false);
    expect(isPreorderDay(20261201)).toBe(false);
  });
});

describe("isAllowedPreorderDay", () => {
  const today = "2026-11-25";
  it("allows today up to two years ahead", () => {
    expect(isAllowedPreorderDay("2026-11-25", today)).toBe(true);
    expect(isAllowedPreorderDay("2027-03-01", today)).toBe(true);
    expect(isAllowedPreorderDay(latestPreorderDay(today), today)).toBe(true);
  });
  it("refuses a past day, a far day and a bad value", () => {
    expect(isAllowedPreorderDay("2026-11-24", today)).toBe(false);
    expect(isAllowedPreorderDay("2028-11-26", today)).toBe(false);
    expect(isAllowedPreorderDay("", today)).toBe(false);
  });
});

describe("preorderSnapshotDate", () => {
  it("is the product's date only while pre-order is on", () => {
    expect(preorderSnapshotDate({ preorderEnabled: true, preorderShipsAt: "2026-12-10" })).toBe("2026-12-10");
    expect(preorderSnapshotDate({ preorderEnabled: false, preorderShipsAt: "2026-12-10" })).toBeNull();
    expect(preorderSnapshotDate({ preorderEnabled: true, preorderShipsAt: null })).toBeNull();
    // A product row from before 0179 (no columns) is a normal product.
    expect(preorderSnapshotDate({})).toBeNull();
  });
  it("keeps a date that has passed, so the seller sees the promise", () => {
    expect(preorderSnapshotDate({ preorderEnabled: true, preorderShipsAt: "2020-01-01" })).toBe("2020-01-01");
  });
});

describe("storefrontPreorder", () => {
  const today = "2026-11-25";
  it("is null for a normal product", () => {
    expect(storefrontPreorder({ preorderEnabled: false, preorderShipsAt: "2026-12-10" }, today)).toBeNull();
    expect(storefrontPreorder({}, today)).toBeNull();
  });
  it("shows the date until it passes", () => {
    expect(storefrontPreorder({ preorderEnabled: true, preorderShipsAt: "2026-12-10" }, today)).toEqual({ shipsAt: "2026-12-10" });
    expect(storefrontPreorder({ preorderEnabled: true, preorderShipsAt: today }, today)).toEqual({ shipsAt: today });
    expect(storefrontPreorder({ preorderEnabled: true, preorderShipsAt: "2026-11-24" }, today)).toEqual({ shipsAt: null });
  });
});
