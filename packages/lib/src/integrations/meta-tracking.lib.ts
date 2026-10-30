import { z } from "zod";

/**
 * Meta ad-tracking settings per store (ROADMAP.md F-30). Pure and edge-safe.
 *
 * Stored in the store's `meta_pixel` integration row, `config.tracking`
 * (public, not a secret), next to the pixel id:
 *
 * - `events`: which Meta events the store's Pixel (and CAPI) may send
 *   (F-30b). Defaults keep today's behaviour exactly: the four commerce
 *   events on, `Lead` (F-03 missed-order checkout) off.
 * - `purchaseOn`: when Purchase reaches Meta (F-30a). `order` (today) fires
 *   the browser Purchase on the thank-you page and the server CAPI Purchase
 *   at checkout; `delivered` fires nothing at checkout and one server CAPI
 *   Purchase when the order is delivered. `delivered` needs CAPI connected;
 *   without it the store behaves as `order`.
 *
 * Event ids never change: Purchase uses `event_id = order id` in every mode,
 * so a browser and a server Purchase for the same order always dedupe.
 */

export const META_TRACKED_EVENTS = ["ViewContent", "AddToCart", "InitiateCheckout", "Purchase", "Lead"] as const;
export type MetaTrackedEvent = (typeof META_TRACKED_EVENTS)[number];

export const META_PURCHASE_TIMINGS = ["order", "delivered"] as const;
export type MetaPurchaseTiming = (typeof META_PURCHASE_TIMINGS)[number];

export type MetaTrackingSettings = {
  events: Record<MetaTrackedEvent, boolean>;
  purchaseOn: MetaPurchaseTiming;
};

/** Today's behaviour: every commerce event on, no Lead, Purchase at order. */
export const DEFAULT_META_TRACKING: MetaTrackingSettings = Object.freeze({
  events: Object.freeze({ ViewContent: true, AddToCart: true, InitiateCheckout: true, Purchase: true, Lead: false }),
  purchaseOn: "order",
}) as MetaTrackingSettings;

function isTrackedEvent(value: unknown): value is MetaTrackedEvent {
  return typeof value === "string" && (META_TRACKED_EVENTS as readonly string[]).includes(value);
}

/**
 * Reads `config.tracking` of a `meta_pixel` row. Missing or malformed keys
 * fall back to the defaults one by one, so an old row (no `tracking`) reads
 * exactly as today's behaviour.
 */
export function readMetaTrackingSettings(config: unknown): MetaTrackingSettings {
  const tracking =
    config && typeof config === "object" ? (config as Record<string, unknown>).tracking : undefined;
  const source = tracking && typeof tracking === "object" ? (tracking as Record<string, unknown>) : {};
  const rawEvents = source.events && typeof source.events === "object" ? (source.events as Record<string, unknown>) : {};
  const events = { ...DEFAULT_META_TRACKING.events };
  for (const name of META_TRACKED_EVENTS) {
    if (typeof rawEvents[name] === "boolean") events[name] = rawEvents[name] as boolean;
  }
  const purchaseOn: MetaPurchaseTiming = source.purchaseOn === "delivered" ? "delivered" : "order";
  return { events, purchaseOn };
}

const inputSchema = z.strictObject({
  events: z.record(z.string(), z.boolean()).optional().default({}),
  purchaseOn: z.enum(META_PURCHASE_TIMINGS).optional().default("order"),
});

/** Validates the dashboard form; unknown event names are refused. */
export function validateMetaTrackingInput(
  raw: unknown,
): { success: true; data: MetaTrackingSettings } | { success: false; error: "invalid_settings" } {
  const parsed = inputSchema.safeParse(raw ?? {});
  if (!parsed.success) return { success: false, error: "invalid_settings" };
  const events = { ...DEFAULT_META_TRACKING.events };
  for (const [name, on] of Object.entries(parsed.data.events)) {
    if (!isTrackedEvent(name)) return { success: false, error: "invalid_settings" };
    events[name] = on;
  }
  return { success: true, data: { events, purchaseOn: parsed.data.purchaseOn } };
}

