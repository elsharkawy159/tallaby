import { describe, expect, it } from "vitest";
import {
  MIN_ORDER_DEFAULTS,
  MIN_ORDER_MAX_PIASTRES,
  activeMinOrderPiastres,
  checkMinOrder,
  egpToPiastres,
  itemsSubtotalPiastres,
  parseStoreMinOrder,
} from "./min-order.lib";

describe("parseStoreMinOrder", () => {
  it("is off by default and keeps other settings out", () => {
    expect(parseStoreMinOrder(null)).toEqual(MIN_ORDER_DEFAULTS);
    expect(parseStoreMinOrder({})).toEqual(MIN_ORDER_DEFAULTS);
    expect(parseStoreMinOrder({ minOrder: [] })).toEqual(MIN_ORDER_DEFAULTS);
    expect(parseStoreMinOrder({ checkoutForm: {} })).toEqual(MIN_ORDER_DEFAULTS);
  });

  it("reads a valid saved minimum", () => {
    expect(parseStoreMinOrder({ minOrder: { enabled: true, amountPiastres: 25_000 } })).toEqual({
      enabled: true,
      amountPiastres: 25_000,
    });
    // Off keeps the amount for when the seller turns it back on.
    expect(parseStoreMinOrder({ minOrder: { enabled: false, amountPiastres: 25_000 } })).toEqual({
      enabled: false,
      amountPiastres: 25_000,
    });
  });

  it("drops bad amounts and turns the minimum off with them", () => {
    for (const amountPiastres of [0, -100, 10.5, "25000", null, MIN_ORDER_MAX_PIASTRES + 1, Number.NaN]) {
      expect(parseStoreMinOrder({ minOrder: { enabled: true, amountPiastres } })).toEqual({ enabled: false, amountPiastres: 0 });
    }
    expect(parseStoreMinOrder({ minOrder: { enabled: "yes", amountPiastres: 100 } }).enabled).toBe(false);
  });
});

describe("piastres", () => {
  it("converts EGP strings and numbers without float drift", () => {
    expect(egpToPiastres("199.99")).toBe(19_999);
    expect(egpToPiastres(0.1 + 0.2)).toBe(30);
    expect(egpToPiastres("abc")).toBe(0);
    expect(egpToPiastres(null)).toBe(0);
  });

  it("sums cart lines per unit price × quantity", () => {
    expect(itemsSubtotalPiastres([])).toBe(0);
    expect(
      itemsSubtotalPiastres([
        { price: "33.33", quantity: 3 },
        { price: 0.1, quantity: 7 },
      ]),
    ).toBe(9_999 + 70);
  });
});

describe("checkMinOrder", () => {
  const minOrder = { enabled: true, amountPiastres: 30_000 };

  it("passes when off", () => {
    expect(checkMinOrder(null, 0)).toEqual({ ok: true });
    expect(checkMinOrder({ enabled: false, amountPiastres: 30_000 }, 100)).toEqual({ ok: true });
    expect(activeMinOrderPiastres({ enabled: false, amountPiastres: 30_000 })).toBeNull();
  });

  it("passes at exactly the minimum and above", () => {
    expect(checkMinOrder(minOrder, 30_000)).toEqual({ ok: true });
    expect(checkMinOrder(minOrder, 30_001)).toEqual({ ok: true });
  });

  it("refuses below it with how much is missing", () => {
    expect(checkMinOrder(minOrder, 29_999)).toEqual({ ok: false, minimumPiastres: 30_000, shortPiastres: 1 });
    expect(checkMinOrder(minOrder, 0)).toEqual({ ok: false, minimumPiastres: 30_000, shortPiastres: 30_000 });
    expect(checkMinOrder(minOrder, Number.NaN)).toEqual({ ok: false, minimumPiastres: 30_000, shortPiastres: 30_000 });
  });

  it("never trusts an unvalidated amount", () => {
    expect(checkMinOrder({ enabled: true, amountPiastres: -5 }, 0)).toEqual({ ok: true });
    expect(checkMinOrder({ enabled: true, amountPiastres: 1.5 }, 0)).toEqual({ ok: true });
  });
});
