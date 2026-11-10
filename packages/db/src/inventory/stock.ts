import { and, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { orders, products, productStoreSplit, productVariants } from "../drizzle/schema";
import type { db as dbType } from "../drizzle/database";
import { setStockContext, type StockContext } from "./stock-context";

/**
 * Atomic stock primitives. No read-then-write anywhere in this file — every
 * write's WHERE clause is the concurrency guard, so concurrent orders
 * against the same row cannot oversell and cannot drive stock negative.
 *
 * Deliberately framework-free (no next/* import) so these can be exercised
 * directly by Vitest integration tests against a real Postgres instance
 * without a Next.js runtime.
 */

export type StockLineKind = "product" | "variant";

export interface StockLine {
  kind: StockLineKind;
  id: string;
  quantity: number;
}

export interface StockResult {
  kind: StockLineKind;
  id: string;
  /** Quantity remaining after the operation. */
  quantity: number;
  /** True when this operation flipped the item's in-stock/out-of-stock status. */
  stockBoundaryCrossed: boolean;
}

export class InsufficientStockError extends Error {
  constructor(
    public readonly kind: StockLineKind,
    public readonly id: string
  ) {
    super(`Insufficient stock for ${kind} ${id}`);
    this.name = "InsufficientStockError";
  }
}

/** The transaction callback's `tx` parameter type, derived from db.transaction itself. */
type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

/**
 * Unlimited stock (0138, F-51): a variant inherits `products.track_stock`. As a
 * NOT EXISTS, so a tracked product and a variant with no product keep their
 * old behaviour.
 */
const variantProductTracked = sql`NOT EXISTS (
  SELECT 1 FROM public.products p
  WHERE p.id = product_variants.product_id AND p.track_stock = false
)`;

/**
 * Whether a line that wrote nothing is on an untracked product, rather than
 * short of stock. Only read after the guarded UPDATE missed, so tracked orders
 * cost no extra query.
 */
async function isUntrackedLine(tx: Tx, line: StockLine): Promise<boolean> {
  const [row] =
    line.kind === "product"
      ? await tx.select({ trackStock: products.trackStock }).from(products).where(eq(products.id, line.id)).limit(1)
      : await tx
          .select({ trackStock: products.trackStock })
          .from(productVariants)
          .innerJoin(products, eq(products.id, productVariants.productId))
          .where(eq(productVariants.id, line.id))
          .limit(1);
  return row?.trackStock === false;
}

/**
 * Sorts lines by (kind, id) so a multi-item order and a concurrent order
 * that shares some of the same rows always acquire row locks in the same
 * order, which rules out a lock-ordering deadlock between the two.
 */
function sortedLines<T extends StockLine>(lines: readonly T[]): T[] {
  return [...lines].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A line aimed at the row its stock lives in; `sourceId` is the id the caller passed. */
type RoutedLine = StockLine & { sourceId: string };

/**
 * Catalog split (0163, ROADMAP.md F-87m; plan §2.1.4, risk R3). An order placed
 * before the split names the original product or variant, which may now be
 * kept by another store. Its stock belongs to the copy in the order's own
 * store, found in `product_store_split` (kind 'copy', store = the order's
 * store). Lines with no copy there are unchanged, so this is a no-op before
 * the split (the map is empty) and for orders placed after it (their lines
 * already name their store's rows). One query, only when the context names an
 * order. Results keep the caller's ids (`sourceId`).
 */
async function routeToOrderStore(tx: Tx, lines: readonly StockLine[], context: StockContext): Promise<RoutedLine[]> {
  const routed = lines.map((line) => ({ ...line, sourceId: line.id }));
  const orderId = context.orderId;
  if (!orderId || !UUID_RE.test(orderId)) return routed;
  const ids = [...new Set(lines.filter((l) => l.quantity > 0 && UUID_RE.test(l.id)).map((l) => l.id))];
  if (ids.length === 0) return routed;

  const rows = await tx
    .select({ entity: productStoreSplit.entity, oldId: productStoreSplit.oldId, newId: productStoreSplit.newId })
    .from(productStoreSplit)
    .innerJoin(orders, eq(orders.storeId, productStoreSplit.storeId))
    .where(
      and(
        eq(orders.id, orderId),
        eq(productStoreSplit.kind, "copy"),
        inArray(productStoreSplit.entity, ["product", "variant"]),
        inArray(productStoreSplit.oldId, ids)
      )
    );
  if (rows.length === 0) return routed;
  const target = new Map(rows.map((r) => [`${r.entity}:${r.oldId}`, r.newId]));
  return routed.map((line) => {
    const id = target.get(`${line.kind}:${line.id}`);
    return id ? { ...line, id } : line;
  });
}

/**
 * Atomically decrements stock for each line, in a consistent lock order.
 * Throws InsufficientStockError the instant any line can't be satisfied —
 * the caller's transaction rolls back, so a multi-item order either fully
 * succeeds or fully fails; nothing is decremented partway. A line on an
 * untracked product (0138) is skipped: nothing written, no result.
 */
export async function decrementStock(
  tx: Tx,
  lines: readonly StockLine[],
  context: StockContext = { reason: "order" }
): Promise<StockResult[]> {
  const results: StockResult[] = [];
  const now = new Date().toISOString();
  // Stock history (0125): the trigger records each change with this reason;
  // the order id is linked when the order's order_items rows are inserted.
  const tracked = lines.some((line) => line.quantity > 0);
  if (tracked) await setStockContext(tx, context);

  for (const line of sortedLines(await routeToOrderStore(tx, lines, context))) {
    if (line.quantity <= 0) continue;

    if (line.kind === "product") {
      const [row] = await tx
        .update(products)
        .set({
          quantity: sql`${products.quantity} - ${line.quantity}`,
          updatedAt: now,
        })
        .where(
          and(
            eq(products.id, line.id),
            eq(products.trackStock, true),
            gte(products.quantity, sql`${line.quantity}::numeric`)
          )
        )
        .returning({ quantity: products.quantity });

      if (!row) {
        if (await isUntrackedLine(tx, line)) continue;
        throw new InsufficientStockError("product", line.sourceId);
      }
      const newQuantity = Number(row.quantity);
      results.push({
        kind: "product",
        id: line.sourceId,
        quantity: newQuantity,
        stockBoundaryCrossed: newQuantity === 0,
      });
    } else {
      const [row] = await tx
        .update(productVariants)
        .set({
          stock: sql`${productVariants.stock} - ${line.quantity}`,
          updatedAt: now,
        })
        .where(
          and(
            eq(productVariants.id, line.id),
            isNotNull(productVariants.stock),
            gte(productVariants.stock, line.quantity),
            variantProductTracked
          )
        )
        .returning({ stock: productVariants.stock });

      if (!row) {
        if (await isUntrackedLine(tx, line)) continue;
        throw new InsufficientStockError("variant", line.sourceId);
      }
      const newQuantity = Number(row.stock);
      results.push({
        kind: "variant",
        id: line.sourceId,
        quantity: newQuantity,
        stockBoundaryCrossed: newQuantity === 0,
      });
    }
  }

  if (tracked) await setStockContext(tx, null);
  return results;
}

/**
 * Atomically restores stock for each line (cancellation/return/refund path).
 * `stockBoundaryCrossed` is derived arithmetically from the RETURNING value
 * (previous = new - delta) rather than a second read, since both happen in
 * the same atomic statement and no concurrent writer can interleave.
 *
 * A variant whose stock is NULL (untracked inventory) is skipped rather
 * than failing the whole restore — inventory tracking is opt-in per
 * variant, and a refund must not be blocked by an untracked row. The same
 * goes for a line on an untracked product (0138).
 */
export async function restoreStock(
  tx: Tx,
  lines: readonly StockLine[],
  context: StockContext = { reason: "cancel" }
): Promise<StockResult[]> {
  const results: StockResult[] = [];
  const now = new Date().toISOString();
  const tracked = lines.some((line) => line.quantity > 0);
  if (tracked) await setStockContext(tx, context);

  for (const line of sortedLines(await routeToOrderStore(tx, lines, context))) {
    if (line.quantity <= 0) continue;

    if (line.kind === "product") {
      const [row] = await tx
        .update(products)
        .set({
          quantity: sql`${products.quantity} + ${line.quantity}`,
          updatedAt: now,
        })
        .where(and(eq(products.id, line.id), eq(products.trackStock, true)))
        .returning({ quantity: products.quantity });

      if (!row) {
        if (await isUntrackedLine(tx, line)) continue;
        throw new InsufficientStockError("product", line.sourceId);
      }
      const newQuantity = Number(row.quantity);
      const previousQuantity = newQuantity - line.quantity;
      results.push({
        kind: "product",
        id: line.sourceId,
        quantity: newQuantity,
        stockBoundaryCrossed: previousQuantity <= 0 && newQuantity > 0,
      });
    } else {
      const [row] = await tx
        .update(productVariants)
        .set({
          stock: sql`${productVariants.stock} + ${line.quantity}`,
          updatedAt: now,
        })
        .where(
          and(eq(productVariants.id, line.id), isNotNull(productVariants.stock), variantProductTracked)
        )
        .returning({ stock: productVariants.stock });

      if (!row) continue; // untracked (null-stock) variant — nothing to restore

      const newQuantity = Number(row.stock);
      const previousQuantity = newQuantity - line.quantity;
      results.push({
        kind: "variant",
        id: line.sourceId,
        quantity: newQuantity,
        stockBoundaryCrossed: previousQuantity <= 0 && newQuantity > 0,
      });
    }
  }

  if (tracked) await setStockContext(tx, null);
  return results;
}

/**
 * Raises stock to at least what the lines need, adding only the difference
 * (ROADMAP.md F-42a: "Add what's needed" when an order can't go back on its
 * way). One atomic UPDATE per item, never a read-then-write. Lines for the same
 * item are added up first. Untracked (null-stock) variants and lines on an
 * untracked product (0138) are left alone.
 * Call decrementStock afterwards in the same transaction.
 */
export async function ensureStockAtLeast(
  tx: Tx,
  lines: readonly StockLine[],
  context: StockContext = { reason: "edit" }
): Promise<void> {
  const needed = new Map<string, StockLine>();
  for (const line of await routeToOrderStore(tx, lines, context)) {
    if (line.quantity <= 0) continue;
    const key = `${line.kind}:${line.id}`;
    const quantity = (needed.get(key)?.quantity ?? 0) + line.quantity;
    needed.set(key, { ...line, quantity });
  }
  if (needed.size === 0) return;
  await setStockContext(tx, context);

  const now = new Date().toISOString();
  for (const line of sortedLines([...needed.values()])) {
    if (line.kind === "product") {
      await tx
        .update(products)
        .set({ quantity: sql`GREATEST(${products.quantity}, ${line.quantity})`, updatedAt: now })
        .where(and(eq(products.id, line.id), eq(products.trackStock, true), sql`${products.quantity} < ${line.quantity}`));
    } else {
      await tx
        .update(productVariants)
        .set({ stock: sql`GREATEST(${productVariants.stock}, ${line.quantity})`, updatedAt: now })
        .where(and(eq(productVariants.id, line.id), sql`${productVariants.stock} < ${line.quantity}`, variantProductTracked));
    }
  }
}
