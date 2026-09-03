import { describe, expect, it } from "vitest";

import {
  PAYOUT_ELIGIBLE_ROLES,
  WALLET_TOP_UP_MAX,
  WALLET_TOP_UP_MIN,
  buildTopUpReference,
  canRequestPayout,
  payoutStatusBadgeVariant,
  splitSignedAmount,
} from "./wallet.lib";
import { payoutFormSchema, topUpFormSchema } from "./wallet.dto";
import type { WalletUserRole } from "./wallet.types";

/**
 * Payout eligibility is the one authorization decision the wallet UI reflects,
 * so it is extracted into a pure function and pinned here for every role the
 * `user_role` enum can hold. The server action calls this same function before
 * any payout write — the hidden button is not the control.
 */
describe("canRequestPayout", () => {
  const allRoles: WalletUserRole[] = [
    "customer",
    "seller",
    "admin",
    "support",
    "driver",
    "marketing",
  ];

  it("allows riders/drivers and marketing users", () => {
    expect(canRequestPayout("driver")).toBe(true);
    expect(canRequestPayout("marketing")).toBe(true);
  });

  it("refuses customers, sellers, support and admins", () => {
    expect(canRequestPayout("customer")).toBe(false);
    expect(canRequestPayout("seller")).toBe(false);
    expect(canRequestPayout("support")).toBe(false);
    expect(canRequestPayout("admin")).toBe(false);
  });

  it("refuses a missing or unknown role rather than defaulting to allow", () => {
    expect(canRequestPayout(null)).toBe(false);
    expect(canRequestPayout(undefined)).toBe(false);
    expect(canRequestPayout("nonsense" as WalletUserRole)).toBe(false);
  });

  it("permits exactly the roles listed in PAYOUT_ELIGIBLE_ROLES", () => {
    const permitted = allRoles.filter(canRequestPayout);
    expect(permitted.sort()).toEqual([...PAYOUT_ELIGIBLE_ROLES].sort());
  });
});

describe("top-up amount validation", () => {
  it("accepts an amount inside the configured bounds", () => {
    expect(topUpFormSchema.safeParse({ amount: 100 }).success).toBe(true);
    expect(topUpFormSchema.safeParse({ amount: WALLET_TOP_UP_MIN }).success).toBe(
      true
    );
    expect(topUpFormSchema.safeParse({ amount: WALLET_TOP_UP_MAX }).success).toBe(
      true
    );
  });

  it("rejects amounts outside the bounds and sub-cent precision", () => {
    expect(
      topUpFormSchema.safeParse({ amount: WALLET_TOP_UP_MIN - 1 }).success
    ).toBe(false);
    expect(
      topUpFormSchema.safeParse({ amount: WALLET_TOP_UP_MAX + 1 }).success
    ).toBe(false);
    expect(topUpFormSchema.safeParse({ amount: 10.005 }).success).toBe(false);
    expect(topUpFormSchema.safeParse({ amount: -50 }).success).toBe(false);
    expect(topUpFormSchema.safeParse({ amount: Number.NaN }).success).toBe(false);
  });
});

describe("payout request validation", () => {
  const valid = {
    amount: 200,
    method: "bank_transfer" as const,
    accountName: "Test User",
    accountNumber: "EG380019000500000000263180002",
  };

  it("accepts a complete request", () => {
    expect(payoutFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an unknown payout method", () => {
    expect(
      payoutFormSchema.safeParse({ ...valid, method: "cash_in_hand" }).success
    ).toBe(false);
  });

  it("rejects a request below the minimum or with missing account details", () => {
    expect(payoutFormSchema.safeParse({ ...valid, amount: 1 }).success).toBe(
      false
    );
    expect(
      payoutFormSchema.safeParse({ ...valid, accountNumber: "" }).success
    ).toBe(false);
  });
});

describe("presentation helpers", () => {
  it("splits a signed ledger amount into direction and magnitude", () => {
    expect(splitSignedAmount("-30.50")).toEqual({
      isNegative: true,
      magnitude: 30.5,
    });
    expect(splitSignedAmount("100.00")).toEqual({
      isNegative: false,
      magnitude: 100,
    });
  });

  it("marks terminal failure states destructively", () => {
    expect(payoutStatusBadgeVariant("rejected")).toBe("destructive");
    expect(payoutStatusBadgeVariant("failed")).toBe("destructive");
    expect(payoutStatusBadgeVariant("completed")).toBe("default");
    expect(payoutStatusBadgeVariant("pending")).toBe("secondary");
  });

  it("namespaces the provider reference so it cannot collide with an order id", () => {
    const orderLikeId = "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0";
    expect(buildTopUpReference(orderLikeId)).toBe(`topup_${orderLikeId}`);
    expect(buildTopUpReference(orderLikeId)).not.toBe(orderLikeId);
  });
});
