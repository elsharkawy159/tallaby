import { describe, expect, it } from "vitest";
import { ORDERS_UNLOCKED, type OrderLock } from "@workspace/lib/billing/order-grace";
import { graceNoticeNeedsStoreCheck, showGraceNotice } from "./grace-notice.lib";

/** A seller who isn't activated: orders locked from the start (owner, 2026-11-16). */
const locked = (grace: Partial<NonNullable<OrderLock["grace"]>> = {}, over: Partial<OrderLock> = {}): OrderLock => ({
  activated: false,
  ordersLocked: true,
  firstOrderId: null,
  pendingReview: false,
  grace: { endsAt: "2026-11-27T00:00:00Z", firstOrderReceived: false, endedBy: null, offlineAt: null, ...grace },
  storeOffline: false,
  ...over,
});

describe("top-up notice", () => {
  it("waits for a published store with a product while the window is open and no order came", () => {
    expect(showGraceNotice(locked(), false)).toBe(false);
    expect(showGraceNotice(locked(), true)).toBe(true);
    expect(graceNoticeNeedsStoreCheck(locked())).toBe(true);
  });

  it("always shows once an order arrived, the window is over, a top-up is in review or the store is offline", () => {
    for (const lock of [
      locked({ firstOrderReceived: true }),
      locked({ endedBy: "days" }),
      locked({ endedBy: "second_order", firstOrderReceived: true }),
      locked({}, { pendingReview: true }),
      locked({ endedBy: "days", offlineAt: "2026-11-20T00:00:00Z" }, { storeOffline: true }),
    ]) {
      expect(showGraceNotice(lock, false)).toBe(true);
      expect(graceNoticeNeedsStoreCheck(lock)).toBe(false);
    }
  });

  it("never shows when activated or before the switch", () => {
    expect(showGraceNotice(ORDERS_UNLOCKED, true)).toBe(false);
    expect(graceNoticeNeedsStoreCheck(ORDERS_UNLOCKED)).toBe(false);
  });
});
