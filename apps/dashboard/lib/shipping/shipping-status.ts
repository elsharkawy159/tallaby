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
  pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/60",
  assigned: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
  out_for_delivery: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/60",
  delivered: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900/60",
  failed: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60",
  returned: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-900/60",
  cancelled: "bg-muted text-foreground border-border",
};

/** Whether the order's balance is already settled (prepaid or collected). */
export function isSettled(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === "paid" || paymentStatus === "collected";
}
