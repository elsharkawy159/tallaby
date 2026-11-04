import { describe, expect, it } from "vitest";
import {
  applyCrossSellDiscounts,
  crossSellUnitDiscountPiastres,
  parseCrossSellDiscount,
  type CrossSellLine,
  type CrossSellOffer,
} from "./cross-sell.lib";

const offer: CrossSellOffer = {
  id: "o1",
  sellerId: "s1",
  storeId: null,
  productId: "main",
  offerProductId: "cable",
  offerVariantId: null,
  discountType: "percent",
  discountValue: 10,
  isActive: true,
};
const store = { sellerId: "s1", storeId: "st1", enabled: true };
const main = (quantity = 1): CrossSellLine => ({ productId: "main", variantId: null, quantity, unitPiastres: 50_000, crossSellId: null });
const cable = (quantity = 1, extra: Partial<CrossSellLine> = {}): CrossSellLine => ({
  productId: "cable",
  variantId: null,
  quantity,
  unitPiastres: 10_000,
  crossSellId: "o1",
  ...extra,
});

describe("cross-sell discount", () => {
  it("is zero with no offers on the cart", () => {
    const result = applyCrossSellDiscounts([main(), { ...cable(), crossSellId: null }], [offer], store);
    expect(result.totalPiastres).toBe(0);
    expect(result.lines.every((line) => line.snapshot === null)).toBe(true);
  });

  it("takes a percent off one unit per main unit", () => {
    const one = applyCrossSellDiscounts([main(1), cable(3)], [offer], store);
    expect(one.totalPiastres).toBe(1_000);
    expect(one.lines[1]!.snapshot).toMatchObject({ discountedUnits: 1, unitDiscountPiastres: 1_000, mainProductId: "main" });
    expect(applyCrossSellDiscounts([main(2), cable(3)], [offer], store).totalPiastres).toBe(2_000);
  });

  it("charges full price when the main product is gone", () => {
    expect(applyCrossSellDiscounts([cable(2)], [offer], store).totalPiastres).toBe(0);
  });

  it("charges full price for an inactive offer, a switched-off store, another seller or another store", () => {
    const lines = [main(), cable()];
    expect(applyCrossSellDiscounts(lines, [{ ...offer, isActive: false }], store).totalPiastres).toBe(0);
    expect(applyCrossSellDiscounts(lines, [offer], { ...store, enabled: false }).totalPiastres).toBe(0);
    expect(applyCrossSellDiscounts(lines, [{ ...offer, sellerId: "s2" }], store).totalPiastres).toBe(0);
    expect(applyCrossSellDiscounts(lines, [{ ...offer, storeId: "st2" }], store).totalPiastres).toBe(0);
    expect(applyCrossSellDiscounts(lines, [{ ...offer, storeId: "st1" }], store).totalPiastres).toBe(1_000);
    expect(applyCrossSellDiscounts(lines, [], store).totalPiastres).toBe(0);
  });

  it("checks the product and variant the offer points at", () => {
    expect(applyCrossSellDiscounts([main(), cable(1, { productId: "other" })], [offer], store).totalPiastres).toBe(0);
    const forVariant = { ...offer, offerVariantId: "v1" };
    expect(applyCrossSellDiscounts([main(), cable(1, { variantId: "v2" })], [forVariant], store).totalPiastres).toBe(0);
    expect(applyCrossSellDiscounts([main(), cable(1, { variantId: "v1" })], [forVariant], store).totalPiastres).toBe(1_000);
  });

  it("evaluates two offers on their own", () => {
    const second = { ...offer, id: "o2", offerProductId: "case", discountType: "fixed" as const, discountValue: 5 };
    const lines = [main(), cable(), { ...cable(), productId: "case", crossSellId: "o2" }];
    expect(applyCrossSellDiscounts(lines, [offer, second], store).totalPiastres).toBe(1_500);
  });
});

describe("unit discount", () => {
  it("rounds percent in piastres and never reaches 0", () => {
    expect(crossSellUnitDiscountPiastres(999, "percent", 10)).toBe(100);
    expect(crossSellUnitDiscountPiastres(1_000, "fixed", 500)).toBe(999);
    expect(crossSellUnitDiscountPiastres(1_000, "percent", 200)).toBe(900);
    expect(crossSellUnitDiscountPiastres(1, "fixed", 5)).toBe(0);
  });
});

describe("parse seller input", () => {
  it("accepts 1 to 90 percent and a positive amount", () => {
    expect(parseCrossSellDiscount("percent", "10")).toEqual({ type: "percent", value: 10 });
    expect(parseCrossSellDiscount("fixed", 12.5)).toEqual({ type: "fixed", value: 12.5 });
    expect(parseCrossSellDiscount("percent", 91)).toBeNull();
    expect(parseCrossSellDiscount("percent", 0)).toBeNull();
    expect(parseCrossSellDiscount("fixed", -1)).toBeNull();
    expect(parseCrossSellDiscount("free", 10)).toBeNull();
  });
});
