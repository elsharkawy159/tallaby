/**
 * WhatsApp order notifications (ROADMAP.md F-109, docs/whatsapp.md §2–§4).
 * Event keys, message statuses and the forward-only status rule. Pure, safe on
 * the client.
 */

/** The order events a shopper can get a WhatsApp message for, in order-life order. */
export const WHATSAPP_EVENTS = [
  "order_placed",
  "order_confirmed",
  "order_shipped",
  "order_out_for_delivery",
  "order_delivered",
  "order_cancelled",
] as const;

export type WhatsAppEvent = (typeof WHATSAPP_EVENTS)[number];

/** `whatsapp_messages.event`: an order event, or `reply` for a free in-session reply. */
export type WhatsAppMessageEvent = WhatsAppEvent | "reply";

export const WHATSAPP_LOCALES = ["ar", "en"] as const;
export type WhatsAppLocale = (typeof WHATSAPP_LOCALES)[number];

export const WHATSAPP_MESSAGE_STATUSES = [
  "queued",
  "sending",
  "sent",
  "delivered",
  "read",
  "failed",
  "skipped",
  "unknown",
] as const;

export type WhatsAppMessageStatus = (typeof WHATSAPP_MESSAGE_STATUSES)[number];

/** The statuses Meta's webhook reports for an outbound message. */
export const WHATSAPP_WEBHOOK_STATUSES = ["sent", "delivered", "read", "failed"] as const;
export type WhatsAppWebhookStatus = (typeof WHATSAPP_WEBHOOK_STATUSES)[number];

export function isWhatsAppEvent(value: unknown): value is WhatsAppEvent {
  return typeof value === "string" && (WHATSAPP_EVENTS as readonly string[]).includes(value);
}

export function isWhatsAppLocale(value: unknown): value is WhatsAppLocale {
  return value === "ar" || value === "en";
}

/** `whatsapp_messages.dedupe_key` of an order event: one message per order and event. */
export function orderEventDedupeKey(orderId: string, event: WhatsAppEvent): string {
  return `order:${orderId}:${event}`;
}

/** `whatsapp_messages.dedupe_key` of an in-session reply: one reply per inbound message. */
export function replyDedupeKey(inboundWamid: string): string {
  return `reply:${inboundWamid}`;
}

/** Delivery progress: sent < delivered < read. Pre-send states rank below sent. */
const PROGRESS_RANK: Partial<Record<WhatsAppMessageStatus, number>> = {
  queued: 0,
  sending: 0,
  unknown: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

/**
 * Whether a status update from Meta's webhook may move a message from `from`
 * to `to`. Only the webhook statuses (sent, delivered, read, failed) are valid
 * targets; the dispatcher's own moves (queued ↔ sending, sending → unknown)
 * and admin retries don't go through this.
 *
 * - Progress only moves forward: sent < delivered < read; an equal or lower
 *   status is ignored (webhooks arrive out of order).
 * - `failed` is accepted from queued, sending, unknown and sent, but never
 *   after delivered or read.
 * - `failed` and `skipped` are final.
 * - A message we marked `unknown` (timeout after the request was sent) moves
 *   to whatever Meta reports, since that proves what happened.
 */
export function canAdvanceStatus(from: WhatsAppMessageStatus, to: WhatsAppMessageStatus): boolean {
  if (from === "failed" || from === "skipped") return false;
  const fromRank = PROGRESS_RANK[from];
  if (fromRank === undefined) return false;
  if (to === "failed") return fromRank <= 1;
  const toRank = PROGRESS_RANK[to];
  if (toRank === undefined || toRank === 0) return false;
  return toRank > fromRank;
}
