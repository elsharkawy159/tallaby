import { describe, expect, it } from "vitest";
import {
  applyQuantityOffers,
  parseQuantityTiers,
  pickQuantityTier,
  quantityOfferUnitDiscountPiastres,
  type QuantityOffer,
} from "./quantity-offers.lib";

const tier = (minQuantity: number, discountValue: number, extra: Partial<QuantityOffer> = {}): QuantityOffer => ({
  id: `t${minQuantity}`,
  sellerId: "s1",
  productId: "p1",
  minQuantity,
  discountType: "percent",
  discountValue,
  isActive: true,
  ...extra,
});

describe("pickQuantityTier", () => {
  const tiers = [tier(2, 10), tier(3, 20), tier(5, 30)];
  it("takes the highest tier reached", () => {
    expect(pickQuantityTier(tiers, 1)).toBeNull();
    expect(pickQuantityTier(tiers, 2)?.minQuantity).toBe(2);
    expect(pickQuantityTier(tiers, 4)?.minQuantity).toBe(3);
    expect(pickQuantityTier(tiers, 50)?.minQuantity).toBe(5);
  });
  it("skips a tier that is off", () => {
    expect(pickQuantityTier([tier(2, 10), tier(3, 20, { isActive: false })], 3)?.minQuantity).toBe(2);
  });
});

describe("quantityOfferUnitDiscountPiastres", () => {
  it("rounds a percent to whole piastres", () => {
    expect(quantityOfferUnitDiscountPiastres(9999, "percent", 10)).toBe(1000);
    expect(quantityOfferUnitDiscountPiastres(10000, "percent", 12.5)).toBe(1250);
  });
  it("never takes a unit to 0", () => {
    expect(quantityOfferUnitDiscountPiastres(1000, "fixed", 50)).toBe(999);
    expect(quantityOfferUnitDiscountPiastres(100, "percent", 99)).toBe(90);
    expect(quantityOfferUnitDiscountPiastres(1, "percent", 10)).toBe(0);
    expect(quantityOfferUnitDiscountPiastres(1000, "fixed", 0)).toBe(0);
  });
});

describe("applyQuantityOffers", () => {
  const line = (quantity: number, unitPiastres = 10000, productId = "p1") => ({ productId, quantity, unitPiastres });

  it("gives nothing below the first tier or with no tiers", () => {
    expect(applyQuantityOffers([line(1)], [tier(2, 10)], "s1").totalPiastres).toBe(0);
    expect(applyQuantityOffers([line(5)], [], "s1").totalPiastres).toBe(0);
  });
  it("covers every unit of the product", () => {
    const result = applyQuantityOffers([line(3)], [tier(2, 10), tier(3, 20)], "s1");
    expect(result.totalPiastres).toBe(6000);
    expect(result.lines[0]?.snapshot).toMatchObject({ offerId: "t3", minQuantity: 3, unitDiscountPiastres: 2000, units: 3 });
  });
  it("counts units across variants, each at its own price", () => {
    const result = applyQuantityOffers([line(1, 10000), line(1, 20000)], [tier(2, 10)], "s1");
    expect(result.lines.map((entry) => entry.discountPiastres)).toEqual([1000, 2000]);
  });
  it("keeps products apart", () => {
    const result = applyQuantityOffers([line(1), line(1, 10000, "p2")], [tier(2, 10)], "s1");
    expect(result.totalPiastres).toBe(0);
  });
  it("ignores another seller's tier", () => {
    expect(applyQuantityOffers([line(3)], [tier(2, 50, { sellerId: "other" })], "s1").totalPiastres).toBe(0);
    expect(applyQuantityOffers([line(3)], [tier(2, 50)], null).totalPiastres).toBe(0);
  });
});

describe("parseQuantityTiers", () => {
  const percent = (minQuantity: number, discountValue: number) => ({ minQuantity, discountType: "percent", discountValue });

  it("accepts ascending tiers", () => {
    const result = parseQuantityTiers([percent(2, 10), percent(3, 20)], 10000);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.tiers.map((entry) => entry.minQuantity)).toEqual([2, 3]);
  });
  it("accepts an empty list, which clears the tiers", () => {
    expect(parseQuantityTiers([], 10000)).toEqual({ ok: true, tiers: [] });
  });
  it("refuses quantities that do not ascend or are below 2", () => {
    expect(parseQuantityTiers([percent(3, 10), percent(2, 20)], 10000)).toEqual({ ok: false, error: "ascending" });
    expect(parseQuantityTiers([percent(2, 10), percent(2, 20)], 10000)).toEqual({ ok: false, error: "ascending" });
    expect(parseQuantityTiers([percent(1, 10)], 10000)).toEqual({ ok: false, error: "quantity" });
    expect(parseQuantityTiers([percent(2.5, 10)], 10000)).toEqual({ ok: false, error: "quantity" });
  });
  it("keeps a percent between 1 and 90", () => {
    expect(parseQuantityTiers([percent(2, 0.5)], 10000)).toEqual({ ok: false, error: "percent" });
    expect(parseQuantityTiers([percent(2, 91)], 10000)).toEqual({ ok: false, error: "percent" });
    expect(parseQuantityTiers([percent(2, 90)], 10000).ok).toBe(true);
  });
  it("keeps a fixed amount below the lowest price", () => {
    const fixed = (discountValue: number) => [{ minQuantity: 2, discountType: "fixed", discountValue }];
    expect(parseQuantityTiers(fixed(100), 10000)).toEqual({ ok: false, error: "fixed" });
    expect(parseQuantityTiers(fixed(0), 10000)).toEqual({ ok: false, error: "fixed" });
    expect(parseQuantityTiers(fixed(99.99), 10000).ok).toBe(true);
  });
  it("refuses too many tiers and non-lists", () => {
    expect(parseQuantityTiers(Array.from({ length: 7 }, (_, i) => percent(i + 2, 10)), 10000)).toEqual({ ok: false, error: "tooMany" });
    expect(parseQuantityTiers("x", 10000)).toEqual({ ok: false, error: "tooMany" });
  });
});
