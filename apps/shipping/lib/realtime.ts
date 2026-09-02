/**
 * The vocabulary shared by the database triggers (packages/db/migrations/
 * 0021_shipping_realtime.sql) and the two client subscriptions.
 *
 * Realtime here is a notification channel, not a data source: a message says
 * only "something in this domain changed", and the client re-runs the existing
 * server-authorized query to find out what. Payloads therefore carry ids and
 * status and nothing else — never a customer name, address, phone, or COD
 * amount.
 */

/** The admin surface. Readable only by a verified, unsuspended `role='admin'`. */
export const DISPATCH_TOPIC = "dispatch";

/**
 * One topic per rider. A shipment moving between riders is broadcast to both
 * the new and the previous rider's topic, which is the whole reason this is a
 * broadcast channel rather than a row-filtered postgres_changes subscription:
 * the updated row no longer carries the previous rider's id, so nothing
 * row-scoped could ever reach them.
 */
export const riderTopic = (riderId: string) => `rider:${riderId}`;

export const SHIPPING_REALTIME_EVENTS = [
  "shipment",
  "order",
  "rider",
  "batch",
] as const;

export type ShippingRealtimeEvent = (typeof SHIPPING_REALTIME_EVENTS)[number];

export function isShippingRealtimeEvent(
  value: unknown
): value is ShippingRealtimeEvent {
  return SHIPPING_REALTIME_EVENTS.includes(value as ShippingRealtimeEvent);
}
