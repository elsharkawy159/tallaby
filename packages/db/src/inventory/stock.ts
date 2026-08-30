import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { products, productVariants } from "../drizzle/schema";
import type { db as dbType } from "../drizzle/database";

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
 * Sorts lines by (kind, id) so a multi-item order and a concurrent order
 * that shares some of the same rows always acquire row locks in the same
 * order, which rules out a lock-ordering deadlock between the two.
 */
function sortedLines(lines: readonly StockLine[]): StockLine[] {
  return [...lines].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/**
 * Atomically decrements stock for each line, in a consistent lock order.
 * Throws InsufficientStockError the instant any line can't be satisfied —
 * the caller's transaction rolls back, so a multi-item order either fully
 * succeeds or fully fails; nothing is decremented partway.
 */
export async function decrementStock(
  tx: Tx,
  lines: readonly StockLine[]
): Promise<StockResult[]> {
  const results: StockResult[] = [];
  const now = new Date().toISOString();

  for (const line of sortedLines(lines)) {
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
            gte(products.quantity, sql`${line.quantity}::numeric`)
          )
        )
        .returning({ quantity: products.quantity });

      if (!row) throw new InsufficientStockError("product", line.id);
      const newQuantity = Number(row.quantity);
      results.push({
        kind: "product",
        id: line.id,
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
            gte(productVariants.stock, line.quantity)
          )
        )
        .returning({ stock: productVariants.stock });

      if (!row) throw new InsufficientStockError("variant", line.id);
      const newQuantity = Number(row.stock);
      results.push({
        kind: "variant",
        id: line.id,
        quantity: newQuantity,
        stockBoundaryCrossed: newQuantity === 0,
      });
    }
  }

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
 * variant, and a refund must not be blocked by an untracked row.
 */
export async function restoreStock(
  tx: Tx,
  lines: readonly StockLine[]
): Promise<StockResult[]> {
  const results: StockResult[] = [];
  const now = new Date().toISOString();

  for (const line of sortedLines(lines)) {
    if (line.quantity <= 0) continue;

    if (line.kind === "product") {
      const [row] = await tx
        .update(products)
        .set({
          quantity: sql`${products.quantity} + ${line.quantity}`,
          updatedAt: now,
        })
        .where(eq(products.id, line.id))
        .returning({ quantity: products.quantity });

      if (!row) throw new InsufficientStockError("product", line.id);
      const newQuantity = Number(row.quantity);
      const previousQuantity = newQuantity - line.quantity;
      results.push({
        kind: "product",
        id: line.id,
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
          and(eq(productVariants.id, line.id), isNotNull(productVariants.stock))
        )
        .returning({ stock: productVariants.stock });

      if (!row) continue; // untracked (null-stock) variant — nothing to restore

      const newQuantity = Number(row.stock);
      const previousQuantity = newQuantity - line.quantity;
      results.push({
        kind: "variant",
        id: line.id,
        quantity: newQuantity,
        stockBoundaryCrossed: previousQuantity <= 0 && newQuantity > 0,
      });
    }
  }

  return results;
}
