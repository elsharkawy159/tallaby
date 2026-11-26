/**
 * Fee on delivery (owner, 2026-11-26; PLAN.md §13.3): pure rules for the
 * orders that were never marked delivered. With the `fee_on_delivery` switch
 * on, an order that is still open 14 days after it was created pays its fee
 * through the daily job (aged-order-fees.ts), so never marking an order
 * delivered can't skip the fee. No I/O here.
 */

/** Days after `orders.created_at` (UTC) when an open order pays. */
export const AGED_FEE_DAYS = 14;

/** An order in one of these never pays through the job (it pays only if one of its parts is delivered). */
export const AGED_FEE_CLOSED_ORDER_STATUSES = ["payment_processing", "cancelled", "returned", "refunded"] as const;

/** A seller's line in one of these doesn't count towards that seller's open part. */
export const AGED_FEE_CLOSED_LINE_STATUSES = ["cancelled", "returned", "refunded"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Orders created at or before this moment are old enough to pay. */
export function agedFeeCutoff(now: Date): Date {
  return new Date(now.getTime() - AGED_FEE_DAYS * DAY_MS);
}

type AgedOrder = {
  status?: string | null;
  paymentStatus?: string | null;
  metadata?: unknown;
};

/** A manual order whose link the customer never confirmed: it has not become a real order (F-05). */
function awaitingCustomer(metadata: unknown): boolean {
  const manual = (metadata as { manualOrder?: { awaitingCustomer?: unknown } } | null)?.manualOrder;
  return manual?.awaitingCustomer === true;
}

/**
 * Whether the order as a whole can still pay through the job: not cancelled,
 * returned or refunded (order status or card refund), not an unpaid card
 * order, and not an unconfirmed manual link. Today's placement charge skips
 * the last two as well, so the job never charges an order placement wouldn't.
 */
export function orderOpenForAgedFee(order: AgedOrder): boolean {
  if ((AGED_FEE_CLOSED_ORDER_STATUSES as readonly string[]).includes(order.status ?? "pending")) return false;
  if (order.paymentStatus === "refunded") return false;
  return !awaitingCustomer(order.metadata);
}
