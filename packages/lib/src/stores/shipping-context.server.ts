/**
 * Customer-side store shipping loader, kept out of `./server` so checkout
 * (`orders/place-order.ts`) can read a store's zones without pulling in the
 * store builder modules. Re-exported from `./server`. Never cached (rule 8).
 */
import { and, asc, db, eq, storeShippingZones, stores } from "@workspace/db";
import { parseStoreShipping, type StoreShippingSettings, type ZoneForQuote } from "../shipping/store-zones";

type Queryable = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type StoreShippingZone = ZoneForQuote;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A zone row as the quote reads it; legacy governorates-only rows become `EG/<g>` places. */
export function toShippingZone(row: typeof storeShippingZones.$inferSelect): StoreShippingZone {
  const name = (row.name ?? {}) as { ar?: string; en?: string };
  return {
    id: row.id,
    nameAr: name.ar ?? "",
    nameEn: name.en ?? null,
    places: row.places.length ? row.places : row.governorates.map((g) => `EG/${g}`),
    price: Number(row.price),
    freeOver: row.freeOver === null ? null : Number(row.freeOver),
    deliveryDaysMin: row.deliveryDaysMin,
    deliveryDaysMax: row.deliveryDaysMax,
    codEnabled: row.codEnabled,
    enabled: row.enabled,
  };
}

/**
 * The store's shipping settings and enabled zones by store id alone. The
 * caller passes a server-trusted id (the cart's store, or the request host's).
 */
export async function getStorefrontShippingContext(
  storeId: string,
  q: Queryable = db,
): Promise<{ settings: StoreShippingSettings; zones: StoreShippingZone[] } | null> {
  if (!UUID_RE.test(storeId)) return null;
  const [store] = await q.select({ settings: stores.settings }).from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store) return null;
  const rows = await q
    .select()
    .from(storeShippingZones)
    .where(and(eq(storeShippingZones.storeId, storeId), eq(storeShippingZones.enabled, true)))
    .orderBy(asc(storeShippingZones.sortOrder), asc(storeShippingZones.createdAt));
  return {
    settings: parseStoreShipping((store.settings as Record<string, unknown> | null)?.shipping),
    zones: rows.map(toShippingZone),
  };
}
