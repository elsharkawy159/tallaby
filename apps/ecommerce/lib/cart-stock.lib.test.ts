import { describe, expect, it } from "vitest";
import { cartLineHasStock } from "./cart-stock.lib";

const base = { trackStock: true, productQuantity: 5, hasVariant: false, variantStock: null };

describe("cart line stock", () => {
  it("uses the product's stock when there's no variant", () => {
    expect(cartLineHasStock({ ...base, quantity: 5 })).toBe(true);
    expect(cartLineHasStock({ ...base, quantity: 6 })).toBe(false);
  });

  it("uses the variant's stock, not the product's", () => {
    const variant = { ...base, hasVariant: true, productQuantity: 100 };
    expect(cartLineHasStock({ ...variant, quantity: 2, variantStock: 2 })).toBe(true);
    expect(cartLineHasStock({ ...variant, quantity: 3, variantStock: 2 })).toBe(false);
    expect(cartLineHasStock({ ...base, hasVariant: true, productQuantity: 0, quantity: 2, variantStock: 4 })).toBe(true);
  });

  it("treats a missing variant as no stock", () => {
    expect(cartLineHasStock({ ...base, hasVariant: true, quantity: 1, variantStock: null })).toBe(false);
  });

  it("has no limit when stock isn't tracked", () => {
    expect(cartLineHasStock({ ...base, trackStock: false, quantity: 999 })).toBe(true);
    expect(cartLineHasStock({ ...base, trackStock: false, hasVariant: true, quantity: 999, variantStock: 0 })).toBe(true);
  });

  it("always lets a line be removed", () => {
    expect(cartLineHasStock({ ...base, productQuantity: 0, quantity: 0 })).toBe(true);
  });
});
