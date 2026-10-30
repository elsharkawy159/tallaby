/**
 * Pure helpers for the admin and seller header bells (0098). Rows hold a
 * `type` and `data`; each app renders the text, and these helpers decide where
 * a notification leads and validate what a client sends back.
 */

export const ADMIN_NOTIFICATION_TYPES = [
  "seller_created",
  "store_created",
  "store_published",
  "top_up_requested",
  // A seller suggested an idea on the public roadmap (0115)
  "feature_request_created",
  // Seller actions (0116)
  "product_created",
  "first_order_received",
  "integration_connected",
  "store_unpublished",
  "store_deleted",
  // A referrer asked for an affiliate withdrawal (0117, F-37)
  "referral_payout_requested",
] as const;
export type AdminNotificationType = (typeof ADMIN_NOTIFICATION_TYPES)[number];

export const SELLER_NOTIFICATION_TYPES = [
  "order_created",
  "top_up_approved",
  "top_up_rejected",
  "question_received",
  "review_received",
  // Bosta (0106, BS-08/BS-12)
  "carrier_shipment_failed",
  "carrier_needs_attention",
  // Affiliate program (0117, F-37)
  "referral_commission_earned",
  "referral_payout_paid",
  "referral_payout_rejected",
  // Welcome gift (0119)
  "welcome_gift_granted",
  "welcome_gift_expiring",
  "welcome_gift_expired",
  // Stock crossed down to the product's low-stock threshold (0125, F-10)
  "low_stock",
] as const;
export type SellerNotificationType = (typeof SELLER_NOTIFICATION_TYPES)[number];

export type NotificationItem<T extends string = string> = {
  id: string;
  type: T;
  data: Record<string, unknown>;
  sellerId: string | null;
  storeId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationFeed<T extends string = string> = {
  items: NotificationItem<T>[];
  unreadCount: number;
};

export const NOTIFICATION_PAGE_SIZE = 20;
/** The most ids one "mark read" call may name. */
export const MAX_NOTIFICATION_IDS = 100;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isNotificationId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Validates the ids a client asks to mark read: a non-empty array of at most
 * MAX_NOTIFICATION_IDS UUIDs, de-duplicated. Anything else is null.
 */
export function parseNotificationIds(input: unknown): string[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_NOTIFICATION_IDS) return null;
  if (!input.every(isNotificationId)) return null;
  return [...new Set(input.map((id) => id.toLowerCase()))];
}

export function clampNotificationLimit(limit: unknown): number {
  const n = typeof limit === "number" && Number.isFinite(limit) ? Math.trunc(limit) : NOTIFICATION_PAGE_SIZE;
  return Math.min(Math.max(n, 1), 50);
}

function dataString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Where an admin notification leads inside the admin app, or null. */
export function adminNotificationHref(
  n: Pick<NotificationItem, "type" | "sellerId" | "storeId"> & Partial<Pick<NotificationItem, "data">>
): string | null {
  const data = n.data ?? {};
  switch (n.type) {
    case "seller_created":
    case "store_deleted":
      return n.sellerId ? `/sellers/${encodeURIComponent(n.sellerId)}` : "/sellers";
    case "store_created":
    case "store_published":
    case "store_unpublished":
      return n.storeId ? `/stores/${encodeURIComponent(n.storeId)}` : "/stores";
    case "product_created": {
      // A grouped row (several products in one hour) opens the seller's products.
      const productId = dataString(data, "productId");
      if (productId && notificationCount(data) <= 1) return `/products/${encodeURIComponent(productId)}`;
      return n.sellerId ? `/products?seller=${encodeURIComponent(n.sellerId)}` : "/products";
    }
    case "first_order_received": {
      const orderId = dataString(data, "orderId");
      return orderId ? `/orders/${encodeURIComponent(orderId)}` : "/orders";
    }
    case "integration_connected":
      return "/integrations";
    case "top_up_requested":
      return "/store-top-ups";
    case "feature_request_created":
      return "/roadmap";
    case "referral_payout_requested":
      return "/referrals";
    default:
      return null;
  }
}

/** Where a seller notification leads inside the seller dashboard, or null. */
export function sellerNotificationHref(n: Pick<NotificationItem, "type" | "data">): string | null {
  switch (n.type) {
    case "order_created":
    case "carrier_shipment_failed":
    case "carrier_needs_attention": {
      const orderId = dataString(n.data, "orderId");
      return orderId ? `/orders?order=${encodeURIComponent(orderId)}` : "/orders";
    }
    case "top_up_approved":
    case "top_up_rejected":
    case "welcome_gift_granted":
    case "welcome_gift_expiring":
    case "welcome_gift_expired":
      return "/wallet";
    case "question_received":
    case "review_received":
      return "/reviews";
    case "referral_commission_earned":
    case "referral_payout_paid":
    case "referral_payout_rejected":
      return "/earn";
    case "low_stock": {
      const productId = dataString(n.data, "productId");
      return productId ? `/products/inventory?product=${encodeURIComponent(productId)}` : "/products/inventory";
    }
    default:
      return null;
  }
}

/** How many events a grouped row stands for (`product_created`, 0116); 1 when unset. */
export function notificationCount(data: Record<string, unknown>): number {
  const value = data.count;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 1;
}

/** Reads a string field of `data` for display, or "" when it is missing. */
export function notificationText(data: Record<string, unknown>, key: string): string {
  return dataString(data, key) ?? "";
}
