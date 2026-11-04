import { describe, expect, it } from "vitest";
import { isMethodAllowedForCurrency, storefrontCheckoutMethods, storeProfilePaymentMethods } from "./store-methods";

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

  it("offers only cash on delivery in another currency, keeping its max order", () => {
    const offered = storefrontCheckoutMethods(payments, gateway, "SAR");
    expect(offered).toMatchObject({ methods: ["cash_on_delivery"], gateway: null, transfers: {}, codMaxOrder: 500 });
  });

  it("the footer shows the same list", () => {
    expect(storeProfilePaymentMethods({ payments, currency: "SAR" })).toEqual([{ key: "cash_on_delivery" }]);
    expect(storeProfilePaymentMethods({ payments }).map((m) => m.key)).toContain("instapay");
  });

  it("refuses anything else at placement", () => {
    for (const method of ["wallet", "wallet_instapay", "online_payment", "instapay", "vodafone_cash", "e_cash", "we_pay", "orange_cash"]) {
      expect(isMethodAllowedForCurrency("SAR", method)).toBe(false);
      expect(isMethodAllowedForCurrency("EGP", method)).toBe(true);
    }
    expect(isMethodAllowedForCurrency("SAR", "cash_on_delivery")).toBe(true);
    expect(isMethodAllowedForCurrency("SAR", "seller_collected")).toBe(true);
  });
});
