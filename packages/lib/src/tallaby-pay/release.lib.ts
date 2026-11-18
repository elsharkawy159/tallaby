/**
 * Tallaby Pay release and refund rules, pure (ROADMAP.md F-100d; design §5
 * and the owner's answers in §14, 2026-11-18).
 *
 * - Release: a `pending` sale with no refund request moves to `available`
 *   once its order is `delivered` and `delivered_at + hold_days` has passed.
 *   Hold days are 0 (owner), so that is the moment of delivery; the sale's own
 *   snapshot keeps a later non-zero hold working.
 * - Refund by Tallaby (admin): only while the order was never delivered. Once
 *   it was, the seller refunds the customer himself and Tallaby changes
 *   nothing (owner, 2026-11-18).
 *
 * Times are epoch milliseconds; `now` comes from the database clock.
 */

const DAY_MS = 86_400_000;

export interface TallabyPayReleaseState {
  saleStatus: string;
  refundState: string | null;
  /** Null when the order row was deleted. */
  orderStatus: string | null;
  deliveredAtMs: number | null;
  holdDays: number;
  nowMs: number;
}

export type TallabyPayReleaseBlock =
  | "not_pending"
  | "refund_requested"
  | "no_order"
  | "not_delivered"
  | "hold";

/** When the net becomes available: delivery + the sale's hold days. */
export function tallabyPayReleaseAtMs(deliveredAtMs: number, holdDays: number): number {
  return deliveredAtMs + Math.max(0, Math.trunc(holdDays)) * DAY_MS;
}

/** Why a sale can't be released now, or null when it can. */
export function tallabyPayReleaseBlock(s: TallabyPayReleaseState): TallabyPayReleaseBlock | null {
  if (s.saleStatus !== "pending") return "not_pending";
  if (s.refundState !== null) return "refund_requested";
  if (s.orderStatus === null) return "no_order";
  if (s.orderStatus !== "delivered" || s.deliveredAtMs === null) return "not_delivered";
  if (tallabyPayReleaseAtMs(s.deliveredAtMs, s.holdDays) > s.nowMs) return "hold";
  return null;
}

export interface TallabyPayRefundState {
  saleStatus: string;
  /** Null when the order row was deleted. */
  orderStatus: string | null;
  orderDeliveredAt: string | null;
}

export type TallabyPayRefundBlock = "already_refunded" | "delivered";

/**
 * Why Tallaby can't refund this sale, or null. A released sale, or one whose
 * order was ever delivered (even if returned or cancelled since), is the
 * seller's to refund.
 */
export function tallabyPayRefundBlock(s: TallabyPayRefundState): TallabyPayRefundBlock | null {
  if (s.saleStatus === "refunded") return "already_refunded";
  if (s.saleStatus !== "pending") return "delivered";
  if (s.orderStatus === "delivered" || s.orderDeliveredAt !== null) return "delivered";
  return null;
}

/** `tallaby_pay_sales.refund_reason` codes written by the system (design §5). */
export const TALLABY_PAY_REFUND_REASONS = {
  sellerCancelled: "seller_cancelled",
  paidAfterCancel: "paid_after_cancel",
} as const;
