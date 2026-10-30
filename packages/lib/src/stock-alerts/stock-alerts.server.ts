import { randomBytes } from "node:crypto";
import { and, db, eq, isNull, productVariants, products, sql, storeProducts, stores, storeStockSubscriptions } from "@workspace/db";
import {
  alertLocale,
  alertTargetInStock,
  isUnsubscribeToken,
  isUuid,
  normalizeAlertEmail,
  STOCK_ALERT_BATCH,
  STOCK_ALERT_MAX_AGE_DAYS,
  STOCK_ALERT_MAX_OPEN_PER_EMAIL,
} from "./stock-alerts.lib";

/**
 * Back-in-stock alerts (ROADMAP.md F-23a, 0126). Server-only. Emails are
 * personal data: never logged, never cached, never shown to anyone (the
 * seller sees only counts).
 *
 * - subscribeToStockAlert: the storefront action passes the store and seller
 *   resolved from the request HOST; the product must be that seller's, sold
 *   by that store, live and out of stock right now.
 * - claimStockAlerts / releaseStockAlertClaim: the cron's idempotent claim.
 * - cancelStockAlertsByToken: the email's unsubscribe link.
 */

type Queryable = typeof db;
const rowsOf = <T,>(result: unknown): T[] => [...(result as Iterable<T>)];

export type SubscribeStockAlertInput = {
  storeId: string;
  sellerId: string;
  productId: unknown;
  variantId: unknown;
  email: unknown;
  locale: unknown;
};

export type SubscribeStockAlertResult =
  | { ok: true; status: "created" | "exists" }
  | { ok: false; error: "invalid" | "notFound" | "inStock" | "tooMany" };

export async function subscribeToStockAlert(
  input: SubscribeStockAlertInput,
  q: Queryable = db,
): Promise<SubscribeStockAlertResult> {
  const email = normalizeAlertEmail(input.email);
  if (!email || !isUuid(input.productId)) return { ok: false, error: "invalid" };
  const productId = input.productId;
  const variantId = input.variantId == null || input.variantId === "" ? null : input.variantId;
  if (variantId !== null && !isUuid(variantId)) return { ok: false, error: "invalid" };

  const [product] = await q
    .select({ id: products.id, quantity: products.quantity, catalogMode: stores.catalogMode })
    .from(products)
    .innerJoin(stores, and(eq(stores.id, input.storeId), eq(stores.sellerId, input.sellerId)))
    .where(
      and(
        eq(products.id, productId),
        eq(products.sellerId, input.sellerId),
        eq(products.status, "active"),
        isNull(products.deletedAt),
        isNull(stores.deletedAt),
      ),
    )
    .limit(1);
  if (!product) return { ok: false, error: "notFound" };

  if (product.catalogMode === "selected") {
    const [picked] = await q
      .select({ productId: storeProducts.productId })
      .from(storeProducts)
      .where(and(eq(storeProducts.storeId, input.storeId), eq(storeProducts.productId, productId)))
      .limit(1);
    if (!picked) return { ok: false, error: "notFound" };
  }

  const variants = await q
    .select({ id: productVariants.id, stock: productVariants.stock })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));
  // A product with variants is followed per variant (the page always has one selected).
  if (variants.length > 0 && variantId === null) return { ok: false, error: "invalid" };
  const variant = variantId ? variants.find((v) => v.id === variantId) : null;
  if (variantId && !variant) return { ok: false, error: "notFound" };

  const inStock = alertTargetInStock({
    variantId,
    variantStock: variant?.stock ?? null,
    productQuantity: product.quantity,
    variantStocks: variants.map((v) => v.stock),
  });
  if (inStock) return { ok: false, error: "inStock" };

  const open = rowsOf<{ n: number }>(
    await q.execute(sql`
      SELECT count(*)::int AS n FROM store_stock_subscriptions
      WHERE store_id = ${input.storeId} AND email = ${email} AND notified_at IS NULL AND cancelled_at IS NULL
    `),
  )[0];
  if ((open?.n ?? 0) >= STOCK_ALERT_MAX_OPEN_PER_EMAIL) return { ok: false, error: "tooMany" };

  const inserted = await q
    .insert(storeStockSubscriptions)
    .values({
      storeId: input.storeId,
      sellerId: input.sellerId,
      productId,
      variantId,
      email,
      locale: alertLocale(input.locale),
      unsubscribeToken: randomBytes(24).toString("hex"),
    })
    // The open-alert unique index: the same visitor asking twice is fine.
    .onConflictDoNothing()
    .returning({ id: storeStockSubscriptions.id });
  return { ok: true, status: inserted.length > 0 ? "created" : "exists" };
}

