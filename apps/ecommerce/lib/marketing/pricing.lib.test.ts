import { describe, expect, it } from "vitest";
import { feeShareOfOrder, monthlyEstimate, orderFee, suggestedPrice } from "./pricing.lib";

describe("orderFee", () => {
  it("is flat for any positive order and zero for none", () => {
    expect(orderFee(150)).toBe(5);
    expect(orderFee(10_000)).toBe(5);
    expect(orderFee(0)).toBe(0);
  });
});

describe("feeShareOfOrder", () => {
  it("uses one decimal below 1,000 EGP and two above", () => {
    expect(feeShareOfOrder(400)).toBe("1.3");
    expect(feeShareOfOrder(2500)).toBe("0.20");
  });
});

describe("monthlyEstimate", () => {
  it("multiplies the flat fee by the order count", () => {
    expect(monthlyEstimate(120, 450)).toEqual({ perOrder: 5, fee: 600, sales: 54_000, keep: 53_400 });
  });
});

describe("suggestedPrice", () => {
  it("matches the design's default inputs", () => {
    // (180 + 15 + 45) × 1.6 = 384, + 5 = 389 → 389
    expect(suggestedPrice({ unitCost: 180, packaging: 15, shipping: 45, marginPct: 60 })).toEqual({
      price: 389,
      cost: 240,
      fee: 5,
      profit: 144,
    });
  });

  it("treats empty and negative inputs as zero", () => {
    expect(suggestedPrice({ unitCost: Number.NaN, packaging: -4, shipping: 0, marginPct: 0 }).price).toBe(9);
  });
});
