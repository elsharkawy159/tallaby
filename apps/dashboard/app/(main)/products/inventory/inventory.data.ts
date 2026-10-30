import { db, sql } from "@workspace/db";
import { HISTORY_LIMIT, LOW_STOCK_LIMIT, lowStockThreshold, movementReason } from "./inventory.lib";
import type { InventoryLine, ProductInventory, StockMovementRow } from "./inventory.types";

/**
 * Products › Inventory reads (ROADMAP.md F-10c, migration 0125). Every query
 * is scoped to the session seller (the caller passes `requireSeller().sellerId`)
 * and skips products in Trash (`deleted_at IS NULL`, 0123) or purged.
 */

const rowsOf = <T,>(result: unknown): T[] =>
  (Array.isArray(result) ? result : ((result as { rows?: T[] }).rows ?? [])) as T[];

type LineRow = {
  product_id: string;
  variant_id: string | null;
  title: string | null;
  variant_title: string | null;
  images: unknown;
  variant_image: string | null;
  stock: number;
  threshold: number | null;
  status: string;
  waiting: number | null;
};

function firstImage(images: unknown): string | null {
  const list = Array.isArray(images) ? images : typeof images === "string" ? [images] : [];
  const hit = list.find((i) => typeof i === "string" && i.trim() !== "");
  return typeof hit === "string" ? hit : null;
}

function toLine(r: LineRow): InventoryLine {
  return {
    productId: r.product_id,
    variantId: r.variant_id,
    title: r.title ?? "",
    variantTitle: r.variant_title,
    image: r.variant_image || firstImage(r.images),
    stock: Number(r.stock) || 0,
    threshold: lowStockThreshold(r.threshold),
    status: r.status,
    waiting: Number(r.waiting) || 0,
  };
}

/**
 * Stock lines (products without variants, and tracked variants) of the
 * seller's products, optionally for one product only. The title is the
 * dashboard locale's, else any.
 */
function linesQuery(sellerId: string, locale: "ar" | "en", productId: string | null, lowOnly: boolean) {
  const productFilter = productId ? sql`AND p.id = ${productId}` : sql``;
  const lowFilter = lowOnly ? sql`WHERE l.stock <= coalesce(l.threshold, 5)` : sql``;
  return sql`
    WITH owned AS (
      SELECT p.id, p.images, p.status::text AS status, p.low_stock_threshold, p.quantity,
        (SELECT t.title FROM product_translations t WHERE t.product_id = p.id
          ORDER BY (t.locale = ${locale}) DESC, t.created_at LIMIT 1) AS title
      FROM products p
      WHERE p.seller_id = ${sellerId} AND p.deleted_at IS NULL AND p.purged_at IS NULL ${productFilter}
    ),
    lines AS (
      SELECT o.id AS product_id, NULL::uuid AS variant_id, o.title, NULL::text AS variant_title,
        o.images, NULL::text AS variant_image, round(coalesce(o.quantity, 0))::int AS stock,
        o.low_stock_threshold AS threshold, o.status
      FROM owned o
      WHERE NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = o.id)
      UNION ALL
      SELECT o.id, v.id, o.title, v.title, o.images, v.image_url, v.stock,
        o.low_stock_threshold, o.status
      FROM owned o JOIN product_variants v ON v.product_id = o.id
      WHERE v.stock IS NOT NULL
    )
    SELECT l.*,
      -- Open back-in-stock alerts on this line (0126, F-23a), this seller's only.
      (SELECT count(*)::int FROM store_stock_subscriptions a
        WHERE a.seller_id = ${sellerId} AND a.product_id = l.product_id
          AND a.variant_id IS NOT DISTINCT FROM l.variant_id
          AND a.notified_at IS NULL AND a.cancelled_at IS NULL) AS waiting
    FROM lines l ${lowFilter}
    ORDER BY l.stock ASC, l.title ASC NULLS LAST, l.variant_title ASC NULLS LAST
    LIMIT ${LOW_STOCK_LIMIT}
  `;
}

/** Lines at or below their threshold (out of stock first). */
export async function listLowStock(sellerId: string, locale: "ar" | "en"): Promise<InventoryLine[]> {
  const result = await db.execute(linesQuery(sellerId, locale, null, true));
  return rowsOf<LineRow>(result).map(toLine);
}

type MovementRowDb = {
  id: string;
  variant_id: string | null;
  variant_title: string | null;
  delta: number;
  stock_after: number;
  reason: string;
  order_id: string | null;
  order_number: string | null;
  by_seller: boolean;
  created_at: string | Date;
};

/** One product's stock lines and its latest history, or null when it is not this seller's (or in Trash). */
export async function getProductInventory(
  sellerId: string,
  userId: string,
  productId: string,
  locale: "ar" | "en",
): Promise<ProductInventory | null> {
  const lines = rowsOf<LineRow>(await db.execute(linesQuery(sellerId, locale, productId, false))).map(toLine);
  const owned = rowsOf<{ title: string | null }>(
    await db.execute(sql`
      SELECT (SELECT t.title FROM product_translations t WHERE t.product_id = p.id
        ORDER BY (t.locale = ${locale}) DESC, t.created_at LIMIT 1) AS title
      FROM products p
      WHERE p.id = ${productId} AND p.seller_id = ${sellerId} AND p.deleted_at IS NULL AND p.purged_at IS NULL
    `),
  )[0];
  if (!owned) return null;

  // Scoped twice: the movement's own seller_id and the product id checked above.
  const history = rowsOf<MovementRowDb>(
    await db.execute(sql`
      SELECT m.id, m.variant_id, v.title AS variant_title, m.delta, m.stock_after, m.reason,
        m.order_id, o.order_number, (m.actor_user_id = ${userId}) AS by_seller, m.created_at
      FROM stock_movements m
      LEFT JOIN product_variants v ON v.id = m.variant_id AND v.product_id = m.product_id
      LEFT JOIN orders o ON o.id = m.order_id
      WHERE m.seller_id = ${sellerId} AND m.product_id = ${productId}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ${HISTORY_LIMIT}
    `),
  ).map(
    (r): StockMovementRow => ({
      id: r.id,
      variantId: r.variant_id,
      variantTitle: r.variant_title,
      delta: Number(r.delta),
      stockAfter: Number(r.stock_after),
      reason: movementReason(r.reason),
      orderId: r.order_id,
      orderNumber: r.order_number,
      bySeller: r.by_seller === true,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }),
  );

  return { productId, title: owned.title ?? "", lines, history };
}
