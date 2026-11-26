import { describe, expect, it } from "vitest";
import type { PriceRoundingRule } from "@workspace/lib/products/price-rounding";
import { priceRoundingHint } from "./price-rounding-hint.lib";

const up50: PriceRoundingRule = { enabled: true, tiers: [{ upTo: null, step: 50, direction: "up" }] };

describe("priceRoundingHint", () => {
  it("says nothing without a rule, with it off, or with no price", () => {
    expect(priceRoundingHint(213, undefined, null)).toEqual({ kind: "none" });
    expect(priceRoundingHint(213, undefined, { ...up50, enabled: false })).toEqual({ kind: "none" });
    expect(priceRoundingHint(undefined, undefined, up50)).toEqual({ kind: "none" });
    expect(priceRoundingHint(0, undefined, up50)).toEqual({ kind: "none" });
  });

  it("says nothing when the price is already round", () => {
    expect(priceRoundingHint(250, undefined, up50)).toEqual({ kind: "none" });
    expect(priceRoundingHint(300, 250, up50)).toEqual({ kind: "none" });
  });

  it("shows the rounded price", () => {
    expect(priceRoundingHint(213, undefined, up50)).toEqual({ kind: "rounded", price: 250, salePrice: null });
    // A sale price that isn't below the price is no discount.
    expect(priceRoundingHint(213, 213, up50)).toEqual({ kind: "rounded", price: 250, salePrice: null });
  });

  it("shows only the prices that change", () => {
    expect(priceRoundingHint(300, 213, up50)).toEqual({ kind: "rounded", price: null, salePrice: 250 });
    expect(priceRoundingHint(310, 213, up50)).toEqual({ kind: "rounded", price: 350, salePrice: 250 });
  });

  it("warns when the discount will be removed", () => {
    expect(priceRoundingHint(240, 213, up50)).toEqual({ kind: "dropped", price: 250 });
  });
});
