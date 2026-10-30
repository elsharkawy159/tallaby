import { describe, expect, it } from "vitest";
import { lowStockAlertText, lowStockLeft, lowStockThreshold, pageHasStockBadge } from "./low-stock";

describe("lowStockLeft", () => {
  const on = { show: true, threshold: null };

  it("shows nothing when the seller didn't tick it", () => {
    expect(lowStockLeft(2, { show: false, threshold: 5 })).toBeNull();
    expect(lowStockLeft(2, null)).toBeNull();
  });

  it("shows nothing at 0 (the sold-out state shows instead)", () => {
    expect(lowStockLeft(0, on)).toBeNull();
    expect(lowStockLeft(-3, on)).toBeNull();
  });

  it("shows the real count at 1, 2 and the threshold, not above", () => {
    expect(lowStockLeft(1, on)).toBe(1);
    expect(lowStockLeft(2, on)).toBe(2);
    expect(lowStockLeft(5, on)).toBe(5);
    expect(lowStockLeft(6, on)).toBeNull();
    expect(lowStockLeft(10, { show: true, threshold: 10 })).toBe(10);
    expect(lowStockLeft(11, { show: true, threshold: 10 })).toBeNull();
  });

  it("keeps the threshold in 1-99, default 5", () => {
    expect(lowStockThreshold(null)).toBe(5);
    expect(lowStockThreshold(0)).toBe(1);
    expect(lowStockThreshold(500)).toBe(99);
    expect(lowStockThreshold(2.5)).toBe(5);
  });
});

describe("pageHasStockBadge", () => {
  type Node = { type: string; children: Node[] };
  const n = (type: string, children: Node[] = []): Node => ({ type, children });
  it("finds a badge element at any depth of any section, hidden or not", () => {
    expect(pageHasStockBadge([{ componentTree: [n("section", [n("vFlex", [n("productStockBadge")])])] }])).toBe(true);
    expect(pageHasStockBadge([{ componentTree: [n("section", [n("productStock")])] }, { componentTree: null }])).toBe(false);
    expect(pageHasStockBadge([])).toBe(false);
    expect(pageHasStockBadge(undefined)).toBe(false);
  });
});

describe("lowStockAlertText", () => {
  it("counts in Arabic and English", () => {
    expect(lowStockAlertText(1, "ar")).toContain("قطعة واحدة");
    expect(lowStockAlertText(2, "ar")).toContain("قطعتين");
    expect(lowStockAlertText(3, "ar")).toContain("3 قطع");
    expect(lowStockAlertText(11, "ar")).toContain("11 قطعة");
    expect(lowStockAlertText(2, "en")).toBe("Only 2 left, order before it's gone");
  });
});
