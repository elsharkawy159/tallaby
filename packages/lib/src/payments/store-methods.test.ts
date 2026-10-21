import { describe, expect, it } from "vitest";
import {
  STORE_PAYMENT_METHODS,
  defaultStorePayments,
  ibanChecksumValid,
  isStorefrontCheckoutMethodAllowed,
  maskPaymentDetails,
  operatorHint,
  parseStorePayments,
  storeShippingCollector,
  storefrontCheckoutMethods,
  validateMethodChange,
} from "./store-methods";

describe("storefrontCheckoutMethods", () => {
  const wallet = { enabled: true, details: { holderName: "Omar", phone: "01012345678" } };

  it("offers only COD for a COD-only store", () => {
    expect(storefrontCheckoutMethods(defaultStorePayments())).toEqual({
      methods: ["cash_on_delivery"],
      codMaxOrder: null,
      codNote: null,
    });
  });

  it("maps enabled wallets and InstaPay to the existing manual methods; WE Pay and Orange show nothing", () => {
    const out = storefrontCheckoutMethods({
      cod: { enabled: false, fee: 0, maxOrder: 500 },
      vodafone_cash: wallet,
      we_pay: wallet,
      orange_cash: wallet,
      instapay: { enabled: true, details: { holderName: "Omar", ipa: "omar@instapay" } },
    });
    expect(out.methods).toEqual(["instapay", "vodafone_cash"]);
    expect(out.codMaxOrder).toBeNull();
  });

  it("refuses methods the store has not enabled, and COD above the max order", () => {
    const checkout = storefrontCheckoutMethods({ cod: { enabled: true, fee: 0, maxOrder: 1000 } });
    expect(isStorefrontCheckoutMethodAllowed(checkout, "cash_on_delivery", 1000)).toBe(true);
    expect(isStorefrontCheckoutMethodAllowed(checkout, "cash_on_delivery", 1000.01)).toBe(false);
    for (const m of ["instapay", "online_payment", "wallet", "wallet_instapay"]) {
      expect(isStorefrontCheckoutMethodAllowed(checkout, m, 10), m).toBe(false);
    }
  });
});

describe("catalog", () => {
  it("has COD live and on by default, wallets and InstaPay live, the rest soon", () => {
    const byKey = Object.fromEntries(STORE_PAYMENT_METHODS.map((m) => [m.key, m]));
    expect(byKey.cod).toMatchObject({ status: "live", collector: "delivery" });
    for (const key of ["vodafone_cash", "e_cash", "we_pay", "orange_cash", "instapay"]) {
      expect(byKey[key], key).toMatchObject({ status: "live", collector: "seller" });
    }
    for (const key of ["card", "fawry", "installments", "apple_google_pay", "bank_transfer", "tallaby_wallet"]) {
      expect(byKey[key]?.status, key).toBe("soon");
    }
    expect(defaultStorePayments()).toEqual({ cod: { enabled: true, fee: 0 } });
  });
});

describe("IBAN checksum", () => {
  it("accepts a valid Egyptian IBAN and rejects a wrong check digit", () => {
    expect(ibanChecksumValid("EG380019000500000000263180002")).toBe(true);
    expect(ibanChecksumValid("EG390019000500000000263180002")).toBe(false);
  });
});

describe("operatorHint", () => {
  it("suggests the usual operator by prefix (hint only)", () => {
    expect(operatorHint("01012345678")).toBe("vodafone_cash");
    expect(operatorHint("01112345678")).toBe("e_cash");
    expect(operatorHint("01212345678")).toBe("orange_cash");
    expect(operatorHint("01512345678")).toBe("we_pay");
    expect(operatorHint("123")).toBeNull();
  });
});

