import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildTransactionHmacPayload } from "../paymob/paymob.lib";
import type { PaymobTransactionObj } from "../paymob/paymob.types";
import { buildWebhookSignaturePayload } from "../kashier/kashier.lib";
import {
  buildGatewayReference,
  isCompleteSecret,
  paymobKeyMode,
  parseGatewayReference,
  parseKashierWebhook,
  parsePaymobWebhook,
  readGatewayConfig,
  readOrderGateway,
  storeGatewayReturnPath,
  storeGatewayWebhookUrl,
  toPiastres,
  validateGatewayInput,
  type KashierSecret,
  type PaymobSecret,
} from "./store-gateways.lib";
import { isStorefrontCheckoutMethodAllowed, storeShippingCollector, storefrontCheckoutMethods } from "./store-methods";

const ORDER = "3f2b8c1e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";
const INTEGRATION = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

const paymobInput = {
  secretKey: "egy_sk_test_abc123def456ghi",
  publicKey: "egy_pk_test_zyx987wvu654",
  hmacSecret: "ABCDEF0123456789ABCDEF",
  cardIntegrationId: "4567890",
  walletIntegrationId: "",
};

const kashierInput = {
  merchantId: "mid-12345-678",
  paymentApiKey: "11111111-2222-3333-4444-555555555555",
  secretKey: "secret$key$value$0123456789",
  mode: "test",
};

describe("validateGatewayInput — Paymob", () => {
  it("accepts a test key pair and reads the mode and key hint", () => {
    const out = validateGatewayInput("paymob", paymobInput);
    expect(out).toMatchObject({ success: true, mode: "test", keyHint: "6ghi" });
    if (out.success) {
      expect(out.secret).toEqual({
        secretKey: paymobInput.secretKey,
        publicKey: paymobInput.publicKey,
        hmacSecret: paymobInput.hmacSecret,
        cardIntegrationId: 4567890,
      });
    }
  });

  it("accepts older sk_/pk_ keys and a wallet integration id", () => {
    const out = validateGatewayInput("paymob", {
      ...paymobInput,
      secretKey: "sk_live_0123456789abcdef",
      publicKey: "pk_live_0123456789abcdef",
      walletIntegrationId: 4567891,
    });
    expect(out).toMatchObject({ success: true, mode: "live", secret: { walletIntegrationId: 4567891 } });
  });

  it.each([
    [{ secretKey: "pk_test_0123456789" }, "invalid_secret_key"],
    [{ publicKey: "nope" }, "invalid_public_key"],
    [{ publicKey: "egy_pk_live_0123456789" }, "mode_mismatch"],
    [{ hmacSecret: "short" }, "invalid_hmac_secret"],
    [{ cardIntegrationId: "abc" }, "invalid_integration_id"],
    [{ walletIntegrationId: "4567890" }, "invalid_integration_id"],
  ])("refuses %o", (patch, error) => {
    expect(validateGatewayInput("paymob", { ...paymobInput, ...patch })).toEqual({ success: false, error });
  });

  it("keeps saved keys for fields left blank", () => {
    const saved: PaymobSecret = {
      secretKey: paymobInput.secretKey,
      publicKey: paymobInput.publicKey,
      hmacSecret: paymobInput.hmacSecret,
      cardIntegrationId: 111,
    };
    const out = validateGatewayInput("paymob", { secretKey: "", publicKey: "", hmacSecret: "", cardIntegrationId: 222 }, saved);
    expect(out).toMatchObject({ success: true, secret: { ...saved, cardIntegrationId: 222 } });
  });

  it("reads the mode from the key prefix only", () => {
    expect(paymobKeyMode("egy_sk_live_abcdefgh12", "secret")).toBe("live");
    expect(paymobKeyMode("egy_sk_live_abcdefgh12", "public")).toBeNull();
  });
});

