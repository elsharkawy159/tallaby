import { describe, expect, it } from "vitest";
import {
  DIGITAL_NO_COD_ERROR,
  allowedPaymentMethodsForCart,
  cartHasDigitalProduct,
  isCashOnDeliveryMethod,
  isPaymentMethodAllowedForCart,
} from "./digital-checkout.lib";
import { storefrontCheckoutMethods, type StorePayments } from "./store-methods";

const wallet = { enabled: true, details: { holderName: "Omar", phone: "01012345678" } };

describe("cartHasDigitalProduct", () => {
  it("is true when any line is digital", () => {
    expect(cartHasDigitalProduct([{ product: { productType: "physical" } }, { product: { productType: "digital" } }])).toBe(true);
  });
  it("is false for physical lines, a missing type and an empty cart", () => {
    expect(cartHasDigitalProduct([{ product: { productType: "physical" } }, { product: { productType: null } }, { product: null }])).toBe(false);
    expect(cartHasDigitalProduct([])).toBe(false);
  });
});

describe("isPaymentMethodAllowedForCart", () => {
  it("refuses cash on delivery, alone or as a wallet remainder, for a cart with a digital product", () => {
    expect(isPaymentMethodAllowedForCart("cash_on_delivery", { hasDigital: true })).toBe(false);
    expect(isPaymentMethodAllowedForCart("wallet_cash_on_delivery", { hasDigital: true })).toBe(false);
  });
  it("keeps every other method for a digital cart", () => {
    for (const method of ["online_payment", "instapay", "vodafone_cash", "e_cash", "we_pay", "orange_cash", "wallet", "wallet_instapay"]) {
      expect(isPaymentMethodAllowedForCart(method, { hasDigital: true })).toBe(true);
    }
  });
  it("changes nothing for a physical-only cart", () => {
    expect(isPaymentMethodAllowedForCart("cash_on_delivery", { hasDigital: false })).toBe(true);
  });
  it("names COD methods only", () => {
    expect(isCashOnDeliveryMethod("cash_on_delivery")).toBe(true);
    expect(isCashOnDeliveryMethod("instapay")).toBe(false);
    expect(DIGITAL_NO_COD_ERROR).toBe("digitalNoCashOnDelivery");
  });
});

describe("allowedPaymentMethodsForCart", () => {
  const payments: StorePayments = {
    cod: { enabled: true, fee: 0, maxOrder: 5000, note: "Cash please" },
    vodafone_cash: wallet,
    defaultMethod: "cash_on_delivery",
  };
  const checkout = storefrontCheckoutMethods(payments, null, "EGP", { percent: 20 });

  it("returns the same object for a physical-only cart", () => {
    expect(checkout.deposit).toEqual({ percent: 20 });
    expect(allowedPaymentMethodsForCart(checkout, { hasDigital: false })).toBe(checkout);
  });

  it("removes COD, its deposit, note and maximum, and a COD default, for a digital cart", () => {
    const out = allowedPaymentMethodsForCart(checkout, { hasDigital: true });
    expect(out.methods).toEqual(["vodafone_cash"]);
    expect(out.deposit).toBeNull();
    expect(out.codMaxOrder).toBeNull();
    expect(out.codNote).toBeNull();
    expect(out.defaultMethod).toBeNull();
    expect(out.transfers.vodafone_cash).toEqual(checkout.transfers.vodafone_cash);
    // The input is not changed.
    expect(checkout.methods).toEqual(["cash_on_delivery", "vodafone_cash"]);
  });

  it("keeps a default that is not COD", () => {
    const withDefault = storefrontCheckoutMethods({ ...payments, defaultMethod: "vodafone_cash" });
    expect(allowedPaymentMethodsForCart(withDefault, { hasDigital: true }).defaultMethod).toBe("vodafone_cash");
  });

  it("leaves no method for a COD-only store", () => {
    const codOnly = storefrontCheckoutMethods({ cod: { enabled: true, fee: 0 } });
    expect(allowedPaymentMethodsForCart(codOnly, { hasDigital: true }).methods).toEqual([]);
  });
});
