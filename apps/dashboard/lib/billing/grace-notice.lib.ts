import type { OrderLock } from "@workspace/lib/billing/order-grace";

/**
 * When the home's top-up notice shows (ROADMAP.md F-84; owner 2026-11-13 and
 * 2026-11-16). Display only: activation and the order lock are unchanged
 * (`@workspace/lib/billing/order-lock`).
 *
 * Orders are locked from the start for a seller who isn't activated. While the
 * grace window is still open and no order has arrived, the notice waits until
 * the seller has a published store with at least one product in it, so a new
 * seller first builds the store without a top-up nag. It shows regardless once
 * an order arrived, the window is over, a top-up is in review or the store is
 * offline. Pure.
 */

/** Whether the "published store with a product" read is needed at all (skip it for everyone else). */
export function graceNoticeNeedsStoreCheck(lock: OrderLock): boolean {
  return (
    lock.ordersLocked &&
    !lock.pendingReview &&
    !lock.storeOffline &&
    lock.grace !== null &&
    lock.grace.endedBy === null &&
    !lock.grace.firstOrderReceived
  );
}

export function showGraceNotice(lock: OrderLock, hasLiveStoreWithProduct: boolean): boolean {
  if (!lock.ordersLocked) return false;
  return !graceNoticeNeedsStoreCheck(lock) || hasLiveStoreWithProduct;
}
