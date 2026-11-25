/**
 * The WhatsApp "Track order" link `https://tallaby.com/wa/t/<token>`
 * (docs/whatsapp.md §4 Tracking link). The token is a signed order id
 * (`signOrderAccess`, ORDER_ACCESS_SECRET), valid 60 days. It is the same
 * kind of token as the order page's `?access=`, so it only ever opens what
 * the order emails already open.
 */
import { db, eq, orders, shipments, stores } from "@workspace/db";
import { bostaTrackingUrl } from "../integrations/bosta.lib";
import { buildOrderPagePath, signOrderAccess, verifyOrderAccess } from "../orders/order-access";
import { storeUrl } from "../storefront";
import { findActiveCustomDomainForSubdomain } from "../storefront/custom-domains.server";

export const WHATSAPP_TRACKING_TTL_MS = 60 * 24 * 60 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[A-Za-z0-9_-]{1,400}\.[A-Za-z0-9_-]{1,100}$/;

export function signWhatsAppTrackingToken(orderId: string): string {
  return signOrderAccess(orderId, WHATSAPP_TRACKING_TTL_MS);
}

/** The order id of a valid, unexpired token, else null. */
export function readWhatsAppTrackingToken(token: string | null | undefined): string | null {
  if (typeof token !== "string" || !TOKEN_RE.test(token)) return null;
  let payload: string;
  try {
    payload = Buffer.from(token.slice(0, token.lastIndexOf(".")), "base64url").toString("utf8");
  } catch {
    return null;
  }
  const orderId = payload.slice(0, payload.lastIndexOf(":"));
  if (!UUID_RE.test(orderId)) return null;
  try {
    return verifyOrderAccess(orderId, token) ? orderId : null;
  } catch {
    // ORDER_ACCESS_SECRET missing in production.
    return null;
  }
}

/**
 * Where a tracking link goes: the carrier's tracking page (Bosta), else the
 * order's page on the store's own host. Null when the token is bad or the
 * order (or its store) is gone.
 */
export async function resolveWhatsAppTrackingTarget(token: string | null | undefined): Promise<string | null> {
  const orderId = readWhatsAppTrackingToken(token);
  if (!orderId) return null;
  const [row] = await db
    .select({ id: orders.id, subdomain: stores.subdomain })
    .from(orders)
    .innerJoin(stores, eq(stores.id, orders.storeId))
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!row) return null;
  const [shipment] = await db
    .select({ carrier: shipments.carrier, trackingNumber: shipments.trackingNumber })
    .from(shipments)
    .where(eq(shipments.orderId, orderId))
    .limit(1);
  if (shipment?.trackingNumber && shipment.carrier?.toLowerCase() === "bosta") {
    return bostaTrackingUrl(shipment.trackingNumber);
  }
  const customDomain = await findActiveCustomDomainForSubdomain(row.subdomain).catch(() => null);
  return `${storeUrl(row.subdomain, customDomain)}${buildOrderPagePath(orderId)}`;
}
