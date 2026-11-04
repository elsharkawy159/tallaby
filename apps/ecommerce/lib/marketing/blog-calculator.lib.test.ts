import { describe, expect, it } from "vitest";
import { FREE_PLAN_FEE_EGP, suggestedProductPrice } from "./blog-calculator.lib";

describe("suggestedProductPrice", () => {
  it("adds the margin and the Free plan fee, then rounds up to a price ending in 9", () => {
    const result = suggestedProductPrice({ unitCost: 180, packaging: 15, shipping: 45, marginPct: 60 });
    // 240 cost × 1.6 = 384, plus 1.5 = 385.5 → 389.
    expect(result).toEqual({ price: 389, cost: 240, fee: FREE_PLAN_FEE_EGP, profit: 147.5 });
  });

  it("suggests nothing when no costs are entered", () => {
    expect(suggestedProductPrice({ unitCost: 0, packaging: 0, shipping: 0, marginPct: 60 })).toEqual({ price: 0, cost: 0, fee: 0, profit: 0 });
  });

  it("treats negative and invalid numbers as zero", () => {
    const result = suggestedProductPrice({ unitCost: 100, packaging: -5, shipping: Number.NaN, marginPct: -10 });
    expect(result.cost).toBe(100);
    expect(result.price).toBe(109);
  });
});
