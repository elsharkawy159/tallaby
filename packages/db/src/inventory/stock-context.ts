import { sql } from "drizzle-orm";
import type { db as dbType } from "../drizzle/database";

/**
 * Stock movement context (0125, ROADMAP.md F-10). Every change to
 * `products.quantity` or `product_variants.stock` is written to
 * `stock_movements` by a DB trigger, so no stock change is ever missed. The
 * trigger reads WHY and WHO from transaction-local settings, which the code
 * that changes stock sets here first:
 *
 *   tallaby.stock_reason   one of STOCK_MOVEMENT_REASONS ('other' when unset)
 *   tallaby.stock_actor    the user who made the change (uuid, optional)
 *   tallaby.stock_order_id the order behind it (uuid, optional; the trigger
 *                          takes the store from the order)
 *   tallaby.stock_store_id the store it happened in (uuid, optional)
 *
 * The settings are `set_config(..., true)`: they last until the transaction
 * ends and never leak to another request on a pooled connection. Call this
 * inside the same transaction as the stock write.
 */

export const STOCK_MOVEMENT_REASONS = ["order", "cancel", "return", "edit", "bulk_edit", "import", "other"] as const;
export type StockMovementReason = (typeof STOCK_MOVEMENT_REASONS)[number];

export interface StockContext {
  reason: StockMovementReason;
  actorId?: string | null;
  orderId?: string | null;
  storeId?: string | null;
}

/** The transaction callback's `tx` parameter type, derived from db.transaction itself. */
type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isStockMovementReason(value: unknown): value is StockMovementReason {
  return typeof value === "string" && (STOCK_MOVEMENT_REASONS as readonly string[]).includes(value);
}

/** The four setting values for a context; anything that is not a valid reason or uuid becomes "". */
export function stockContextSettings(ctx: StockContext | null): [string, string, string, string] {
  const id = (value: string | null | undefined) => (value && UUID_RE.test(value) ? value.toLowerCase() : "");
  if (!ctx) return ["", "", "", ""];
  return [isStockMovementReason(ctx.reason) ? ctx.reason : "other", id(ctx.actorId), id(ctx.orderId), id(ctx.storeId)];
}

/** Sets (or, with null, clears) the movement context for the rest of `tx`. */
export async function setStockContext(tx: Tx, ctx: StockContext | null): Promise<void> {
  const [reason, actor, order, store] = stockContextSettings(ctx);
  await tx.execute(sql`select
    set_config('tallaby.stock_reason', ${reason}, true),
    set_config('tallaby.stock_actor', ${actor}, true),
    set_config('tallaby.stock_order_id', ${order}, true),
    set_config('tallaby.stock_store_id', ${store}, true)`);
}
