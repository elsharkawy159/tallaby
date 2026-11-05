import { describe, expect, it } from "vitest";
import {
  MIN_ORDER_QUANTITY_MAX,
  addQuantityForMinimum,
  availableUnits,
  cartLineFloor,
  isQuantityChangeRefused,
  minOrderShortfalls,
  normalizeMinOrderQuantity,
  productPageFloor,
  shouldEnforceMinOrder,
} from "./min-order-quantity.lib";

const line = (quantity: number, minOrderQuantity: unknown, extra: Record<string, unknown> = {}) => ({
  productId: "p1",
  quantity,
  minOrderQuantity,
  ...extra,
});

describe("normalizeMinOrderQuantity", () => {
  it("reads missing or bad values as 1", () => {
    for (const value of [undefined, null, "", 0, -3, 2.5, "x", Number.NaN]) expect(normalizeMinOrderQuantity(value)).toBe(1);
  });
  it("keeps a real minimum", () => {
    expect(normalizeMinOrderQuantity(3)).toBe(3);
    expect(normalizeMinOrderQuantity("4")).toBe(4);
    expect(normalizeMinOrderQuantity(MIN_ORDER_QUANTITY_MAX)).toBe(MIN_ORDER_QUANTITY_MAX);
  });
});

describe("minOrderShortfalls", () => {
  it("changes nothing at the default of 1", () => {
    expect(minOrderShortfalls([line(1, 1), line(1, undefined, { productId: "p2" })])).toEqual([]);
  });

  it("sums a product across its variants", () => {
    expect(minOrderShortfalls([line(2, 3, { variant: { id: "red" } }), line(1, 3, { variant: { id: "blue" } })])).toEqual([]);
    expect(minOrderShortfalls([line(1, 3, { variant: { id: "red" } }), line(1, 3, { variant: { id: "blue" } })])).toEqual([
      { productId: "p1", minimum: 3, current: 2, missing: 1 },
    ]);
  });

  it("checks each product on its own, whoever sells it", () => {
    const result = minOrderShortfalls([
      line(1, 2, { productId: "a", sellerId: "s1" }),
      line(2, 2, { productId: "b", sellerId: "s2" }),
      line(1, 5, { productId: "c", sellerId: "s2" }),
    ]);
    expect(result.map((r) => r.productId)).toEqual(["a", "c"]);
  });

  it("gift lines count neither way", () => {
    // Alone: no paid line, nothing to refuse.
    expect(minOrderShortfalls([line(1, 3, { giftRuleId: "g" })])).toEqual([]);
    // Beside paid lines: the gift unit doesn't help reach the minimum.
    expect(minOrderShortfalls([line(2, 3), line(1, 3, { giftRuleId: "g" })])).toEqual([
      { productId: "p1", minimum: 3, current: 2, missing: 1 },
    ]);
  });

  it("cross-sell lines count neither way when the caller says the offer applies", () => {
    const applies = (l: { crossSellId?: unknown }) => Boolean(l.crossSellId);
    expect(minOrderShortfalls([line(1, 3, { crossSellId: "o" })], { isExempt: applies })).toEqual([]);
    expect(minOrderShortfalls([line(2, 3), line(1, 3, { crossSellId: "o" })], { isExempt: applies })).toHaveLength(1);
  });

  it("a cross-sell line whose offer no longer applies is a normal line", () => {
    expect(minOrderShortfalls([line(1, 3, { crossSellId: "o" })], { isExempt: () => false })).toHaveLength(1);
  });

  it("ignores saved-for-later lines", () => {
    expect(minOrderShortfalls([line(1, 3, { savedForLater: true })])).toEqual([]);
  });
});

describe("availableUnits", () => {
  it("is infinite for an unlimited product", () => {
    expect(availableUnits({ trackStock: false, productQuantity: 0, variantStocks: [0] })).toBe(Number.POSITIVE_INFINITY);
  });
  it("is the variants' total when there are variants, not the product's own count", () => {
    expect(availableUnits({ trackStock: true, productQuantity: 99, variantStocks: [2, 1, null] })).toBe(3);
  });
  it("is the product's count otherwise, never below 0", () => {
    expect(availableUnits({ trackStock: true, productQuantity: "4", variantStocks: [] })).toBe(4);
    expect(availableUnits({ trackStock: true, productQuantity: -2 })).toBe(0);
  });
});

