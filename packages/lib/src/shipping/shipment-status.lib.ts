/**
 * Shipment status model for seller-side delivery (dashboard riders and the
 * seller's carriers such as Bosta). Pure. The enum lives in the DB
 * (`shipment_status`); the transition graph is deliberately identical to
 * apps/shipping (Tallaby's own tool), so a seller and Tallaby never disagree
 * on what a legal move is. Kept in sync by hand.
 */
export const SHIPPING_STATUSES = [
  "pending",
  "assigned",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
  "cancelled",
] as const;

export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];

const TERMINAL: ShippingStatus[] = ["delivered", "returned", "cancelled"];

export const SHIPPING_TRANSITIONS: Readonly<Record<ShippingStatus, readonly ShippingStatus[]>> = {
  pending: ["assigned", "out_for_delivery", "cancelled"],
  assigned: ["pending", "out_for_delivery", "failed", "cancelled"],
  out_for_delivery: ["delivered", "failed", "returned", "assigned"],
  delivered: [],
  failed: ["assigned", "out_for_delivery", "returned", "cancelled"],
  returned: [],
  cancelled: [],
};

export function isShippingStatus(value: string): value is ShippingStatus {
  return (SHIPPING_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: ShippingStatus, to: ShippingStatus): boolean {
  return SHIPPING_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: ShippingStatus): ShippingStatus[] {
  return [...(SHIPPING_TRANSITIONS[from] ?? [])];
}

export function isTerminal(status: ShippingStatus): boolean {
  return TERMINAL.includes(status);
}

/** Whether the order's balance is already settled (prepaid or collected). */
export function isSettled(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === "paid" || paymentStatus === "collected";
}
