import { describe, expect, it } from "vitest";
import {
  adminStoreActionSchema,
  decimalToPiastres,
  isAdminWriteRole,
  piastresToDecimal,
  sellerOverrideSchema,
  walletAdjustmentSchema,
} from "./admin.lib";

const sellerId = "11111111-1111-4111-8111-111111111111";
const storeId = "22222222-2222-4222-8222-222222222222";
const key = "33333333-3333-4333-8333-333333333333";

describe("decimalToPiastres / piastresToDecimal", () => {
  it("parses exact decimals without floating point", () => {
    expect(decimalToPiastres("12.5")).toBe(1250);
    expect(decimalToPiastres("-0.01")).toBe(-1);
    expect(decimalToPiastres("0.10")).toBe(10);
    expect(decimalToPiastres("99999999.99")).toBe(9_999_999_999);
    expect(decimalToPiastres("-0")).toBe(0);
  });

  it("rejects malformed amounts", () => {
    for (const bad of ["", "1.234", "1e3", "abc", "1,000", "--1", ".5", "123456789"]) {
      expect(decimalToPiastres(bad)).toBeNull();
    }
  });

  it("formats piastres as 2-dp strings", () => {
    expect(piastresToDecimal(1250)).toBe("12.50");
    expect(piastresToDecimal(-1)).toBe("-0.01");
    expect(piastresToDecimal(0)).toBe("0.00");
  });
});

describe("isAdminWriteRole", () => {
  it("allows admins only", () => {
    expect(isAdminWriteRole("admin")).toBe(true);
    expect(isAdminWriteRole("super_admin")).toBe(true);
    for (const role of ["seller", "customer", "support", "moderator", "", null, undefined]) {
      expect(isAdminWriteRole(role)).toBe(false);
    }
  });
});

describe("sellerOverrideSchema", () => {
  const reason = "Owner approved";

  it("accepts each override with a reason", () => {
    const inputs = [
      { action: "set_plan", sellerId, reason, plan: "free" },
      { action: "set_store_limit", sellerId, reason, maxStoresOverride: 5 },
      { action: "set_store_limit", sellerId, reason, maxStoresOverride: null },
      { action: "set_fee_plan", sellerId, reason, feePlan: "flat_5" },
      { action: "extend_trial", sellerId, reason, endsAt: "2026-12-01T00:00:00.000Z" },
      { action: "grant_trial", sellerId, reason },
      { action: "revoke_trial", sellerId, reason },
      { action: "set_commission_exempt", sellerId, reason, exempt: true },
      { action: "set_negative_limit", sellerId, reason, negativeLimit: null },
    ];
    for (const input of inputs) expect(sellerOverrideSchema.safeParse(input).success).toBe(true);
  });

  it("normalises the negative limit to 2 dp", () => {
    const parsed = sellerOverrideSchema.parse({ action: "set_negative_limit", sellerId, reason, negativeLimit: "250" });
    expect(parsed).toMatchObject({ negativeLimit: "250.00" });
  });

  it("requires a real reason and rejects unknown plans, fields and ids", () => {
    const bad = [
      { action: "set_plan", sellerId, reason: "  ", plan: "free" },
      { action: "set_plan", sellerId, plan: "free" },
      { action: "set_plan", sellerId, reason, plan: "pro" },
      { action: "set_fee_plan", sellerId, reason, feePlan: "five_percent" },
      { action: "set_store_limit", sellerId, reason, maxStoresOverride: 1.5 },
      { action: "set_store_limit", sellerId, reason, maxStoresOverride: 101 },
      { action: "set_store_limit", sellerId, reason, maxStoresOverride: -1 },
      { action: "extend_trial", sellerId, reason, endsAt: "tomorrow" },
      { action: "set_negative_limit", sellerId, reason, negativeLimit: "-5" },
      { action: "set_negative_limit", sellerId, reason, negativeLimit: "100001" },
      { action: "grant_trial", sellerId: "not-a-uuid", reason },
      { action: "grant_trial", sellerId, reason, feeTrialStartedAt: null },
      { action: "set_balance", sellerId, reason },
      { action: "set_plan", sellerId, reason: "x".repeat(501), plan: "free" },
    ];
    for (const input of bad) expect(sellerOverrideSchema.safeParse(input).success).toBe(false);
  });
});

describe("adminStoreActionSchema", () => {
  it("accepts the three store actions and rejects others", () => {
    for (const action of ["unpublish_store", "suspend_store", "unsuspend_store"]) {
      expect(adminStoreActionSchema.safeParse({ action, sellerId, storeId, reason: "Policy breach" }).success).toBe(true);
    }
    expect(adminStoreActionSchema.safeParse({ action: "delete_store", sellerId, storeId, reason: "x y z" }).success).toBe(false);
    expect(adminStoreActionSchema.safeParse({ action: "suspend_store", sellerId, storeId }).success).toBe(false);
  });
});

describe("walletAdjustmentSchema", () => {
  const base = { sellerId, reason: "Goodwill credit", idempotencyKey: key };

  it("normalises signed amounts", () => {
    expect(walletAdjustmentSchema.parse({ ...base, amount: "50" }).amount).toBe("50.00");
    expect(walletAdjustmentSchema.parse({ ...base, amount: " -12.5 ", storeId }).amount).toBe("-12.50");
  });

  it("rejects zero, too large, malformed amounts and a missing key or reason", () => {
    for (const amount of ["0", "0.00", "-0", "100000.01", "-100000.01", "1.234", "1e2", ""]) {
      expect(walletAdjustmentSchema.safeParse({ ...base, amount }).success).toBe(false);
    }
    expect(walletAdjustmentSchema.safeParse({ ...base, amount: "100000" }).success).toBe(true);
    expect(walletAdjustmentSchema.safeParse({ ...base, amount: "5", idempotencyKey: "abc" }).success).toBe(false);
    expect(walletAdjustmentSchema.safeParse({ ...base, amount: "5", reason: "" }).success).toBe(false);
    expect(walletAdjustmentSchema.safeParse({ ...base, amount: "5", type: "sale" }).success).toBe(false);
  });
});
