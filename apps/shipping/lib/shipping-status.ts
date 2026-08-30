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

/** Statuses a rider may set on a delivery assigned to them. */
export const RIDER_STATUSES = [
  "out_for_delivery",
  "delivered",
  "failed",
] as const satisfies readonly ShippingStatus[];

export type RiderStatus = (typeof RIDER_STATUSES)[number];

/** Terminal statuses — nothing moves out of these. */
const TERMINAL: ShippingStatus[] = ["delivered", "returned", "cancelled"];

/**
 * Allowed transitions. Deliberately permissive for admins (real deliveries go
 * wrong in ways a strict graph can't anticipate) but it still blocks the
 * nonsense cases: leaving a terminal state, or moving to the state you're in.
 */
const TRANSITIONS: Record<ShippingStatus, ShippingStatus[]> = {
  pending: ["assigned", "out_for_delivery", "cancelled"],
  assigned: ["pending", "out_for_delivery", "failed", "cancelled"],
  out_for_delivery: ["delivered", "failed", "returned", "assigned"],
  delivered: [],
  failed: ["assigned", "out_for_delivery", "returned", "cancelled"],
  returned: [],
  cancelled: [],
};

export function canTransition(from: ShippingStatus, to: ShippingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: ShippingStatus): ShippingStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function isTerminal(status: ShippingStatus): boolean {
  return TERMINAL.includes(status);
}

export function getStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Same `bg-{color}-100 text-{color}-800` idiom as
 * apps/admin/app/(dashboard)/orders/orders.lib.ts, so shipping statuses read
 * identically to order statuses across the platform.
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "assigned":
      return "bg-blue-100 text-blue-800";
    case "out_for_delivery":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "returned":
      return "bg-orange-100 text-orange-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "authorized":
      return "bg-blue-100 text-blue-800";
    case "paid":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "refunded":
    case "partially_refunded":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
