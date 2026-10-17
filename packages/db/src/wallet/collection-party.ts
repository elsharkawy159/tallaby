/**
 * Who holds the customer's money for a delivered order (PLAN.md §13.4,
 * P6-05). Pure.
 *
 * - `tallaby`: Tallaby collected it (online payment, customer wallet, the
 *   marketplace's manual methods, or cash taken by a Tallaby rider). The
 *   seller's store wallet gets the goods as a `sale` plus the `fee`.
 * - `seller`: the seller already holds the cash (their own rider collected
 *   cash on delivery, or a seller-owned receiving method set
 *   `metadata.paymentCollector = 'seller'`). Only the `fee` is posted.
 */
export type CollectionParty = "tallaby" | "seller";

export function resolveCollectionParty(
  order: { paymentMethod: string | null; metadata?: unknown },
  shipment: { sellerId: string | null; status: string } | null | undefined,
  sellerId: string
): CollectionParty {
  const metadata =
    order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
      ? (order.metadata as Record<string, unknown>)
      : {};
  if (metadata.paymentCollector === "seller") return "seller";

  // A shipment carrying the seller's id is the seller's own delivery (dashboard
  // riders); Tallaby's shipping app never sets it.
  const sellerDelivered = shipment?.sellerId === sellerId && shipment.status === "delivered";
  if (order.paymentMethod === "cash_on_delivery" && sellerDelivered) return "seller";
  return "tallaby";
}
