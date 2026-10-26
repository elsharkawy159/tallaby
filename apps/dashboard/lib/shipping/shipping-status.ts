/**
 * Shipment status model shared with apps/shipping (Tallaby's own tool). The
 * statuses and transition graph live in `@workspace/lib/shipping/shipment-status`
 * so the Bosta webhook and sync (outside this app) apply the same rules; the
 * dashboard's labels and badge styles stay here.
 */
import type { ShippingStatus } from "@workspace/lib/shipping/shipment-status";

export {
  SHIPPING_STATUSES,
  canTransition,
  isSettled,
  isShippingStatus,
  isTerminal,
  nextStatuses,
  type ShippingStatus,
} from "@workspace/lib/shipping/shipment-status";

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