describe("validateGatewayInput — Kashier", () => {
  it("accepts and upper-cases the merchant id", () => {
    expect(validateGatewayInput("kashier", kashierInput)).toMatchObject({
      success: true,
      mode: "test",
      secret: { merchantId: "MID-12345-678" },
    });
  });

  it.each([
    [{ merchantId: "12345" }, "invalid_merchant_id"],
    [{ paymentApiKey: "x" }, "invalid_api_key"],
    [{ secretKey: "has space in it 123456" }, "invalid_secret_key"],
    [{ mode: "prod" }, "invalid_mode"],
  ])("refuses %o", (patch, error) => {
    expect(validateGatewayInput("kashier", { ...kashierInput, ...patch })).toEqual({ success: false, error });
  });
});

describe("stored rows", () => {
  it("checks a decrypted secret has every field", () => {
    expect(isCompleteSecret("kashier", { merchantId: "MID-1-1", paymentApiKey: "a", secretKey: "b" })).toBe(true);
    expect(isCompleteSecret("paymob", { secretKey: "a", publicKey: "b", hmacSecret: "c" })).toBe(false);
  });

  it("reads only the public config", () => {
    expect(readGatewayConfig({ mode: "live", keyHint: "abcd1234", secretKey: "never" })).toEqual({ mode: "live", keyHint: "1234" });
    expect(readGatewayConfig({ keyHint: "x" })).toBeNull();
  });

  it("reads the order's gateway snapshot", () => {
    expect(readOrderGateway({ paymentGateway: { provider: "kashier", integrationId: INTEGRATION } })).toEqual({
      provider: "kashier",
      integrationId: INTEGRATION,
    });
    expect(readOrderGateway({ paymentGateway: { provider: "stripe", integrationId: INTEGRATION } })).toBeNull();
    expect(readOrderGateway({ paymentGateway: { provider: "paymob", integrationId: "x" } })).toBeNull();
    expect(readOrderGateway(null)).toBeNull();
  });
});

describe("references and URLs", () => {
  it("makes a unique reference per attempt that carries the order id", () => {
    const a = buildGatewayReference(ORDER);
    expect(a).not.toBe(buildGatewayReference(ORDER));
    expect(parseGatewayReference(a)).toBe(ORDER);
    expect(parseGatewayReference("tallaby_check_abc")).toBeNull();
  });

  it("builds the webhook URL only for a public https backend", () => {
    expect(storeGatewayWebhookUrl(INTEGRATION, "https://api.tallaby.com/")).toBe(
      `https://api.tallaby.com/api/webhooks/store-payments/${INTEGRATION}`,
    );
    expect(storeGatewayWebhookUrl(INTEGRATION, "http://localhost:3004")).toBeNull();
    expect(storeGatewayWebhookUrl(INTEGRATION, "")).toBeNull();
    expect(storeGatewayReturnPath(ORDER)).toBe(`/api/store-payments/return?order=${ORDER}`);
  });

  it("converts EGP to integer piastres", () => {
    expect(toPiastres("100.10")).toBe(10010);
    expect(toPiastres(19.99)).toBe(1999);
  });
});

