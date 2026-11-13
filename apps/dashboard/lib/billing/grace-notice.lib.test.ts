import { describe, expect, it } from "vitest";
import { ORDERS_UNLOCKED, type OrderLock } from "@workspace/lib/billing/order-grace";
import { graceNoticeNeedsStoreCheck, showGraceNotice } from "./grace-notice.lib";

const grace = (firstOrderReceived: boolean): OrderLock => ({
  activated: false,
  ordersLocked: false,
  firstOrderId: firstOrderReceived ? "order-1" : null,
  pendingReview: false,
  grace: { endsAt: "2026-11-27T00:00:00Z", firstOrderReceived, endedBy: null },
});

describe("grace notice", () => {
  it("waits for a published store with a product", () => {
    expect(showGraceNotice(grace(false), false)).toBe(false);
    expect(showGraceNotice(grace(false), true)).toBe(true);
    expect(graceNoticeNeedsStoreCheck(grace(false))).toBe(true);
  });

  it("always shows once the first order arrived, without the store read", () => {
    expect(showGraceNotice(grace(true), false)).toBe(true);
    expect(graceNoticeNeedsStoreCheck(grace(true))).toBe(false);
  });

  it("never shows when activated, locked or outside a grace window", () => {
    expect(showGraceNotice(ORDERS_UNLOCKED, true)).toBe(false);
    expect(graceNoticeNeedsStoreCheck(ORDERS_UNLOCKED)).toBe(false);
    const locked: OrderLock = { ...grace(true), ordersLocked: true, grace: { endsAt: "2026-11-01T00:00:00Z", firstOrderReceived: true, endedBy: "days" } };
    expect(showGraceNotice(locked, true)).toBe(false);
    expect(graceNoticeNeedsStoreCheck(locked)).toBe(false);
    expect(showGraceNotice({ ...grace(false), grace: null }, true)).toBe(false);
  });
});