/** `delivered` only takes effect when the store can send server events. */
export function effectivePurchaseTiming(settings: MetaTrackingSettings, capiConnected: boolean): MetaPurchaseTiming {
  return settings.purchaseOn === "delivered" && capiConnected ? "delivered" : "order";
}

/**
 * The events the store's browser Pixel must not send: the switched-off ones,
 * plus Purchase when it is sent on delivery (the thank-you page then sends
 * nothing to Meta; GA4 / GTM are not affected).
 */
export function browserBlockedMetaEvents(settings: MetaTrackingSettings, capiConnected: boolean): MetaTrackedEvent[] {
  const blocked = META_TRACKED_EVENTS.filter((name) => !settings.events[name]);
  if (settings.events.Purchase && effectivePurchaseTiming(settings, capiConnected) === "delivered") blocked.push("Purchase");
  return blocked;
}

/**
 * At checkout (server side): `send` the CAPI Purchase now (today),
 * `defer` it to delivery (save the visitor's match data on the order), or
 * `skip` (Purchase switched off).
 */
export function orderTimePurchaseDecision(
  settings: MetaTrackingSettings,
  capiConnected: boolean,
): "send" | "defer" | "skip" {
  if (!settings.events.Purchase) return "skip";
  return effectivePurchaseTiming(settings, capiConnected) === "delivered" ? "defer" : "send";
}

/* ------------------------------------------------------------------ */
/* Purchase on delivery: order metadata keys and decisions             */
/* ------------------------------------------------------------------ */

/** `orders.metadata` key holding the checkout match data of a deferred Purchase. */
export const META_DEFERRED_PURCHASE_KEY = "metaCapiDeferred";
/** `orders.metadata` key claimed (ISO time) by the one delivered Purchase. */
export const META_DELIVERED_SENT_KEY = "capiDeliveredSentAt";
/** `orders.metadata` key counting failed sends; the sweep stops at the cap. */
export const META_DELIVERED_FAILURES_KEY = "capiDeliveredFailures";
export const META_DELIVERED_MAX_FAILURES = 3;
/**
 * Meta refuses website events older than 7 days; a delivery older than this
 * is never sent (6 days leaves room for clock skew and the daily sweep).
 */
export const META_DELIVERED_MAX_AGE_MS = 6 * 24 * 60 * 60 * 1000;

/**
 * The match data saved at checkout. `userData` is Meta's `user_data` as
 * built at checkout (email, phone and external id already SHA-256 hashed;
 * IP, user agent and the _fbp/_fbc cookies as sent today). It is only saved
 * when the visitor accepted tracking on the store (D19), so its presence is
 * also the consent record.
 */
export type MetaDeferredPurchase = {
  v: 1;
  userData: Record<string, unknown>;
  eventSourceUrl: string | null;
  at: string;
};

const USER_DATA_KEYS = new Set(["em", "ph", "external_id", "client_ip_address", "client_user_agent", "fbp", "fbc"]);

/** Keeps only Meta `user_data` keys with string / string[] values (bounded). */
export function sanitizeMetaUserData(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!USER_DATA_KEYS.has(key)) continue;
    if (typeof value === "string" && value.length <= 512) out[key] = value;
    else if (Array.isArray(value)) {
      const list = value.filter((v): v is string => typeof v === "string" && v.length <= 128).slice(0, 3);
      if (list.length) out[key] = list;
    }
  }
  return out;
}

