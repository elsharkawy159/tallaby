import { describe, expect, it } from "vitest";
import { emptyCouponForm, validateCouponForm } from "./coupons.lib";

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

  it("still rejects an empty or non-numeric value", () => {
    expect(validateCouponForm({ ...emptyCouponForm(), code: "SALE10", name: "Sale", discountValue: "abc" }).errors.discountValue).toBe("value");
  });
});
