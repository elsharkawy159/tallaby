import type { TallabyPaySaleView } from "@workspace/lib/tallaby-pay/server";

/**
 * Store › Tallaby Pay earnings, pure helpers (ROADMAP.md F-100f; design §5, §8
 * and the owner's answers in §14: the net is available once the order is
 * delivered; after delivery the seller refunds the customer himself).
 */

/** What the seller reads in a sale's status column. */
export type SaleState =
  | "waiting_delivery"
  | "returned"
  | "releasing"
  | "pending_until"
  | "available"
  | "refund_requested"
  | "refunded";

export const SALE_STATE_TONE: Record<SaleState, "success" | "danger" | "warning" | "info" | "muted"> = {
  waiting_delivery: "warning",
  returned: "danger",
  releasing: "info",
  pending_until: "info",
  available: "success",
  refund_requested: "danger",
  refunded: "muted",
};

type SaleFields = Pick<TallabyPaySaleView, "status" | "refundState" | "orderStatus" | "releaseAt">;

/** The status a sale shows, from its row and its order's current status. */
export function saleState(sale: SaleFields, now: Date = new Date()): SaleState {
  if (sale.status === "refunded") return "refunded";
  if (sale.refundState === "requested") return "refund_requested";
  if (sale.status === "available") return "available";
  // Pending: the release job moves it once the order is delivered.
  if (sale.orderStatus === "returned" || sale.orderStatus === "cancelled" || sale.orderStatus === "refunded") {
    return "returned";
  }
  if (sale.releaseAt) {
    const at = new Date(sale.releaseAt);
    return Number.isFinite(at.getTime()) && at.getTime() > now.getTime() ? "pending_until" : "releasing";
  }
  return "waiting_delivery";
}

/** Parses the `?page=` search param: a positive integer, else 1. */
export function parsePage(value: string | string[] | undefined): number {
  const n = Number(typeof value === "string" ? value : undefined);
  return Number.isSafeInteger(n) && n > 1 ? n : 1;
}

/** "-12.50" → true. Amounts are the database's 2 dp text, so a sign check needs no float math. */
export function isNegativeAmount(amount: string): boolean {
  return amount.trim().startsWith("-") && /[1-9]/.test(amount);
}
