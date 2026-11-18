import { describe, expect, it } from "vitest";
import { readPublicDetails } from "../integrations/validate";
import { INTEGRATIONS } from "../integrations/registry";
import {
  STORE_GATEWAY_PROVIDERS,
  TALLABY_PAY_TERMS_VERSION,
  buildGatewayReference,
  buildTallabyPayReference,
  gatewayCollector,
  isCompleteSecret,
  parseGatewayReference,
  parseOrderGatewayReference,
  parseTallabyPayReference,
  readEasykashInquiryTarget,
  readGatewayConfig,
  readOrderDepositGateway,
  readOrderGateway,
  readOrderTallabyPay,
  storeGatewayOrderMetadata,
  tallabyPayCallbackUrl,
  validateGatewayInput,
} from "./store-gateways.lib";
import {
  footerPaymentKeys,
  gatewaySupportsCurrency,
  isMethodAllowedForCurrency,
  storefrontCheckoutMethods,
} from "./store-methods";

/** Tallaby Pay gateway plumbing (ROADMAP.md F-100b, design §2–§3). */

const ORDER = "3f2b8c1e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";
const INTEGRATION = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const TALLABY_PAY = { provider: "tallaby_pay" as const, integrationId: INTEGRATION };

describe("gatewayCollector", () => {
  it("is Tallaby for Tallaby Pay and the seller for every seller gateway", () => {
    expect(gatewayCollector("tallaby_pay")).toBe("tallaby");
    for (const provider of ["paymob", "kashier", "easykash"] as const) expect(gatewayCollector(provider)).toBe("seller");
    for (const provider of STORE_GATEWAY_PROVIDERS) expect(["seller", "tallaby"]).toContain(gatewayCollector(provider));
  });
});

describe("Tallaby Pay references (tpay_)", () => {
  it("builds tpay_<orderId>_<suffix>, unique per attempt, and parses the order back", () => {
    const a = buildTallabyPayReference(ORDER);
    const b = buildTallabyPayReference(ORDER);
    expect(a).toMatch(new RegExp(`^tpay_${ORDER}_[0-9a-z]+$`));
    expect(a).not.toBe(b);
    expect(parseTallabyPayReference(a)).toBe(ORDER);
    // EasyKash's customerReference limit is an E2E check (docs/easykash.md §1.10); keep it short.
    expect(a.length).toBeLessThanOrEqual(60);
  });

  it("never mixes Tallaby Pay and seller gateway references", () => {
    const seller = buildGatewayReference(ORDER);
    const tpay = buildTallabyPayReference(ORDER);
    expect(parseTallabyPayReference(seller)).toBeNull();
    expect(parseGatewayReference(tpay)).toBeNull();
    expect(parseOrderGatewayReference("tallaby_pay", tpay)).toBe(ORDER);
    expect(parseOrderGatewayReference("tallaby_pay", seller)).toBeNull();
    expect(parseOrderGatewayReference("easykash", seller)).toBe(ORDER);
    expect(parseOrderGatewayReference("easykash", tpay)).toBeNull();
    for (const bad of [null, undefined, "", "tpay_", "tpay_x_1", `TPAY_${ORDER}_abc`]) expect(parseTallabyPayReference(bad)).toBeNull();
  });
});

