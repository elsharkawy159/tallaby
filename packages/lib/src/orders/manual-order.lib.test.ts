import { describe, expect, it } from "vitest";
import {
  capManualDiscountPiastres,
  isAwaitingCustomer,
  manualOrderErrorKey,
  manualOrderInputSchema,
  manualOrderTotals,
} from "./manual-order.lib";

const input = {
  requestId: "11111111-1111-4111-8111-111111111111",
  lines: [{ productId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
  customer: { name: "Sara", phone: "0100 123 4567" },
  address: { state: "CAIRO", city: "Nasr City", addressLine1: "12 Abbas St" },
  payment: "cod",
};

describe("manual order input", () => {
  it("normalises the phone and fills defaults", () => {
    const parsed = manualOrderInputSchema.parse(input);
    expect(parsed.customer.phone).toBe("01001234567");
    expect(parsed.discountEgp).toBe(0);
    expect(parsed.sendLink).toBe(false);
  });

  it("refuses a non-Egyptian phone, no lines and bad quantities", () => {
    expect(manualOrderInputSchema.safeParse({ ...input, customer: { name: "Sara", phone: "123" } }).success).toBe(false);
    expect(manualOrderInputSchema.safeParse({ ...input, lines: [] }).success).toBe(false);
    expect(
      manualOrderInputSchema.safeParse({ ...input, lines: [{ ...input.lines[0], quantity: 0 }] }).success,
    ).toBe(false);
  });

  it("needs a method when already paid, and a link only makes sense for cash on delivery", () => {
    expect(manualOrderInputSchema.safeParse({ ...input, payment: "paid" }).success).toBe(false);
    expect(manualOrderInputSchema.safeParse({ ...input, payment: "paid", paidVia: "instapay" }).success).toBe(true);
    expect(
      manualOrderInputSchema.safeParse({ ...input, payment: "paid", paidVia: "cash", sendLink: true }).success,
    ).toBe(false);
  });
});

describe("manual order totals", () => {
  it("caps the discount at the goods and never touches shipping", () => {
    expect(capManualDiscountPiastres(50, 10_000)).toBe(5_000);
    expect(capManualDiscountPiastres(500, 10_000)).toBe(10_000);
    expect(capManualDiscountPiastres(-1, 10_000)).toBe(0);
    expect(manualOrderTotals({ goodsPiastres: 10_000, discountEgp: 500, shippingPiastres: 4_500 })).toEqual({
      goodsPiastres: 10_000,
      discountPiastres: 10_000,
      shippingPiastres: 4_500,
      totalPiastres: 4_500,
    });
  });
});

describe("awaiting customer", () => {
  it("is only a pending order with the flag", () => {
    const metadata = { manualOrder: { awaitingCustomer: true } };
    expect(isAwaitingCustomer({ status: "pending", metadata })).toBe(true);
    expect(isAwaitingCustomer({ status: "confirmed", metadata })).toBe(false);
    expect(isAwaitingCustomer({ status: "pending", metadata: null })).toBe(false);
  });
});

describe("error keys", () => {
  it("maps place-order errors", () => {
    expect(manualOrderErrorKey("storeCustomerBlocked")).toBe("customerBlocked");
    expect(manualOrderErrorKey("storeShippingNoCod")).toBe("noCod");
    expect(manualOrderErrorKey("Cash on delivery is not available when shipping cost exceeds 90 EGP")).toBe("noCod");
    expect(manualOrderErrorKey("Insufficient stock for a product in your cart")).toBe("insufficientStock");
    expect(manualOrderErrorKey("anything else")).toBe("generic");
  });
});
