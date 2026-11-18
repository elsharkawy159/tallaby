import { describe, expect, it } from "vitest";

import { isValidEasykashRef, readTallabyPaySettleTarget, tallabyPayTransactionId } from "./settle.lib";

const INTEGRATION = "44444444-4444-4444-8444-444444444444";
const SNAPSHOT = { feeBps: 300, holdDays: 0, termsVersion: "2026-11-18" };
const STORE = "22222222-2222-4222-8222-222222222222";

const orderMeta = (provider = "tallaby_pay", extra: Record<string, unknown> = {}) => ({
  paymentCollector: "tallaby",
  paymentGateway: { provider, integrationId: INTEGRATION },
  tallabyPay: SNAPSHOT,
  ...extra,
});

describe("readTallabyPaySettleTarget", () => {
  it("settles a storefront EGP order whose snapshot is Tallaby Pay, with the order's fee snapshot", () => {
    expect(readTallabyPaySettleTarget({ storeId: STORE, currency: "EGP", metadata: orderMeta() }, false)).toEqual({
      target: { purpose: "order", integrationId: INTEGRATION, snapshot: SNAPSHOT },
    });
  });

  it("treats a missing currency as EGP", () => {
    expect(readTallabyPaySettleTarget({ storeId: STORE, currency: null, metadata: orderMeta() }, false)).toHaveProperty("target");
  });

  it("reads a deposit's own gateway snapshot", () => {
    const metadata = {
      deposit: { gateway: { provider: "tallaby_pay", integrationId: INTEGRATION } },
      tallabyPay: { ...SNAPSHOT, feeBps: 500 },
    };
    expect(readTallabyPaySettleTarget({ storeId: STORE, currency: "EGP", metadata }, true)).toEqual({
      target: { purpose: "deposit", integrationId: INTEGRATION, snapshot: { ...SNAPSHOT, feeBps: 500 } },
    });
    // The same order read as a whole-order payment has no paymentGateway.
    expect(readTallabyPaySettleTarget({ storeId: STORE, currency: "EGP", metadata }, false)).toEqual({ skip: "not_tallaby_pay" });
  });

  it("ignores a marketplace order, a seller gateway order and a non-EGP order", () => {
    expect(readTallabyPaySettleTarget({ storeId: null, currency: "EGP", metadata: orderMeta() }, false)).toEqual({ skip: "not_store_order" });
    expect(readTallabyPaySettleTarget({ storeId: STORE, currency: "EGP", metadata: orderMeta("easykash") }, false)).toEqual({
      skip: "not_tallaby_pay",
    });
    expect(readTallabyPaySettleTarget({ storeId: STORE, currency: "EGP", metadata: null }, false)).toEqual({ skip: "not_tallaby_pay" });
    expect(readTallabyPaySettleTarget({ storeId: STORE, currency: "SAR", metadata: orderMeta() }, false)).toEqual({ skip: "not_egp" });
  });

  it("refuses a Tallaby Pay order without a valid fee snapshot", () => {
    const { tallabyPay: _omit, ...noSnapshot } = orderMeta();
    expect(readTallabyPaySettleTarget({ storeId: STORE, currency: "EGP", metadata: noSnapshot }, false)).toEqual({ skip: "no_snapshot" });
    const badFee = orderMeta("tallaby_pay", { tallabyPay: { ...SNAPSHOT, feeBps: 9_999 } });
    expect(readTallabyPaySettleTarget({ storeId: STORE, currency: "EGP", metadata: badFee }, false)).toEqual({ skip: "no_snapshot" });
  });
});

describe("isValidEasykashRef", () => {
  it("accepts 1–200 characters only", () => {
    expect(isValidEasykashRef("")).toBe(false);
    expect(isValidEasykashRef("1234567")).toBe(true);
    expect(isValidEasykashRef("x".repeat(200))).toBe(true);
    expect(isValidEasykashRef("x".repeat(201))).toBe(false);
  });
});

describe("tallabyPayTransactionId", () => {
  it("namespaces the EasyKash reference", () => {
    expect(tallabyPayTransactionId("98765")).toBe("tallaby_pay:98765");
  });
});
