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
] as const;
export type AdminNotificationType = (typeof ADMIN_NOTIFICATION_TYPES)[number];

export const SELLER_NOTIFICATION_TYPES = [
  "order_created",
  "top_up_approved",
  "top_up_rejected",
  "question_received",
  "review_received",
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
export function adminNotificationHref(n: Pick<NotificationItem, "type" | "sellerId" | "storeId">): string | null {
  switch (n.type) {
    case "seller_created":
      return n.sellerId ? `/sellers/${encodeURIComponent(n.sellerId)}` : "/sellers";
    case "store_created":
    case "store_published":
      return n.storeId ? `/stores/${encodeURIComponent(n.storeId)}` : "/stores";
    case "top_up_requested":
      return "/store-top-ups";
    default:
      return null;
  }
}

/** Where a seller notification leads inside the seller dashboard, or null. */
export function sellerNotificationHref(n: Pick<NotificationItem, "type" | "data">): string | null {
  switch (n.type) {
    case "order_created": {
      const orderId = dataString(n.data, "orderId");
      return orderId ? `/orders?order=${encodeURIComponent(orderId)}` : "/orders";
    }
    case "top_up_approved":
    case "top_up_rejected":
      return "/wallet";
    case "question_received":
    case "review_received":
      return "/reviews";
    default:
      return null;
  }
}

/** Reads a string field of `data` for display, or "" when it is missing. */
export function notificationText(data: Record<string, unknown>, key: string): string {
  return dataString(data, key) ?? "";
}
