/**
 * Checkout form & thank-you page settings of the store this request is on
 * (ROADMAP.md F-25). Read fresh from `stores.settings` on every call, like the
 * payment methods, so a seller's change applies at once and the cached
 * storefront profile keeps its shape. Null on the marketplace.
 */
import { and, db, eq, orders, storeShippingZones, stores } from "@workspace/db";
import {
  parseStoreCheckoutForm,
  parseStoreThankYou,
  type StoreCheckoutForm,
  type StoreThankYou,
} from "@workspace/lib/stores/checkout-form";
import { parseStoreMinOrder, type StoreMinOrder } from "@workspace/lib/stores/min-order";
import { parseStoreOrderCountries, storeSellingCountries } from "@workspace/lib/stores/order-countries";
import { getCartScope } from "@/lib/storefront.server";

async function requestStoreSettings(): Promise<{ storeId: string; sellerId: string; settings: unknown } | null> {
  const scope = await getCartScope();
  if (!scope) return null;
  const [row] = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(and(eq(stores.id, scope.storeId), eq(stores.sellerId, scope.sellerId)))
    .limit(1);
  return row ? { ...scope, settings: row.settings } : null;
}

/** The store's checkout form, or null on the marketplace. */
export async function getStorefrontCheckoutForm(): Promise<StoreCheckoutForm | null> {
  const row = await requestStoreSettings();
  return row ? parseStoreCheckoutForm(row.settings) : null;
}

/** The store's minimum order (ROADMAP.md F-13b), read fresh; null on the marketplace. */
export async function getStorefrontMinOrder(): Promise<StoreMinOrder | null> {
  const row = await requestStoreSettings();
  return row ? parseStoreMinOrder(row.settings) : null;
}

/**
 * "Orders from my country only" (ROADMAP.md F-115 A5), read fresh: null on
 * the marketplace or while off. When on, the countries come from the store's
 * own delivery zones (Egypt with none); zones are read only then.
 */
export async function getStorefrontOrderCountries(): Promise<{ countries: string[] } | null> {
  const row = await requestStoreSettings();
  if (!row || !parseStoreOrderCountries(row.settings).enabled) return null;
  const zones = await db
    .select({ places: storeShippingZones.places, enabled: storeShippingZones.enabled })
    .from(storeShippingZones)
    .where(eq(storeShippingZones.storeId, row.storeId));
  return { countries: storeSellingCountries(zones) };
}

/**
 * The thank-you settings for an order page, only when the order belongs to
 * the store whose host serves the request (the store comes from the host,
 * never from the order or the client). The caller has already checked the
 * visitor may see the order.
 */
export async function getStorefrontThankYou(
  orderId: string,
): Promise<{ storeId: string; sellerId: string; thankYou: StoreThankYou } | null> {
  const row = await requestStoreSettings();
  if (!row) return null;
  const [order] = await db
    .select({ storeId: orders.storeId })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.storeId, row.storeId)))
    .limit(1);
  if (!order) return null;
  return { storeId: row.storeId, sellerId: row.sellerId, thankYou: parseStoreThankYou(row.settings) };
}
