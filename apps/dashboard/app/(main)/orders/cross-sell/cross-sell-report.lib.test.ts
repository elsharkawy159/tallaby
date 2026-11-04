import { describe, expect, it } from "vitest";
import { applyCrossSellDiscounts, type CrossSellOffer } from "@workspace/lib/orders/cross-sell";
import {
  parseCrossSellReportFilters,
  piastresToDecimal,
  reportInteger,
  reportRowFrom,
  reportTotalsFrom,
  snapshotDiscountPiastres,
} from "./cross-sell-report.lib";

describe("parseCrossSellReportFilters", () => {
  it("defaults to 30 days and the first page", () => {
    expect(parseCrossSellReportFilters({})).toEqual({ days: 30, page: 1, size: 20 });
  });

  it("takes only the offered values", () => {
    expect(parseCrossSellReportFilters({ days: "90", page: "3", size: "50" })).toEqual({ days: 90, page: 3, size: 50 });
    expect(parseCrossSellReportFilters({ days: "100000", page: "-2", size: "5000" })).toEqual({ days: 30, page: 1, size: 20 });
    expect(parseCrossSellReportFilters({ days: ["7"], page: "1; DROP", size: null })).toEqual({ days: 30, page: 1, size: 20 });
  });
});

describe("the report's money", () => {
  it("is the discount the order was charged: the snapshot's units times its unit discount", () => {
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
    const { lines, totalPiastres } = applyCrossSellDiscounts(
      [
        { productId: "main", variantId: null, quantity: 2, unitPiastres: 50000, crossSellId: null },
        { productId: "cable", variantId: null, quantity: 3, unitPiastres: 9999, crossSellId: "o1" },
      ],
      [offer],
      { sellerId: "s1", storeId: "st", enabled: true },
    );
    const snapshot = lines[1]!.snapshot!;
    // One discounted unit per main unit: 2, not the 3 bought.
    expect(snapshot.discountedUnits).toBe(2);
    expect(snapshotDiscountPiastres(snapshot)).toBe(totalPiastres);
  });

  it("prints piastres exactly", () => {
    expect(piastresToDecimal(0)).toBe("0.00");
    expect(piastresToDecimal(5)).toBe("0.05");
    expect(piastresToDecimal(1999)).toBe("19.99");
    expect(piastresToDecimal(10_000_000_001)).toBe("100000000.01");
  });

  it("reads counts and sums from the database safely", () => {
    expect(reportInteger("12")).toBe(12);
    expect(reportInteger(7)).toBe(7);
    for (const bad of [null, undefined, "x", -3, Number.NaN]) expect(reportInteger(bad)).toBe(0);
  });
});

describe("rows", () => {
  it("shapes an aggregate row", () => {
    expect(reportRowFrom({ offer_id: "o1", offer_name: "Cable", main_name: "Power bank", orders: "4", units: "6", discount_piastres: "1250" })).toEqual({
      offerId: "o1",
      offerName: "Cable",
      mainName: "Power bank",
      orders: 4,
      units: 6,
      discount: "12.50",
    });
    expect(reportRowFrom({ offer_id: "o1", offer_name: "Cable", main_name: null }).mainName).toBeNull();
  });

  it("has zero totals with no rows", () => {
    expect(reportTotalsFrom(undefined)).toEqual({ orders: 0, units: 0, discount: "0.00" });
  });
});
