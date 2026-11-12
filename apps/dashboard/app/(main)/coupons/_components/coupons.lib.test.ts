import { describe, expect, it } from "vitest";
import { couponToForm, emptyCouponForm, validateCouponForm } from "./coupons.lib";

describe("validateCouponForm", () => {
  it("reads Arabic-Indic digits typed on an Arabic keyboard", () => {
    const form = {
      ...emptyCouponForm(),
      code: "SALE10",
      name: "Sale",
      discountValue: "١٥",
      minimumPurchase: "٢٠٠",
      usageLimit: "٥٠",
      perUserLimit: "۲",
    };
    const { errors, input } = validateCouponForm(form);
    expect(errors).toEqual({});
    expect(input).toMatchObject({ discountValue: 15, minimumPurchase: 200, usageLimit: 50, perUserLimit: 2 });
  });

  it("a product list needs one store: All stores (null) is whole-order only (F-87k)", () => {
    const base = { ...emptyCouponForm(), code: "SALE10", name: "Sale", productScope: "selected" as const, productIds: ["p1"] };
    expect(validateCouponForm({ ...base, storeId: null }).errors.productIds).toBe("productsNeedStore");
    expect(validateCouponForm({ ...base, storeId: "store-a" }).errors).toEqual({});
    expect(validateCouponForm({ ...base, productScope: "all", storeId: null }).errors).toEqual({});
  });

  it("starts a new coupon on the given store, and an edit on the coupon's own", () => {
    expect(emptyCouponForm("store-a").storeId).toBe("store-a");
    expect(emptyCouponForm().storeId).toBeNull();
    const row = {
      id: "c1", code: "SALE10", name: "Sale", discountType: "percentage" as const, discountValue: 10,
      minimumPurchase: null, maximumDiscount: null, usageLimit: null, usageCount: 0, perUserLimit: null,
      productIds: null, channels: ["storefront" as const], popup: null, showInCart: false, isActive: true,
      startsAt: "2026-11-01T00:00:00Z", expiresAt: "2026-12-01T00:00:00Z", createdAt: null, discountGiven: 0,
    };
    expect(couponToForm({ ...row, storeId: null }).storeId).toBeNull();
    expect(couponToForm({ ...row, storeId: "store-b" }).storeId).toBe("store-b");
  });

  it("still rejects an empty or non-numeric value", () => {
    expect(validateCouponForm({ ...emptyCouponForm(), code: "SALE10", name: "Sale", discountValue: "abc" }).errors.discountValue).toBe("value");
  });
});