describe("parsePaymobWebhook", () => {
  const secret: PaymobSecret = { ...validatePaymob(), hmacSecret: "seller-hmac-secret-0123" };
  const obj: PaymobTransactionObj = {
    id: 987654,
    amount_cents: 45000,
    created_at: "2026-10-30T12:00:00",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    integration_id: 4567890,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: 555 },
    owner: 42,
    pending: false,
    source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
    success: true,
    merchant_order_id: `${ORDER}_abc123`,
  };
  const sign = (o: PaymobTransactionObj, key = secret.hmacSecret) =>
    createHmac("sha512", key).update(buildTransactionHmacPayload(o)).digest("hex");

  it("turns a signed success into a payment event", () => {
    expect(parsePaymobWebhook({ body: { type: "TRANSACTION", obj }, query: { hmac: sign(obj) }, headers: {} }, secret)).toEqual({
      kind: "event",
      event: { transactionId: "paymob:987654", reference: `${ORDER}_abc123`, status: "SUCCESS", amountPiastres: 45000, currency: "EGP" },
    });
  });

  it("refuses an HMAC made with another store's secret", () => {
    const req = { body: { type: "TRANSACTION", obj }, query: { hmac: sign(obj, "another-store-secret-000") }, headers: {} };
    expect(parsePaymobWebhook(req, secret)).toEqual({ kind: "invalid_signature" });
  });

  it("reads pending and failed, and ignores refunds", () => {
    const pending = { ...obj, success: false, pending: true };
    const failed = { ...obj, success: false };
    const refund = { ...obj, is_refunded: true };
    const parse = (o: PaymobTransactionObj) => parsePaymobWebhook({ body: { type: "TRANSACTION", obj: o }, query: { hmac: sign(o) }, headers: {} }, secret);
    expect(parse(pending)).toMatchObject({ event: { status: "PENDING" } });
    expect(parse(failed)).toMatchObject({ event: { status: "FAILURE" } });
    expect(parse(refund)).toEqual({ kind: "ignored" });
  });

  function validatePaymob(): PaymobSecret {
    const out = validateGatewayInput("paymob", paymobInput);
    if (!out.success) throw new Error("fixture");
    return out.secret as PaymobSecret;
  }
});

describe("parseKashierWebhook", () => {
  const secret: KashierSecret = { merchantId: "MID-1-1", paymentApiKey: "seller-payment-api-key", secretKey: "s" };
  const data = {
    merchantOrderId: `${ORDER}_xyz`,
    transactionId: "TX-1",
    status: "SUCCESS",
    amount: "450.00",
    currency: "EGP",
    signatureKeys: ["amount", "currency", "merchantOrderId", "status", "transactionId"],
  };
  const sign = (d: Record<string, unknown>, key = secret.paymentApiKey) =>
    createHmac("sha256", key).update(buildWebhookSignaturePayload(d, d.signatureKeys as string[])).digest("hex");

  it("turns a signed pay event into a payment event", () => {
    expect(parseKashierWebhook({ body: { event: "pay", data }, query: {}, headers: { "x-kashier-signature": sign(data) } }, secret)).toEqual({
      kind: "event",
      event: { transactionId: "kashier:TX-1", reference: `${ORDER}_xyz`, status: "SUCCESS", amountPiastres: 45000, currency: "EGP" },
    });
  });

  it("refuses another key's signature and ignores refunds", () => {
    const forged = { body: { event: "pay", data }, query: {}, headers: { "x-kashier-signature": sign(data, "other-key") } };
    expect(parseKashierWebhook(forged, secret)).toEqual({ kind: "invalid_signature" });
    const refund = { body: { event: "refund", data }, query: {}, headers: { "x-kashier-signature": sign(data) } };
    expect(parseKashierWebhook(refund, secret)).toEqual({ kind: "ignored" });
  });
});

describe("storefront checkout with a seller gateway", () => {
  const gateway = { provider: "paymob" as const, integrationId: INTEGRATION };

  it("offers card payment only when the store has a connected gateway", () => {
    expect(storefrontCheckoutMethods({ cod: { enabled: true, fee: 0 } }).methods).toEqual(["cash_on_delivery"]);
    const withGateway = storefrontCheckoutMethods({ cod: { enabled: true, fee: 0 } }, gateway);
    expect(withGateway.methods).toEqual(["cash_on_delivery", "online_payment"]);
    expect(withGateway.gateway).toEqual(gateway);
    expect(isStorefrontCheckoutMethodAllowed(withGateway, "online_payment", 999)).toBe(true);
  });

  it("still counts Tallaby's own card checkout as Tallaby-collected", () => {
    // place-order overrides this to `seller` for seller-gateway orders.
    expect(storeShippingCollector("online_payment")).toBe("tallaby");
  });
});