describe("cart line floor and refusal", () => {
  const red = line(2, 3, { id: "red" });
  const blue = line(1, 3, { id: "blue" });

  it("counts the other lines of the product", () => {
    expect(cartLineFloor(red, [red, blue])).toBe(2);
    expect(cartLineFloor(blue, [red, blue])).toBe(1);
  });
  it("is 1 for an exempt line and at the default", () => {
    expect(cartLineFloor(line(1, 3, { giftRuleId: "g" }), [red])).toBe(1);
    expect(cartLineFloor(line(1, 3, { crossSellId: "o" }), [red])).toBe(1);
    expect(cartLineFloor(line(5, 1), [])).toBe(1);
  });
  it("refuses going below the floor, not removing or going up", () => {
    const only = line(3, 3);
    expect(isQuantityChangeRefused(only, 2, [only])).toBe(true);
    expect(isQuantityChangeRefused(only, 0, [only])).toBe(false);
    expect(isQuantityChangeRefused(only, 4, [only])).toBe(false);
    expect(isQuantityChangeRefused(line(4, 3), 3, [])).toBe(false);
  });
  it("lets an old line under a raised minimum move up, a step at a time", () => {
    const old = line(1, 3);
    expect(isQuantityChangeRefused(old, 2, [old])).toBe(false);
  });
  it("never refuses at the default", () => {
    const plain = line(2, 1);
    expect(isQuantityChangeRefused(plain, 1, [plain])).toBe(false);
  });
});

describe("addQuantityForMinimum", () => {
  it("changes nothing at the default", () => {
    expect(addQuantityForMinimum({ requested: 1, minimum: 1, unitsInCart: 0, lineAvailable: 10 })).toBe(1);
  });
  it("raises a card's single unit to the minimum", () => {
    expect(addQuantityForMinimum({ requested: 1, minimum: 3, unitsInCart: 0, lineAvailable: 10 })).toBe(3);
  });
  it("counts what the cart already holds", () => {
    expect(addQuantityForMinimum({ requested: 1, minimum: 3, unitsInCart: 2, lineAvailable: 10 })).toBe(1);
    expect(addQuantityForMinimum({ requested: 1, minimum: 3, unitsInCart: 3, lineAvailable: 10 })).toBe(1);
  });
  it("never lowers what was asked for", () => {
    expect(addQuantityForMinimum({ requested: 5, minimum: 3, unitsInCart: 0, lineAvailable: 10 })).toBe(5);
  });
  it("stops at this line's stock, so another variant can make up the rest", () => {
    expect(addQuantityForMinimum({ requested: 1, minimum: 3, unitsInCart: 0, lineAvailable: 2 })).toBe(2);
  });
});

describe("productPageFloor", () => {
  it("starts at the minimum", () => {
    expect(productPageFloor({ minimum: 3, otherUnits: 0, stock: 10 })).toBe(3);
  });
  it("needs only the rest once other variants are in the cart", () => {
    expect(productPageFloor({ minimum: 3, otherUnits: 2, stock: 10 })).toBe(1);
    expect(productPageFloor({ minimum: 3, otherUnits: 5, stock: 10 })).toBe(1);
  });
  it("stops at the selected variant's stock, and is at least 1", () => {
    expect(productPageFloor({ minimum: 3, otherUnits: 0, stock: 2 })).toBe(2);
    expect(productPageFloor({ minimum: 3, otherUnits: 0, stock: 0 })).toBe(1);
    expect(productPageFloor({ minimum: 3, otherUnits: 0, stock: Number.POSITIVE_INFINITY })).toBe(3);
  });
});

describe("shouldEnforceMinOrder", () => {
  it("always holds a customer's order, whatever flag arrives", () => {
    for (const source of ["website", "storefront"] as const) {
      expect(shouldEnforceMinOrder(source, undefined)).toBe(true);
      expect(shouldEnforceMinOrder(source, true)).toBe(true);
    }
  });
  it("a manual order is held until the seller overrides it", () => {
    expect(shouldEnforceMinOrder("manual", undefined)).toBe(true);
    expect(shouldEnforceMinOrder("manual", false)).toBe(true);
    expect(shouldEnforceMinOrder("manual", true)).toBe(false);
  });
  it("never refuses an order taken outside", () => {
    expect(shouldEnforceMinOrder("external", undefined)).toBe(false);
  });
});
