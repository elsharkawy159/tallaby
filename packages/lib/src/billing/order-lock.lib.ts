import { isProActive } from "./billing.lib";

/**
 * Activation and the grace period before a top-up (ROADMAP.md F-68, F-84; owner
 * 2026-11-09). Two separate answers:
 *
 * - `activated`: one approved top-up, ever having a store wallet balance above
 *   zero (a gift, an admin credit), or active Pro. It is for good. Until then a
 *   Free seller has 20 AI requests a month and their campaign and win-back
 *   emails are held. Nothing else waits for it: the store is public and takes
 *   real orders from day one.
 * - `ordersLocked`: not activated AND the grace window is over. Orders, customers
 *   and sales totals are hidden then, except the seller's first order, which
 *   stays visible in full (`firstOrderId`).
 *
 * The grace window starts at sign-up, never before ORDER_GRACE_START_FLOOR (so
 * every seller not activated on 2026-11-09 gets 14 days from then), and ends at
 * the earlier of ORDER_GRACE_DAYS later or the seller's second real order since
 * it started. Before the USD switch nothing applies.
 */
export const ORDER_GRACE_DAYS = 14;
/** 2026-11-09 00:00 Cairo: the owner's decision; nobody's grace starts earlier. */
export const ORDER_GRACE_START_FLOOR = "2026-11-09T00:00:00+02:00";

const DAY_MS = 86_400_000;

export type OrderGrace = {
  /** ISO time the window closes (or closed): 14 days after its start, or the second order, whichever came first. */
  endsAt: string;
  /** A real order arrived inside the window, so the next one ends it. */
  firstOrderReceived: boolean;
  /** Why the window is over; null while it is open. */
  endedBy: "second_order" | "days" | null;
};

export type OrderLock = {
  /** Activated (or the USD switch is off): full AI allowance, campaign and win-back emails. */
  activated: boolean;
  /** Orders, customers and sales totals hidden: not activated and the grace window is over. */
  ordersLocked: boolean;
  /** Not activated: the first real order of the window, which stays visible while orders are locked. */
  firstOrderId: string | null;
  /** A manual top-up is waiting for approval, so the message says it's in review. */
  pendingReview: boolean;
  /** Not activated: the grace window. Null once activated or before the USD switch. */
  grace: OrderGrace | null;
};

export const ORDERS_UNLOCKED: OrderLock = {
  activated: true,
  ordersLocked: false,
  firstOrderId: null,
  pendingReview: false,
  grace: null,
};

export type ActivationInput = {
  usdLive: boolean;
  seller: { plan: string | null; planExpiresAt: string | null; planGraceUntil: string | null } | null;
  hasTopUp: boolean;
  /** The balance is above zero now, or a USD ledger entry once left it above zero. */
  hasHadPositiveBalance: boolean;
  at?: Date;
};

/** Activated for good, or nothing applies (before the switch, or no seller row). */
export function isActivated(input: ActivationInput): boolean {
  if (!input.usdLive || !input.seller) return true;
  return isProActive(input.seller, input.at) || input.hasTopUp || input.hasHadPositiveBalance;
}

/** When a seller's grace window starts: sign-up, but never before ORDER_GRACE_START_FLOOR. */
export function orderGraceStart(sellerCreatedAt: string | null | undefined): Date {
  const floor = new Date(ORDER_GRACE_START_FLOOR);
  const created = sellerCreatedAt ? new Date(sellerCreatedAt) : null;
  return created && Number.isFinite(created.getTime()) && created > floor ? created : floor;
}

/** Whole days left in an open window, rounded up (0 once it is over). */
export function graceDaysLeft(grace: Pick<OrderGrace, "endsAt" | "endedBy">, at: Date = new Date()): number {
  if (grace.endedBy) return 0;
  return Math.max(0, Math.ceil((new Date(grace.endsAt).getTime() - at.getTime()) / DAY_MS));
}

export function orderLockState(
  input: ActivationInput & {
    seller: (ActivationInput["seller"] & { createdAt?: string | null }) | null;
    hasPendingManualTopUp: boolean;
    /** The seller's first two real orders since the grace start, oldest first (orderGraceStart). */
    firstOrders: { id: string; createdAt: string }[];
  },
): OrderLock {
  // Before the switch nothing changes, and a deploy alone never hides orders.
  if (isActivated(input)) return ORDERS_UNLOCKED;
  const at = input.at ?? new Date();
  const start = orderGraceStart(input.seller?.createdAt);
  const daysEnd = new Date(start.getTime() + ORDER_GRACE_DAYS * DAY_MS);
  // Orders from before the start never count (the caller only passes later ones; checked again here).
  const orders = input.firstOrders.filter((order) => new Date(order.createdAt) >= start);
  const second = orders[1] ? new Date(orders[1].createdAt) : null;

  const endedBy: OrderGrace["endedBy"] = second && second < daysEnd ? "second_order" : at >= daysEnd ? "days" : null;
  const endsAt = endedBy === "second_order" ? second! : daysEnd;
  return {
    activated: false,
    ordersLocked: endedBy !== null,
    firstOrderId: orders[0]?.id ?? null,
    pendingReview: input.hasPendingManualTopUp,
    grace: { endsAt: endsAt.toISOString(), firstOrderReceived: orders.length > 0, endedBy },
  };
}
