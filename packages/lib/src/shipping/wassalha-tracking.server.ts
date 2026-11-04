import { and, db, eq, inArray, orders, shipments, sql, stores } from "@workspace/db";
import type { TrackingEntry } from "./wassalha-tracking.lib";

/**
 * Saves Wassalha tracking numbers on a store's orders (ROADMAP.md F-12e).
 * Server-only. An entry matches only an order of this store of this seller, by
 * its exact order number, and only one already exported for Wassalha. Everything
 * else comes back as a problem; nothing is guessed. Only `tracking_number`
 * changes: the seller still moves the order along by hand, as with any export.
 */

const CARRIER = "wassalha";

export type TrackingApplyReason = "not_found" | "not_exported" | "other_carrier" | "has_other_number" | "tracking_in_use";

export type TrackingApplyResult = {
  saved: number;
  /** The order already has this number. */
  unchanged: number;
  problems: (TrackingEntry & { reason: TrackingApplyReason })[];
};

export async function applyWassalhaTracking(
  sellerId: string,
  storeId: string,
  entries: readonly TrackingEntry[],
  /** Replace a different number already saved: the seller correcting one order, never a file. */
  options: { replace?: boolean } = {},
): Promise<TrackingApplyResult> {
  if (entries.length === 0) return { saved: 0, unchanged: 0, problems: [] };

  const found = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      shipmentId: shipments.id,
      carrier: shipments.carrier,
      shipmentSellerId: shipments.sellerId,
      trackingNumber: shipments.trackingNumber,
    })
    .from(orders)
    .innerJoin(stores, and(eq(stores.id, orders.storeId), eq(stores.sellerId, sellerId)))
    .leftJoin(shipments, eq(shipments.orderId, orders.id))
    .where(
      and(
        eq(orders.storeId, storeId),
        inArray(
          orders.orderNumber,
          entries.map((entry) => entry.orderNumber),
        ),
      ),
    );
  const byNumber = new Map(found.map((row) => [row.orderNumber, row]));

  // A number already on another of this seller's orders, in any store.
  const upperNumbers = [...new Set(entries.map((entry) => entry.trackingNumber.toUpperCase()))];
  const taken = await db
    .select({ orderId: shipments.orderId, number: sql<string>`upper(${shipments.trackingNumber})` })
    .from(shipments)
    .where(
      and(
        eq(shipments.sellerId, sellerId),
        eq(shipments.carrier, CARRIER),
        inArray(sql`upper(${shipments.trackingNumber})`, upperNumbers),
      ),
    );
  const takenBy = new Map(taken.map((row) => [row.number, row.orderId]));

  const problems: TrackingApplyResult["problems"] = [];
  const updates: { id: string; tracking: string }[] = [];
  let unchanged = 0;

  for (const entry of entries) {
    const row = byNumber.get(entry.orderNumber);
    const number = entry.trackingNumber.toUpperCase();
    const owner = takenBy.get(number);
    if (!row) problems.push({ ...entry, reason: "not_found" });
    else if (!row.shipmentId || (row.carrier === "seller" && row.shipmentSellerId === sellerId)) {
      problems.push({ ...entry, reason: "not_exported" });
    } else if (row.carrier !== CARRIER || row.shipmentSellerId !== sellerId) {
      problems.push({ ...entry, reason: "other_carrier" });
    } else if (row.trackingNumber?.toUpperCase() === number) unchanged += 1;
    else if (owner && owner !== row.orderId) problems.push({ ...entry, reason: "tracking_in_use" });
    else if (row.trackingNumber && !options.replace) problems.push({ ...entry, reason: "has_other_number" });
    else updates.push({ id: row.shipmentId, tracking: entry.trackingNumber });
  }

  let saved = 0;
  if (updates.length > 0) {
    // One statement, re-checking the owner and the carrier on the row it changes.
    const result = await db.execute(sql`
      UPDATE shipments s
         SET tracking_number = v.tracking, updated_at = now()
        FROM jsonb_to_recordset(${JSON.stringify(updates)}::jsonb) AS v(id uuid, tracking text)
       WHERE s.id = v.id
         AND s.seller_id = ${sellerId}
         AND s.carrier = ${CARRIER}
         AND (s.tracking_number IS NULL OR ${options.replace === true})
      RETURNING s.id
    `);
    saved = [...(result as Iterable<unknown>)].length;
  }
  return { saved, unchanged, problems };
}
