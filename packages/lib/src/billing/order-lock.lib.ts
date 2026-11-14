import { isProActive } from "./billing.lib";

/**
 * Activation and the grace period before a top-up (ROADMAP.md F-68, F-84; owner
 * 2026-11-09, short window 2026-11-15). Three separate answers:
 *
 * - `activated`: one approved top-up, ever having a store wallet balance above
 *   zero (a gift, an admin credit), or active Pro. It is for good. Until then a
 *   Free seller has 20 AI requests a month and their campaign and win-back
 *   emails are held.
 * - `ordersLocked`: not activated AND the grace window is over. Orders, customers
 *   and sales totals are hidden then, except the seller's first order, which
 *   stays visible in full (`firstOrderId`). The storefront keeps selling.
 * - `storeOffline`: only for sellers who signed up on or after SHORT_GRACE_FROM.
 *   Not activated, the window's DAYS have run out (the second order alone never
 *   does it) and no manual top-up is waiting for review: every store of the
 *   seller shows the store-offline page and takes no new orders, like an
 *   unpublished store. Activation brings it back at once.
 *
 * The grace window starts at sign-up, never before ORDER_GRACE_START_FLOOR (so
 * every seller not activated on 2026-11-09 gets 14 days from then), and ends at
 * the earlier of its days later or the seller's second real order since it
 * started. Sellers created before SHORT_GRACE_FROM get ORDER_GRACE_DAYS (14) and
 * never go offline from this; sellers created on or after it get
 * ORDER_GRACE_DAYS_SHORT (7). Before the USD switch nothing applies.
 */
export const ORDER_GRACE_DAYS = 14;
/** The window of sellers created on or after SHORT_GRACE_FROM; when it runs out their stores go offline. */
export const ORDER_GRACE_DAYS_SHORT = 7;
/** 2026-11-09 00:00 Cairo: the owner's decision; nobody's grace starts earlier. */
export const ORDER_GRACE_START_FLOOR = "2026-11-09T00:00:00+02:00";
/**
 * Sellers created at or after this instant (Cairo) get the 7-day window and their
 * stores go offline when it runs out (owner, 2026-11-15). Move it to the deploy
 * date if the deploy is later, so nobody who signed up under the 14-day promise
 * is moved to the short rule.
 */
export const SHORT_GRACE_FROM = "2026-11-16T00:00:00+02:00";

const DAY_MS = 86_400_000;

export type OrderGrace = {
  /** ISO time the window closes (or closed): its days (14, or 7 from SHORT_GRACE_FROM) after its start, or the second order, whichever came first. */
  endsAt: string;
  /** A real order arrived inside the window, so the next one ends it. */
  firstOrderReceived: boolean;
  /** Why the window is over; null while it is open. */
  endedBy: "second_order" | "days" | null;
  /** Short-window sellers only: when their stores go offline unless they top up (the window's days end). Null for the others. */
  offlineAt: string | null;
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
  /** Every store of the seller is offline for billing: short-window seller, days over, not activated, no top-up in review. */
  storeOffline: boolean;
};

export const ORDERS_UNLOCKED: OrderLock = {
  activated: true,
  ordersLocked: false,
  firstOrderId: null,
  pendingReview: false,
  grace: null,
  storeOffline: false,
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

function validDate(value: string | null | undefined): Date | null {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
}

/** The seller signed up on or after SHORT_GRACE_FROM: 7 days, then the stores go offline. Unknown sign-up = the old rule. */
export function isShortGraceSeller(sellerCreatedAt: string | null | undefined): boolean {
  const created = validDate(sellerCreatedAt);
  return created !== null && created.getTime() >= new Date(SHORT_GRACE_FROM).getTime();
}

/** The length of this seller's grace window in days. */
export function orderGraceDays(sellerCreatedAt: string | null | undefined): number {
  return isShortGraceSeller(sellerCreatedAt) ? ORDER_GRACE_DAYS_SHORT : ORDER_GRACE_DAYS;
}

/** When the window's days end (whatever the orders), from sign-up and the rule. */
function graceDaysEnd(sellerCreatedAt: string | null | undefined): Date {
  return new Date(orderGraceStart(sellerCreatedAt).getTime() + orderGraceDays(sellerCreatedAt) * DAY_MS);
}

/**
 * Fast path for the storefront, from the sign-up time alone (no queries): false
 * means the seller's stores can't be offline for billing at `at`, so the
 * activation check can be skipped. True only for a short-window seller whose
 * days are over; then `getOrderLock(...).storeOffline` decides.
 */
export function storeMayBeBillingOffline(sellerCreatedAt: string | null | undefined, at: Date = new Date()): boolean {
  return isShortGraceSeller(sellerCreatedAt) && at.getTime() >= graceDaysEnd(sellerCreatedAt).getTime();
}

/** Whole days until a short-window seller's stores go offline, rounded up (0 once offline; 0 too without `offlineAt`). */
export function daysUntilOffline(grace: Pick<OrderGrace, "offlineAt">, at: Date = new Date()): number {
  if (!grace.offlineAt) return 0;
  return Math.max(0, Math.ceil((new Date(grace.offlineAt).getTime() - at.getTime()) / DAY_MS));
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
  const daysEnd = graceDaysEnd(input.seller?.createdAt);
  const short = isShortGraceSeller(input.seller?.createdAt);
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
    grace: {
      endsAt: endsAt.toISOString(),
      firstOrderReceived: orders.length > 0,
      endedBy,
      offlineAt: short ? daysEnd.toISOString() : null,
    },
    // Only the days take a store offline, never the second order; a top-up in review keeps it online.
    storeOffline: short && at >= daysEnd && !input.hasPendingManualTopUp,
  };
}
