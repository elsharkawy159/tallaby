import { describe, expect, it } from "vitest";
import { buildSummaryWithCoupon } from "./coupon-utils";

const base = {
  subtotal: 600,
  tax: 0,
  shippingCost: 50,
  total: 650,
  itemCount: 2,
  storeShipping: { kind: "zone" as const },
};

const offerLine = { type: "cross_sell" as const, label: "Bundle offer", amount: "10.00" };

describe("checkout summary with a cross-sell offer", () => {
  it("shows the same numbers as before with no offer", () => {
    const summary = buildSummaryWithCoupon(base, null, null);
    expect(summary.discountAmount).toBe(0);
    expect(summary.totalAfterDiscount).toBe(650);
    expect(summary.discounts).toEqual([]);
  });

  it("takes the offer off the total and lists it", () => {
    const summary = buildSummaryWithCoupon({ ...base, lineOffers: [offerLine] }, null, null);
    expect(summary.discountAmount).toBe(10);
    expect(summary.totalAfterDiscount).toBe(640);
    expect(summary.discounts).toEqual([{ type: "cross_sell", label: "Bundle offer", amount: "10.00" }]);
  });

  it("adds to a coupon's discount", () => {
    const coupon = { id: "c", code: "X", name: "X", discountType: "percentage", discountValue: "10" };
    const summary = buildSummaryWithCoupon(
      { ...base, lineOffers: [offerLine] },
      coupon as never,
      { discountAmount: 59, shippingDiscount: 0, applicableSubtotal: 590, totalAfterDiscount: 0 },
    );
    expect(summary.discountAmount).toBe(69);
    expect(summary.totalAfterDiscount).toBe(581);
    expect(summary.discounts?.map((line) => line.type)).toEqual(["coupon", "cross_sell"]);
  });
});
