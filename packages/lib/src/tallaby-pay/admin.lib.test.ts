import { describe, expect, it } from "vitest";
import {
  adjustmentPiastres,
  likePattern,
  parseAdminDay,
  parseAdminPage,
  parseAdminSearch,
  parseDateRange,
  parseSaleFilter,
  parseWalletFilter,
  tallabyPayAdjustmentInputSchema,
  tallabyPayDeclineBlock,
  tallabyPayQueueCount,
  tallabyPaySettingsInputSchema,
} from "./admin.lib";

const UUID = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";

describe("tallabyPaySettingsInputSchema", () => {
  const ok = { feeBps: 300, holdDays: 0, minPayout: "500", live: false, reason: "Owner approved" };

  it("parses the minimum to piastres and keeps the rest", () => {
    expect(tallabyPaySettingsInputSchema.parse(ok)).toEqual({ ...ok, minPayout: 50_000 });
    expect(tallabyPaySettingsInputSchema.parse({ ...ok, minPayout: "٢٥٠.٥" }).minPayout).toBe(25_050);
    expect(tallabyPaySettingsInputSchema.parse({ ...ok, feeBps: "275", holdDays: "٧" })).toMatchObject({ feeBps: 275, holdDays: 7 });
  });

  it("refuses values the database CHECKs refuse", () => {
    for (const bad of [
      { feeBps: 2001 },
      { feeBps: -1 },
      { feeBps: 2.5 },
      { feeBps: "" },
      { holdDays: " " },
      { holdDays: 61 },
      { minPayout: "0.50" },
      { minPayout: "1e3" },
      { reason: "ok" },
      { live: "yes" },
    ]) {
      expect(tallabyPaySettingsInputSchema.safeParse({ ...ok, ...bad }).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

describe("tallabyPayAdjustmentInputSchema", () => {
  const ok = { walletId: UUID, key: UUID, direction: "debit", amount: "25.50", reason: "Chargeback fee" };

  it("gives the sign from the direction, never from the amount", () => {
    const parsed = tallabyPayAdjustmentInputSchema.parse(ok);
    expect(parsed.amount).toBe(2_550);
    expect(adjustmentPiastres(parsed)).toBe(-2_550);
    expect(adjustmentPiastres({ direction: "credit", amount: 100 })).toBe(100);
    expect(tallabyPayAdjustmentInputSchema.safeParse({ ...ok, amount: "-25" }).success).toBe(false);
  });

  it("needs an amount above zero, a reason and uuids", () => {
    expect(tallabyPayAdjustmentInputSchema.safeParse({ ...ok, amount: "0" }).success).toBe(false);
    expect(tallabyPayAdjustmentInputSchema.safeParse({ ...ok, reason: " " }).success).toBe(false);
    expect(tallabyPayAdjustmentInputSchema.safeParse({ ...ok, key: "1" }).success).toBe(false);
    expect(tallabyPayAdjustmentInputSchema.safeParse({ ...ok, direction: "both" }).success).toBe(false);
  });
});

describe("filters", () => {
  it("accepts only real calendar days and swaps a reversed range", () => {
    expect(parseAdminDay("2026-11-18")).toBe("2026-11-18");
    expect(parseAdminDay("2026-02-30")).toBeNull();
    expect(parseAdminDay("2026-11-18'; drop")).toBeNull();
    expect(parseDateRange({ from: "2026-11-30", to: "2026-11-01" })).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(parseDateRange({})).toEqual({ from: null, to: null });
  });

  it("falls back to safe defaults", () => {
    expect(parseSaleFilter("refund_requested")).toBe("refund_requested");
    expect(parseSaleFilter("drop")).toBe("all");
    expect(parseWalletFilter("frozen")).toBe("frozen");
    expect(parseWalletFilter(undefined)).toBe("all");
    expect(parseAdminPage("3")).toBe(3);
    expect(parseAdminPage("0")).toBe(1);
    expect(parseAdminPage("1.5")).toBe(1);
    expect(parseAdminPage("99999")).toBe(1);
    expect(parseAdminSearch("  nour   shop ")).toBe("nour shop");
    expect(parseAdminSearch("   ")).toBeNull();
    expect(parseAdminSearch("x".repeat(200))).toHaveLength(80);
  });

  it("escapes LIKE wildcards", () => {
    expect(likePattern("50%_off\\")).toBe(String.raw`%50\%\_off\\%`);
  });

  it("sums the queue, ignoring bad numbers", () => {
    expect(tallabyPayQueueCount({ openPayouts: 2, refunds: 1, kyc: 3 })).toBe(6);
    expect(tallabyPayQueueCount({ openPayouts: Number.NaN, refunds: -1, kyc: 1 })).toBe(1);
  });
});

describe("tallabyPayDeclineBlock", () => {
  const open = { saleStatus: "pending", refundState: "requested", refundReason: "seller_cancelled" };

  it("allows an open seller request", () => {
    expect(tallabyPayDeclineBlock(open)).toBeNull();
    expect(tallabyPayDeclineBlock({ ...open, refundReason: "The customer changed their mind" })).toBeNull();
    expect(tallabyPayDeclineBlock({ ...open, refundReason: null })).toBeNull();
  });

  it("never declines a payment made after the cancel", () => {
    expect(tallabyPayDeclineBlock({ ...open, refundReason: "paid_after_cancel" })).toBe("must_refund");
  });

  it("refuses a sale with no open request or already refunded", () => {
    expect(tallabyPayDeclineBlock({ ...open, refundState: null })).toBe("not_requested");
    expect(tallabyPayDeclineBlock({ ...open, refundState: "declined" })).toBe("not_requested");
    expect(tallabyPayDeclineBlock({ ...open, saleStatus: "available" })).toBe("not_requested");
    expect(tallabyPayDeclineBlock({ ...open, saleStatus: "refunded", refundState: null })).toBe("already_refunded");
  });
});
