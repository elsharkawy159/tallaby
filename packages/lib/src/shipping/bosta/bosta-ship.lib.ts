/**
 * When a Tallaby order may go to Bosta, and whether Bosta collects cash
 * (docs/superpowers/plans/2026-10-26-bosta-shipping.md §4.4, BS-08). Pure.
 */

/** Order statuses before anything has left. */
export const BOSTA_SHIPPABLE_ORDER_STATUSES = ["pending", "confirmed", "shipping_soon", "shipped"] as const;

/** Methods paid in cash at the door; the legacy default is `cash`. */
const CASH_METHODS = new Set(["cash_on_delivery", "cash"]);

export type BostaCollection = { ok: true; prepaid: boolean } | { ok: false; error: "awaiting_payment" };

/**
 * A settled order is prepaid (COD 0). A cash order is collected in full: a
 * wallet part-payment only ever pairs with an online remainder
 * (`wallet_instapay`, …), never with cash. Anything else unpaid (card,
 * InstaPay, …) waits until the payment lands.
 */
export function bostaCollection(order: { paymentStatus: string | null; paymentMethod: string | null }): BostaCollection {
  if (order.paymentStatus === "paid" || order.paymentStatus === "collected") return { ok: true, prepaid: true };
  if (CASH_METHODS.has(order.paymentMethod ?? "cash")) return { ok: true, prepaid: false };
  return { ok: false, error: "awaiting_payment" };
}

export type BostaShipBlocker = "not_shippable" | "awaiting_payment" | "already_shipped" | "other_carrier";

/**
 * Why this order can't be sent to Bosta right now, or null. A shipment may
 * already exist: a seller one still at `pending`, or a Bosta claim whose
 * create call failed (no `externalId`), both of which may (re)try.
 */
export function bostaShipBlocker(
  order: { status: string | null; paymentStatus: string | null; paymentMethod: string | null },
  shipment: { carrier: string | null; status: string; externalId: string | null; riderId: string | null } | null,
): BostaShipBlocker | null {
  if (order.status === "payment_processing") return "awaiting_payment";
  if (!(BOSTA_SHIPPABLE_ORDER_STATUSES as readonly string[]).includes(order.status ?? "pending")) return "not_shippable";
  if (shipment) {
    if (shipment.externalId) return "already_shipped";
    // A Wassalha sheet export (F-12c) is not a handover yet, so Bosta may still take it.
    const sellerOwned = shipment.carrier === "seller" || shipment.carrier === "wassalha";
    if (shipment.carrier !== "bosta" && (!sellerOwned || shipment.riderId)) return "other_carrier";
    if (shipment.status !== "pending") return "already_shipped";
  }
  const collection = bostaCollection(order);
  return collection.ok ? null : collection.error;
}

/**
 * Where Bosta posts status changes for this store's shipments, or null when
 * no public https backend is configured (the sync cron then covers it).
 */
export function bostaWebhookUrl(
  integrationId: string,
  base: string | undefined = process.env.BOSTA_WEBHOOK_BASE_URL || process.env.BACKEND_API_URL,
): string | null {
  const root = base?.trim().replace(/\/+$/, "");
  if (!root || !/^https:\/\//i.test(root)) return null;
  return `${root}/api/webhooks/bosta/${encodeURIComponent(integrationId)}`;
}
