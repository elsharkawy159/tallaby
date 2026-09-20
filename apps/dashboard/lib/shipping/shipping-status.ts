/**
 * Shipment status model shared with apps/shipping (Tallaby's own tool). Kept in
 * sync by hand — the enum lives in the DB (`shipment_status`), the transition
 * graph is deliberately identical so a seller and Tallaby never disagree on
 * what a legal move is.
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

const TRANSITIONS: Record<ShippingStatus, ShippingStatus[]> = {
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
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: ShippingStatus): ShippingStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function isTerminal(status: ShippingStatus): boolean {
  return TERMINAL.includes(status);
}

export const SHIPPING_STATUS_LABEL: Record<ShippingStatus, string> = {
  pending: "Ready to ship",
  assigned: "Assigned",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  failed: "Failed attempt",
  returned: "Returned",
  cancelled: "Cancelled",
};

export const SHIPPING_STATUS_BADGE: Record<ShippingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  assigned: "bg-blue-100 text-blue-800 border-blue-200",
  out_for_delivery: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  returned: "bg-orange-100 text-orange-800 border-orange-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

/** Whether the order's balance is already settled (prepaid or collected). */
export function isSettled(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === "paid" || paymentStatus === "collected";
}
