import { describe, expect, it } from "vitest";

import { tallabyPayRefundBlock, tallabyPayReleaseAtMs, tallabyPayReleaseBlock, type TallabyPayReleaseState } from "./release.lib";

const DAY = 86_400_000;
const delivered = Date.UTC(2026, 10, 18, 12, 0, 0);

const base: TallabyPayReleaseState = {
  saleStatus: "pending",
  refundState: null,
  orderStatus: "delivered",
  deliveredAtMs: delivered,
  holdDays: 0,
  nowMs: delivered,
};

describe("tallabyPayReleaseBlock", () => {
  it("releases at the moment of delivery with 0 hold days (owner, 2026-11-18)", () => {
    expect(tallabyPayReleaseBlock(base)).toBeNull();
  });

  it("releases only a delivered order", () => {
    for (const orderStatus of ["confirmed", "out_for_delivery", "returned", "cancelled", "refunded"]) {
      expect(tallabyPayReleaseBlock({ ...base, orderStatus })).toBe("not_delivered");
    }
    expect(tallabyPayReleaseBlock({ ...base, deliveredAtMs: null })).toBe("not_delivered");
    expect(tallabyPayReleaseBlock({ ...base, orderStatus: null })).toBe("no_order");
  });

  it("never releases a sale with a refund request, or one already moved", () => {
    expect(tallabyPayReleaseBlock({ ...base, refundState: "requested" })).toBe("refund_requested");
    expect(tallabyPayReleaseBlock({ ...base, refundState: "declined" })).toBe("refund_requested");
    expect(tallabyPayReleaseBlock({ ...base, saleStatus: "available" })).toBe("not_pending");
    expect(tallabyPayReleaseBlock({ ...base, saleStatus: "refunded" })).toBe("not_pending");
  });

  it("keeps a future non-zero hold working", () => {
    expect(tallabyPayReleaseBlock({ ...base, holdDays: 7, nowMs: delivered + 7 * DAY - 1 })).toBe("hold");
    expect(tallabyPayReleaseBlock({ ...base, holdDays: 7, nowMs: delivered + 7 * DAY })).toBeNull();
    expect(tallabyPayReleaseAtMs(delivered, 7)).toBe(delivered + 7 * DAY);
    expect(tallabyPayReleaseAtMs(delivered, -3)).toBe(delivered);
  });
});

describe("tallabyPayRefundBlock", () => {
  it("allows a refund only while the order was never delivered", () => {
    expect(tallabyPayRefundBlock({ saleStatus: "pending", orderStatus: "confirmed", orderDeliveredAt: null })).toBeNull();
    expect(tallabyPayRefundBlock({ saleStatus: "pending", orderStatus: "cancelled", orderDeliveredAt: null })).toBeNull();
    expect(tallabyPayRefundBlock({ saleStatus: "pending", orderStatus: null, orderDeliveredAt: null })).toBeNull();
  });

  it("after delivery Tallaby changes nothing, even if the order was returned or cancelled since", () => {
    expect(tallabyPayRefundBlock({ saleStatus: "pending", orderStatus: "delivered", orderDeliveredAt: null })).toBe("delivered");
    const at = "2026-11-18 12:00:00+00";
    expect(tallabyPayRefundBlock({ saleStatus: "pending", orderStatus: "returned", orderDeliveredAt: at })).toBe("delivered");
    expect(tallabyPayRefundBlock({ saleStatus: "available", orderStatus: "cancelled", orderDeliveredAt: at })).toBe("delivered");
  });

  it("a refunded sale is refunded once", () => {
    expect(tallabyPayRefundBlock({ saleStatus: "refunded", orderStatus: "cancelled", orderDeliveredAt: null })).toBe("already_refunded");
  });
});