describe("order snapshots", () => {
  it("readOrderGateway accepts tallaby_pay, so Tallaby's own Kashier and Paymob actions refuse these orders", () => {
    const lastReference = buildTallabyPayReference(ORDER);
    expect(readOrderGateway({ paymentGateway: { ...TALLABY_PAY, lastReference } })).toEqual({ ...TALLABY_PAY, lastReference });
    // A seller-gateway reference is not a Tallaby Pay attempt.
    expect(readOrderGateway({ paymentGateway: { ...TALLABY_PAY, lastReference: buildGatewayReference(ORDER) } })).toEqual(TALLABY_PAY);
    expect(readOrderDepositGateway({ deposit: { gateway: TALLABY_PAY } })).toEqual(TALLABY_PAY);
    // EasyKash's seller voucher lookup never uses a Tallaby Pay snapshot.
    expect(readEasykashInquiryTarget(ORDER, { paymentGateway: { ...TALLABY_PAY, lastReference } }, "order")).toBeNull();
  });

  it("records the collector, gateway and fee snapshot at placement (design §3)", () => {
    expect(storeGatewayOrderMetadata(TALLABY_PAY, { feeBps: 300, holdDays: 0 })).toEqual({
      paymentCollector: "tallaby",
      paymentGateway: TALLABY_PAY,
      tallabyPay: { feeBps: 300, holdDays: 0, termsVersion: TALLABY_PAY_TERMS_VERSION },
    });
    expect(() => storeGatewayOrderMetadata(TALLABY_PAY, null)).toThrow();
  });

  it("keeps seller-gateway orders exactly as before", () => {
    const kashier = { provider: "kashier" as const, integrationId: INTEGRATION };
    expect(storeGatewayOrderMetadata(kashier, null)).toEqual({ paymentCollector: "seller", paymentGateway: kashier });
    expect(storeGatewayOrderMetadata(kashier, { feeBps: 300, holdDays: 7 })).toEqual({ paymentCollector: "seller", paymentGateway: kashier });
  });

  it("reads the fee snapshot back and rejects anything out of range", () => {
    expect(readOrderTallabyPay({ tallabyPay: { feeBps: 300, holdDays: 0, termsVersion: "2026-11-18" } })).toEqual({
      feeBps: 300,
      holdDays: 0,
      termsVersion: "2026-11-18",
    });
    for (const tallabyPay of [
      { feeBps: 2001, holdDays: 0, termsVersion: "v" },
      { feeBps: 1.5, holdDays: 0, termsVersion: "v" },
      { feeBps: 300, holdDays: -1, termsVersion: "v" },
      { feeBps: 300, holdDays: 0, termsVersion: "" },
      { feeBps: "300", holdDays: 0, termsVersion: "v" },
    ]) {
      expect(readOrderTallabyPay({ tallabyPay })).toBeNull();
    }
    expect(readOrderTallabyPay(null)).toBeNull();
    expect(readOrderTallabyPay({})).toBeNull();
  });
});

describe("Tallaby Pay has no keys", () => {
  it("refuses credentials and never treats a row as holding a secret", () => {
    expect(validateGatewayInput("tallaby_pay", { apiKey: "abcdef", hmacSecret: "0123456789abcdef0123" })).toEqual({
      success: false,
      error: "no_credentials",
    });
    expect(isCompleteSecret("tallaby_pay", { apiKey: "x", hmacSecret: "y" })).toBe(false);
  });

  it("is a live, keyless payments entry in the registry", () => {
    expect(INTEGRATIONS.tallaby_pay).toMatchObject({ category: "payments", kind: "settings", availability: "available" });
  });

  it("stores a config readGatewayConfig accepts, and shows only its public details", () => {
    const config = { mode: "live", termsVersion: TALLABY_PAY_TERMS_VERSION, termsAcceptedAt: "2026-11-18T10:00:00Z", enabledAt: "2026-11-18T10:00:00Z", secret: "nope" };
    expect(readGatewayConfig(config)).toMatchObject({ mode: "live" });
    expect(readPublicDetails("tallaby_pay", config)).toEqual({
      mode: "live",
      termsVersion: TALLABY_PAY_TERMS_VERSION,
      termsAcceptedAt: "2026-11-18T10:00:00Z",
      enabledAt: "2026-11-18T10:00:00Z",
    });
  });

  it("names the one platform callback URL, https only", () => {
    expect(tallabyPayCallbackUrl("https://api.tallaby.com/")).toBe("https://api.tallaby.com/api/webhooks/tallaby-pay/easykash");
    expect(tallabyPayCallbackUrl("http://api.tallaby.com")).toBeNull();
    expect(tallabyPayCallbackUrl("")).toBeNull();
  });
});

describe("currency rule and checkout", () => {
  it("is EGP stores only", () => {
    expect(gatewaySupportsCurrency("tallaby_pay", "EGP")).toBe(true);
    expect(gatewaySupportsCurrency("tallaby_pay", "SAR")).toBe(false);
    expect(isMethodAllowedForCurrency("SAR", "online_payment", "tallaby_pay")).toBe(false);
    expect(isMethodAllowedForCurrency("EGP", "online_payment", "tallaby_pay")).toBe(true);
  });

  it("offers online payment on an EGP store and hides it abroad", () => {
    const payments = { cod: { enabled: true, fee: 0 } };
    const egp = storefrontCheckoutMethods(payments, TALLABY_PAY, "EGP");
    expect(egp.methods).toEqual(["cash_on_delivery", "online_payment"]);
    expect(egp.gateway).toEqual(TALLABY_PAY);
    expect(footerPaymentKeys(egp)).toEqual(["cash_on_delivery", "visa", "mastercard", "meeza", "mobile_wallets"]);
    const sar = storefrontCheckoutMethods(payments, TALLABY_PAY, "SAR");
    expect(sar.methods).toEqual(["cash_on_delivery"]);
    expect(sar.gateway).toBeNull();
  });
});
