import type { OrderLock } from "@workspace/lib/billing/order-grace";

/**
 * When the "N days left to top up" notice shows (ROADMAP.md F-84; owner
 * 2026-11-13). Display only: the grace window, activation and the order lock
 * are unchanged (`@workspace/lib/billing/order-lock`).
 *
 * The notice waits until the seller has a published store with at least one
 * product in it, so a new seller first builds the store without a top-up nag.
 * Once the first order arrived in the window, it shows regardless. Pure.
 */

/** The lock is in the open grace window (not activated, not locked). */
function inOpenGrace(lock: OrderLock): lock is OrderLock & { grace: NonNullable<OrderLock["grace"]> } {
  return !lock.activated && !lock.ordersLocked && lock.grace !== null;
}

/** Whether the "published store with a product" read is needed at all (skip it for everyone else). */
export function graceNoticeNeedsStoreCheck(lock: OrderLock): boolean {
  return inOpenGrace(lock) && !lock.grace.firstOrderReceived;
}

export function showGraceNotice(lock: OrderLock, hasLiveStoreWithProduct: boolean): boolean {
  if (!inOpenGrace(lock)) return false;
  return lock.grace.firstOrderReceived || hasLiveStoreWithProduct;
}