/**
 * Claims up to `limit` open alerts whose product/variant has stock again on a
 * live store (published website, product active, not in Trash, still in the
 * store's catalog), oldest first. The claim is `notified_at = now()`, taken
 * with FOR UPDATE SKIP LOCKED, so two overlapping runs never take the same
 * row. The caller sends one email per id and releases the ones that failed.
 */
export async function claimStockAlerts({ limit = STOCK_ALERT_BATCH }: { limit?: number } = {}, q: Queryable = db): Promise<string[]> {
  const n = Math.max(1, Math.min(500, Math.floor(limit)));
  const rows = rowsOf<{ id: string }>(
    await q.execute(sql`
      UPDATE store_stock_subscriptions s
      SET notified_at = now()
      WHERE s.notified_at IS NULL AND s.id IN (
        SELECT a.id
        FROM store_stock_subscriptions a
        JOIN products p ON p.id = a.product_id AND p.seller_id = a.seller_id
        JOIN stores st ON st.id = a.store_id AND st.seller_id = a.seller_id
        LEFT JOIN product_variants v ON v.id = a.variant_id AND v.product_id = a.product_id
        WHERE a.notified_at IS NULL
          AND a.cancelled_at IS NULL
          AND a.created_at > now() - make_interval(days => ${STOCK_ALERT_MAX_AGE_DAYS})
          AND p.status = 'active' AND p.deleted_at IS NULL
          AND st.deleted_at IS NULL AND st.status = 'active' AND st.site_status = 'published'
          AND (st.catalog_mode <> 'selected'
               OR EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = a.store_id AND sp.product_id = a.product_id))
          AND CASE
                WHEN a.variant_id IS NOT NULL THEN coalesce(v.stock, 0) > 0
                ELSE p.quantity > 0
                  OR EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = a.product_id AND pv.stock > 0)
              END
        ORDER BY a.created_at
        LIMIT ${n}
        FOR UPDATE OF a SKIP LOCKED
      )
      RETURNING s.id
    `),
  );
  return rows.map((r) => r.id);
}

/**
 * Gives a claimed alert back after a failed send, so the next run tries again.
 * If the visitor subscribed again meanwhile (a new open row for the same
 * target), the unique index refuses and the claim stays: the new row is sent.
 */
export async function releaseStockAlertClaim(id: string, q: Queryable = db): Promise<void> {
  try {
    await q.execute(sql`
      UPDATE store_stock_subscriptions SET notified_at = NULL
      WHERE id = ${id} AND notified_at IS NOT NULL AND cancelled_at IS NULL
    `);
  } catch {
    // Unique violation (see above): nothing to do.
  }
}

/**
 * The unsubscribe link: cancels every open alert of that email on that store.
 * Returns the store name for the confirmation page, or null for an unknown token.
 */
export async function cancelStockAlertsByToken(
  token: unknown,
  q: Queryable = db,
): Promise<{ storeName: string; cancelled: number } | null> {
  if (!isUnsubscribeToken(token)) return null;
  const [row] = await q
    .select({ storeId: storeStockSubscriptions.storeId, email: storeStockSubscriptions.email, storeName: stores.name })
    .from(storeStockSubscriptions)
    .innerJoin(stores, eq(stores.id, storeStockSubscriptions.storeId))
    .where(eq(storeStockSubscriptions.unsubscribeToken, token))
    .limit(1);
  if (!row) return null;
  const cancelled = rowsOf<{ id: string }>(
    await q.execute(sql`
      UPDATE store_stock_subscriptions SET cancelled_at = now()
      WHERE store_id = ${row.storeId} AND email = ${row.email} AND notified_at IS NULL AND cancelled_at IS NULL
      RETURNING id
    `),
  ).length;
  return { storeName: row.storeName, cancelled };
}
