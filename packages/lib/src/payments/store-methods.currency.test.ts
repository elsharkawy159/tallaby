import { describe, expect, it } from "vitest";
import {
  isMethodAllowedForCurrency,
  parseStorePayments,
  storefrontCheckoutMethods,
  storeProfilePaymentMethods,
  validateDefaultMethodChange,
} from "./store-methods";

const payments = {
  cod: { enabled: true, fee: 0, maxOrder: 500 },
  instapay: { enabled: true, details: { holderName: "Store Owner", ipa: "owner@instapay" } },
  vodafone_cash: { enabled: true, details: { holderName: "Store Owner", phone: "01012345678" } },
};
const gateway = { provider: "paymob", integrationId: "i1" } as never;

describe("payment methods by currency (F-61)", () => {
  it("offers everything in EGP", () => {
    const offered = storefrontCheckoutMethods(payments, gateway);
    expect(offered.methods).toEqual(["cash_on_delivery", "online_payment", "instapay", "vodafone_cash"]);
    expect(offered.gateway).toBe(gateway);
  });

  it("offers cash on delivery and InstaPay (for customers in Egypt) in another currency, never Egyptian wallets or Paymob", () => {
    const offered = storefrontCheckoutMethods(payments, gateway, "SAR");
    expect(offered).toMatchObject({ methods: ["cash_on_delivery", "instapay", "vodafone_cash"], gateway: null, codMaxOrder: 500 });
    expect(Object.keys(offered.transfers)).toEqual(["instapay", "vodafone_cash"]);
    expect(isMethodAllowedForCurrency("SAR", "instapay")).toBe(true);
    expect(isMethodAllowedForCurrency("SAR", "vodafone_cash")).toBe(true);
  });

  it("offers a gateway in every currency it charges in (Kashier abroad, Paymob EGP only)", () => {
    const kashier = { provider: "kashier", integrationId: "i1" } as never;
    const offered = storefrontCheckoutMethods(payments, kashier, "SAR");
    expect(offered).toMatchObject({ methods: ["cash_on_delivery", "online_payment", "instapay", "vodafone_cash"], gateway: kashier });
    expect(storefrontCheckoutMethods(payments, kashier, "USD").methods).toContain("online_payment");
    expect(isMethodAllowedForCurrency("SAR", "online_payment", "kashier")).toBe(true);
    expect(isMethodAllowedForCurrency("SAR", "online_payment", "paymob")).toBe(false);
    expect(isMethodAllowedForCurrency("SAR", "online_payment")).toBe(false);
    // Abroad the footer shows card logos only: Meeza and Egyptian wallets are EGP.
    expect(storeProfilePaymentMethods({ payments: { cod: { enabled: true, fee: 0 } }, currency: "SAR" }, kashier).map((m) => m.key)).toEqual([
      "cash_on_delivery",
      "visa",
      "mastercard",
    ]);
  });

  it("the footer shows the same list", () => {
    expect(storeProfilePaymentMethods({ payments, currency: "SAR" })).toEqual([{ key: "cash_on_delivery" }, { key: "instapay" }, { key: "vodafone_cash" }]);
    expect(storeProfilePaymentMethods({ payments }).map((m) => m.key)).toContain("instapay");
  });

  it("the footer shows the connected gateway as its card logos (and Kashier's wallets)", () => {
    const cod = { cod: { enabled: true, fee: 0 } };
    const kashier = { provider: "kashier", integrationId: "i1" } as never;
    expect(storeProfilePaymentMethods({ payments: cod }, kashier).map((m) => m.key)).toEqual([
      "cash_on_delivery",
      "visa",
      "mastercard",
      "meeza",
      "mobile_wallets",
    ]);
    expect(storeProfilePaymentMethods({ payments: cod }, gateway).map((m) => m.key)).toEqual(["cash_on_delivery", "visa", "mastercard", "meeza"]);
    // The seller's own wallet number already shows; no generic wallets logo beside it.
    expect(storeProfilePaymentMethods({ payments }, kashier).map((m) => m.key)).not.toContain("mobile_wallets");
    // No gateway, or a non-EGP store: no card logos.
    expect(storeProfilePaymentMethods({ payments: cod }).map((m) => m.key)).toEqual(["cash_on_delivery"]);
    expect(storeProfilePaymentMethods({ payments: cod, currency: "SAR" }, gateway).map((m) => m.key)).toEqual(["cash_on_delivery"]);
  });

  it("checkout starts on the seller's default only while the store offers it", () => {
    expect(storefrontCheckoutMethods({ ...payments, defaultMethod: "online_payment" }, gateway).defaultMethod).toBe("online_payment");
    expect(storefrontCheckoutMethods({ ...payments, defaultMethod: "online_payment" }).defaultMethod).toBeNull();
    expect(storefrontCheckoutMethods(payments, gateway).defaultMethod).toBeNull();
    expect(storefrontCheckoutMethods({ ...payments, defaultMethod: "vodafone_cash" }, null, "SAR").defaultMethod).toBe("vodafone_cash");
  });

  it("the default can be set only to an offered method, and cleared", () => {
    expect(validateDefaultMethodChange(payments, "online_payment", gateway)).toEqual({ success: true, data: { ...payments, defaultMethod: "online_payment" } });
    expect(validateDefaultMethodChange(payments, "online_payment", null)).toEqual({ success: false, error: "not_available" });
    expect(validateDefaultMethodChange(payments, "e_cash", gateway)).toEqual({ success: false, error: "not_available" });
    expect(validateDefaultMethodChange({ ...payments, defaultMethod: "instapay" }, null, null)).toEqual({ success: true, data: payments });
    // A saved default survives other method changes and parsing.
    expect(parseStorePayments({ ...payments, defaultMethod: "instapay" }).defaultMethod).toBe("instapay");
  });

  it("refuses anything else at placement", () => {
    for (const method of ["wallet", "wallet_instapay", "online_payment"]) {
      expect(isMethodAllowedForCurrency("SAR", method)).toBe(false);
      expect(isMethodAllowedForCurrency("EGP", method)).toBe(true);
    }
    expect(isMethodAllowedForCurrency("SAR", "cash_on_delivery")).toBe(true);
    expect(isMethodAllowedForCurrency("SAR", "seller_collected")).toBe(true);
    expect(isMethodAllowedForCurrency("SAR", "instapay")).toBe(true);
  });
});
