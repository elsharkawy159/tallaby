import { describe, expect, it } from "vitest";
import { cartItemFloor, cartItemMinimum, cartMinOrderIssues } from "./cart-min-order.lib";

const item = (id: string, quantity: number, min: unknown, extra: Record<string, unknown> = {}) => ({
  id,
  productId: "p",
  quantity,
  product: { minOrderQuantity: min, title: "Mug" },
  ...extra,
});

describe("cart minimum helpers", () => {
  it("reads the minimum from the line's product", () => {
    const red = item("red", 2, 3);
    const blue = item("blue", 1, 3);
    expect(cartItemFloor(red, [red, blue])).toBe(2);
    expect(cartItemFloor(blue, [red, blue])).toBe(1);
  });

  it("a line without the column has no minimum", () => {
    const old = item("a", 1, undefined);
    expect(cartItemFloor(old, [old])).toBe(1);
    expect(cartItemMinimum(old)).toBeNull();
    expect(cartMinOrderIssues([old], [])).toEqual([]);
  });

  it("names what to fix", () => {
    const line = item("a", 1, 3);
    expect(cartMinOrderIssues([line], [])).toEqual([
      { productId: "p", title: "Mug", minimum: 3, current: 1, missing: 2, lineId: "a", lineQuantity: 1 },
    ]);
  });

  it("leaves out a gift, and a cross-sell line only when its offer applies", () => {
    expect(cartMinOrderIssues([item("g", 1, 3, { giftRuleId: "r" })], [])).toEqual([]);
    const offer = item("o", 1, 3, { crossSellId: "x" });
    expect(cartMinOrderIssues([offer], ["o"])).toEqual([]);
    expect(cartMinOrderIssues([offer], [])).toHaveLength(1);
    expect(cartItemMinimum(offer)).toBeNull();
  });
});
