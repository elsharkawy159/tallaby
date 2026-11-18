import { describe, expect, it } from "vitest";

import {
  TALLABY_PAY_ENTRY_KINDS,
  balanceViolation,
  mayPushAvailableNegative,
  tallabyPayEntryProblem,
  type TallabyPayEntryShape,
} from "./ledger.lib";

const SALE = "11111111-1111-4111-8111-111111111111";
const PAYOUT = "22222222-2222-4222-8222-222222222222";

function shape(over: Partial<TallabyPayEntryShape>): TallabyPayEntryShape {
  return { kind: "sale", pending: 0, available: 0, reserved: 0, saleId: null, payoutId: null, reason: null, ...over };
}

describe("tallabyPayEntryProblem (mirrors tallaby_pay_entries_deltas_check)", () => {
  it.each<[string, Partial<TallabyPayEntryShape>]>([
    ["sale", { kind: "sale", pending: 9_700, saleId: SALE }],
    ["release", { kind: "release", pending: -9_700, available: 9_700, saleId: SALE }],
    ["refund before release", { kind: "refund", pending: -9_700, saleId: SALE }],
    ["refund after release", { kind: "refund", available: -9_700, saleId: SALE }],
    ["payout_reserve", { kind: "payout_reserve", reserved: 50_000, payoutId: PAYOUT }],
    ["payout_unreserve", { kind: "payout_unreserve", reserved: -50_000, payoutId: PAYOUT }],
    ["payout", { kind: "payout", available: -50_000, reserved: -50_000, payoutId: PAYOUT }],
    ["payout_reversal", { kind: "payout_reversal", available: 50_000, payoutId: PAYOUT }],
    ["adjustment", { kind: "adjustment", available: -1_500, reason: "chargeback fee" }],
  ])("accepts a well-formed %s", (_, over) => {
    expect(tallabyPayEntryProblem(shape(over))).toBeNull();
  });

  it.each<[string, Partial<TallabyPayEntryShape>]>([
    ["an unknown kind", { kind: "fee" as never, pending: 1, saleId: SALE }],
    ["a debit sale", { kind: "sale", pending: -1, saleId: SALE }],
    ["a sale touching available", { kind: "sale", pending: 1, available: 1, saleId: SALE }],
    ["a sale without its sale row", { kind: "sale", pending: 1 }],
    ["a release that does not balance", { kind: "release", pending: -100, available: 99, saleId: SALE }],
    ["a refund from both buckets", { kind: "refund", pending: -1, available: -1, saleId: SALE }],
    ["a refund that credits", { kind: "refund", available: 1, saleId: SALE }],
    ["a payout without its payout row", { kind: "payout", available: -1, reserved: -1 }],
    ["a payout that leaves the reservation", { kind: "payout", available: -100, reserved: -50, payoutId: PAYOUT }],
    ["a reserve that moves available", { kind: "payout_reserve", available: -1, reserved: 1, payoutId: PAYOUT }],
    ["an adjustment without a reason", { kind: "adjustment", available: 1 }],
    ["an adjustment with a blank reason", { kind: "adjustment", available: 1, reason: "  " }],
    ["an adjustment of reserved", { kind: "adjustment", reserved: 1, reason: "x" }],
    ["an all-zero entry", { kind: "adjustment", reason: "x" }],
    ["a fractional piastre", { kind: "sale", pending: 1.5, saleId: SALE }],
  ])("refuses %s", (_, over) => {
    expect(tallabyPayEntryProblem(shape(over))).toEqual(expect.any(String));
  });

  it("knows every kind the database accepts", () => {
    expect([...TALLABY_PAY_ENTRY_KINDS].sort()).toEqual(
      ["adjustment", "payout", "payout_reserve", "payout_reversal", "payout_unreserve", "refund", "release", "sale"].sort(),
    );
  });
});

describe("balanceViolation (mirrors the guarded UPDATE)", () => {
  const wallet = { pending: 9_700, available: 0, reserved: 0 };

  it("allows a move that keeps every bucket valid", () => {
    expect(balanceViolation(wallet, { pending: -9_700, available: 9_700, reserved: 0 }, "release")).toBeNull();
  });

  it("never lets pending go below zero, refunds included", () => {
    expect(balanceViolation(wallet, { pending: -9_701, available: 0, reserved: 0 }, "refund")).toBe("pending");
  });

  it("never lets reserved go below zero", () => {
    expect(balanceViolation(wallet, { pending: 0, available: 0, reserved: -1 }, "payout_unreserve")).toBe("reserved");
  });

  it("lets only a refund or an adjustment push available below reserved", () => {
    const after = { pending: 0, available: 100, reserved: 0 };
    expect(balanceViolation(after, { pending: 0, available: -9_700, reserved: 0 }, "refund")).toBeNull();
    expect(balanceViolation(after, { pending: 0, available: -9_700, reserved: 0 }, "adjustment")).toBeNull();
    expect(balanceViolation(after, { pending: 0, available: -101, reserved: -101 }, "payout")).toBe("reserved");
    expect(balanceViolation(after, { pending: 0, available: 0, reserved: 101 }, "payout_reserve")).toBe("available");
  });

  it("does not block a credit on a wallet that is already negative", () => {
    const negative = { pending: 0, available: -9_700, reserved: 0 };
    expect(balanceViolation(negative, { pending: 5_000, available: 0, reserved: 0 }, "sale")).toBeNull();
    const pendingSale = { pending: 5_000, available: -9_700, reserved: 0 };
    expect(balanceViolation(pendingSale, { pending: -5_000, available: 5_000, reserved: 0 }, "release")).toBeNull();
  });

  it("refuses a payout larger than what is available", () => {
    const held = { pending: 0, available: 400, reserved: 500 };
    expect(balanceViolation(held, { pending: 0, available: -500, reserved: -500 }, "payout")).toBe("available");
  });

  it("names refund and adjustment as the only kinds that may push available negative", () => {
    expect(TALLABY_PAY_ENTRY_KINDS.filter(mayPushAvailableNegative)).toEqual(["refund", "adjustment"]);
  });
});
