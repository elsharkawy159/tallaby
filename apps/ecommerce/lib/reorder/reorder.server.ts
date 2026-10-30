import { and, cartItems, carts, db, eq, inArray, orderItems, orders, products, productVariants, sql } from "@workspace/db";
import { isUuid } from "@workspace/lib/catalog-share";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { activeCartWhere, getCartScope, isRequestStoreOffline, type CartScope } from "@/lib/storefront.server";
import { buildReorderLines, reorderCartKey, type ReorderPlan, type ReorderProduct } from "./reorder.lib";

/**
 * "Order again" (ROADMAP.md F-01e, store part). Only on a store host, only
 * the order's owner (the session or guest-cookie user that placed it), and
 * only an order placed on THIS store. Everything is read fresh (no cache:
 * carts and orders are never cached, CLAUDE.md rule 8).
 */

type Owned = { userId: string; scope: CartScope };

/** The current user and store when this order may be re-ordered here, else null. */
export async function reorderAccess(orderId: string): Promise<Owned | null> {
  if (!isUuid(orderId)) return null;
  const [userId, scope] = await Promise.all([getCurrentUserId(), getCartScope()]);
  if (!userId || !scope) return null;
  if (await isRequestStoreOffline()) return null;
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId), eq(orders.storeId, scope.storeId)))
    .limit(1);
  return row ? { userId, scope } : null;
}

/** What "Order again" would put in the cart now. */
export async function planReorder(orderId: string, { userId, scope }: Owned): Promise<ReorderPlan> {
  const items = await db
    .select({ productId: orderItems.productId, variantId: orderItems.variantId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(and(eq(orderItems.orderId, orderId), eq(orderItems.sellerId, scope.sellerId)));
  const ids = [...new Set(items.map((item) => item.productId))];
  if (!ids.length) return { lines: [], skipped: [], capped: 0 };

  const [rows, variants, cart] = await Promise.all([
    db
      .select({
        id: products.id,
        sellerId: products.sellerId,
        status: products.status,
        deletedAt: products.deletedAt,
        quantity: products.quantity,
        // The store's catalog: every product in "all" mode, its picks in "selected" mode.
        inCatalog: sql<boolean>`(
          EXISTS (SELECT 1 FROM stores s WHERE s.id = ${scope.storeId} AND s.seller_id = ${scope.sellerId} AND s.catalog_mode = 'all')
          OR EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = ${scope.storeId} AND sp.product_id = ${products.id})
        )`,
      })
      .from(products)
      .where(and(inArray(products.id, ids), eq(products.sellerId, scope.sellerId))),
    db
      .select({ id: productVariants.id, productId: productVariants.productId, stock: productVariants.stock })
      .from(productVariants)
      .where(inArray(productVariants.productId, ids)),
    db
      .select({ productId: cartItems.productId, variant: cartItems.variant, quantity: cartItems.quantity })
      .from(cartItems)
      .innerJoin(carts, eq(carts.id, cartItems.cartId))
      .where(activeCartWhere(userId, scope)),
  ]);

  const list: ReorderProduct[] = rows.map((row) => ({
    id: row.id,
    sellerId: row.sellerId,
    status: row.status,
    deletedAt: row.deletedAt,
    quantity: Number(row.quantity ?? 0) || 0,
    inCatalog: Boolean(row.inCatalog),
    variants: variants.filter((v) => v.productId === row.id).map((v) => ({ id: v.id, stock: Number(v.stock ?? 0) || 0 })),
  }));
  const inCart = new Map<string, number>();
  for (const line of cart) {
    const key = reorderCartKey(line.productId, (line.variant as { id?: string } | null)?.id ?? null);
    inCart.set(key, (inCart.get(key) ?? 0) + (Number(line.quantity) || 0));
  }
  return buildReorderLines(items, list, { sellerId: scope.sellerId, inCart });
}