export function buildDeferredPurchase(
  userData: unknown,
  eventSourceUrl: string | null | undefined,
  now = new Date(),
): MetaDeferredPurchase {
  const url = typeof eventSourceUrl === "string" && /^https?:\/\//.test(eventSourceUrl) ? eventSourceUrl.slice(0, 1000) : null;
  return { v: 1, userData: sanitizeMetaUserData(userData), eventSourceUrl: url, at: now.toISOString() };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function readDeferredPurchase(metadata: unknown): MetaDeferredPurchase | null {
  const raw = asRecord(asRecord(metadata)[META_DEFERRED_PURCHASE_KEY]);
  if (raw.v !== 1 || typeof raw.at !== "string") return null;
  return {
    v: 1,
    userData: sanitizeMetaUserData(raw.userData),
    eventSourceUrl: typeof raw.eventSourceUrl === "string" ? raw.eventSourceUrl : null,
    at: raw.at,
  };
}

export type DeliveredPurchaseSkip =
  | "no_store"
  | "not_delivered"
  | "not_deferred"
  | "already_sent"
  | "too_many_failures"
  | "purchase_off"
  | "too_old";

/**
 * Whether the one delivered Purchase may be sent now. Only orders whose
 * Purchase was deferred at checkout (see `readDeferredPurchase`) qualify, so
 * an order that already sent Purchase at checkout never sends a second one,
 * whatever the store's setting is today. Refused orders (returned,
 * cancelled) never reach `delivered` and send nothing.
 */
export function deliveredPurchaseDecision(input: {
  order: { storeId: string | null; status: string | null; deliveredAt: string | null; metadata: unknown };
  settings: MetaTrackingSettings;
  now?: Date;
}): { send: true; deferred: MetaDeferredPurchase; eventTime: number } | { send: false; reason: DeliveredPurchaseSkip } {
  const { order, settings } = input;
  const now = input.now ?? new Date();
  if (!order.storeId) return { send: false, reason: "no_store" };
  if (order.status !== "delivered") return { send: false, reason: "not_delivered" };
  const meta = asRecord(order.metadata);
  if (meta[META_DELIVERED_SENT_KEY]) return { send: false, reason: "already_sent" };
  const deferred = readDeferredPurchase(meta);
  if (!deferred) return { send: false, reason: "not_deferred" };
  if (Number(meta[META_DELIVERED_FAILURES_KEY] ?? 0) >= META_DELIVERED_MAX_FAILURES) {
    return { send: false, reason: "too_many_failures" };
  }
  if (!settings.events.Purchase) return { send: false, reason: "purchase_off" };
  const delivered = order.deliveredAt ? Date.parse(order.deliveredAt) : Number.NaN;
  const at = Number.isFinite(delivered) ? Math.min(delivered, now.getTime()) : now.getTime();
  if (now.getTime() - at > META_DELIVERED_MAX_AGE_MS) return { send: false, reason: "too_old" };
  return { send: true, deferred, eventTime: Math.floor(at / 1000) };
}

/** The metadata patch the conditional claim UPDATE merges in. */
export function buildDeliveredClaimPatch(now = new Date()): Record<string, string> {
  return { [META_DELIVERED_SENT_KEY]: now.toISOString() };
}

/** The server Purchase sent on delivery: same body and `event_id` as at checkout. */
export function buildDeliveredPurchaseEvent(input: {
  orderId: string;
  eventTime: number;
  deferred: MetaDeferredPurchase;
  totalAmount: string | number;
  currency: string | null;
  items: Array<{ productId: string; quantity: number | string | null }>;
}): Record<string, unknown> {
  const contentIds = Array.from(new Set(input.items.map((item) => item.productId).filter(Boolean)));
  const event: Record<string, unknown> = {
    event_name: "Purchase",
    event_time: input.eventTime,
    event_id: input.orderId,
    action_source: "website",
    user_data: input.deferred.userData,
    custom_data: {
      content_ids: contentIds,
      content_type: "product",
      value: Number(input.totalAmount),
      currency: input.currency || "EGP",
      num_items: input.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      order_id: input.orderId,
    },
  };
  if (input.deferred.eventSourceUrl) event.event_source_url = input.deferred.eventSourceUrl;
  return event;
}