describe("validateMethodChange", () => {
  const base = defaultStorePayments();

  it("enables a wallet only with a valid number and holder name", () => {
    const ok = validateMethodChange(base, "vodafone_cash", {
      enabled: true,
      details: { holderName: "Omar Ali", phone: "01012345678" },
    });
    expect(ok.success).toBe(true);
    const bad = validateMethodChange(base, "vodafone_cash", { enabled: true, details: { holderName: "Omar", phone: "123" } });
    expect(bad).toMatchObject({ success: false, error: "invalid_details" });
    const missing = validateMethodChange(base, "vodafone_cash", { enabled: true });
    expect(missing).toMatchObject({ success: false, error: "invalid_details" });
  });

  it("sets and clears the COD order limit", () => {
    const set = validateMethodChange(base, "cod", { enabled: true, maxOrder: 5000 });
    expect(set).toMatchObject({ success: true, data: { cod: { maxOrder: 5000 } } });
    if (!set.success) return;
    const cleared = validateMethodChange(set.data, "cod", { enabled: true, maxOrder: null });
    expect(cleared.success && cleared.data.cod?.maxOrder).toBeUndefined();
    expect(validateMethodChange(base, "cod", { enabled: true, maxOrder: -1 }).success).toBe(false);
  });

  it("requires at least one InstaPay identifier and validates each", () => {
    expect(validateMethodChange(base, "instapay", { enabled: true, details: { holderName: "Omar" } }).success).toBe(false);
    expect(
      validateMethodChange(base, "instapay", { enabled: true, details: { holderName: "Omar", ipa: "omar@instapay" } }).success,
    ).toBe(true);
    expect(
      validateMethodChange(base, "instapay", { enabled: true, details: { holderName: "Omar", iban: "EG390019000500000000263180002" } })
        .success,
    ).toBe(false);
    expect(
      validateMethodChange(base, "instapay", {
        enabled: true,
        details: { holderName: "Omar", ipa: "omar@instapay", paymentLink: "https://evil.example/pay" },
      }).success,
    ).toBe(false);
    expect(
      validateMethodChange(base, "instapay", {
        enabled: true,
        details: { holderName: "Omar", ipa: "omar@instapay", paymentLink: "https://ipn.eg/S/omar/instapay/abc" },
      }).success,
    ).toBe(true);
  });

  it("never lets the last enabled method be switched off", () => {
    expect(validateMethodChange(base, "cod", { enabled: false })).toMatchObject({ success: false, error: "last_method" });
    const two = validateMethodChange(base, "vodafone_cash", {
      enabled: true,
      details: { holderName: "Omar", phone: "01012345678" },
    });
    if (!two.success) throw new Error("setup");
    expect(validateMethodChange(two.data, "cod", { enabled: false }).success).toBe(true);
  });

  it("refuses soon and unknown methods", () => {
    expect(validateMethodChange(base, "card", { enabled: true })).toMatchObject({ success: false, error: "not_available" });
    expect(validateMethodChange(base, "bitcoin" as never, { enabled: true })).toMatchObject({ success: false, error: "not_available" });
  });

  it("validates the COD fee and keeps details when only toggling", () => {
    expect(validateMethodChange(base, "cod", { enabled: true, fee: -5 }).success).toBe(false);
    expect(validateMethodChange(base, "cod", { enabled: true, fee: 15 })).toMatchObject({
      success: true,
      data: { cod: { enabled: true, fee: 15 } },
    });
    const withWallet = validateMethodChange(base, "e_cash", { enabled: true, details: { holderName: "Omar", phone: "01112345678" } });
    if (!withWallet.success) throw new Error("setup");
    const off = validateMethodChange(withWallet.data, "e_cash", { enabled: false });
    expect(off).toMatchObject({ success: true, data: { e_cash: { enabled: false, details: { phone: "01112345678" } } } });
  });
});

describe("parseStorePayments", () => {
  it("falls back to the defaults for missing or broken settings", () => {
    expect(parseStorePayments(undefined)).toEqual(defaultStorePayments());
    expect(parseStorePayments({ cod: "yes" })).toEqual(defaultStorePayments());
  });
});

describe("maskPaymentDetails", () => {
  it("masks numbers for the audit log", () => {
    expect(maskPaymentDetails({ holderName: "Omar", phone: "01012345678" })).toEqual({ holderName: "Omar", phone: "•••5678" });
    expect(maskPaymentDetails({ holderName: "Omar", iban: "EG380019000500000000263180002", ipa: "omar@instapay" })).toEqual({
      holderName: "Omar",
      iban: "•••0002",
      ipa: "•••apay",
    });
  });
});

describe("storeShippingCollector", () => {
  it("COD is collected by the store's own rider", () => {
    expect(storeShippingCollector("cash_on_delivery")).toBe("seller");
  });
  it("online payment and the customer wallet are Tallaby's", () => {
    expect(storeShippingCollector("online_payment")).toBe("tallaby");
    expect(storeShippingCollector("wallet")).toBe("tallaby");
    expect(storeShippingCollector("card")).toBe("tallaby");
  });
  it("seller receiving methods are the seller's", () => {
    for (const key of ["instapay", "vodafone_cash", "e_cash", "we_pay", "orange_cash"]) {
      expect(storeShippingCollector(key)).toBe("seller");
    }
  });
  it("anything unknown is the seller's", () => {
    expect(storeShippingCollector("")).toBe("seller");
    expect(storeShippingCollector("wallet_partial:cash_on_delivery")).toBe("seller");
    expect(storeShippingCollector("something_new")).toBe("seller");
  });
});
