import { isProActive } from "./billing.lib";

/**
 * First top-up before orders (ROADMAP.md F-68, owner 2026-11-04). Orders still
 * arrive and checkout doesn't change; a seller who has never topped up just can't
 * see them yet. One approved top-up unlocks for good. Pro is exempt.
 */
export type OrderLock = {
  locked: boolean;
  /** A manual top-up is waiting for approval, so the message says it's in review. */
  pendingReview: boolean;
};

export const ORDERS_UNLOCKED: OrderLock = { locked: false, pendingReview: false };

export function orderLockState(input: {
  usdLive: boolean;
  seller: { plan: string | null; planExpiresAt: string | null; planGraceUntil: string | null } | null;
  hasTopUp: boolean;
  hasPendingManualTopUp: boolean;
  at?: Date;
}): OrderLock {
  // Before the switch nothing changes, and a deploy alone never hides orders.
  if (!input.usdLive || !input.seller) return ORDERS_UNLOCKED;
  if (isProActive(input.seller, input.at) || input.hasTopUp) return ORDERS_UNLOCKED;
  return { locked: true, pendingReview: input.hasPendingManualTopUp };
}
