/**
 * A store's catalog (PLAN.md §8.2, D24, P4-07). Products stay owned by the
 * seller; each store shows either all of the seller's active products
 * (`catalog_mode = 'all'`, the default) or only the ones listed in
 * `store_products` (`'selected'`).
 *
 * Seller-side functions take the session's sellerId and scope every query by
 * it; the `store_products_same_seller` trigger (0050) is the backstop.
 */
import { and, cartItems, carts, db, eq, inArray, isNull, notInArray, products, sql, storeProducts, stores } from "@workspace/db";
import { isSwitchOn } from "./platform-switches.server";
import { productInStore } from "./store-scope.server";
import { storeCatalogInputSchema, type StoreCatalogInput, type StoreCatalogMode } from "./stores.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StoreCatalog = { mode: StoreCatalogMode; productIds: string[] };

export type StoreCatalogError = "not_found" | "store_read_only" | "invalid_input" | "empty_selection" | "invalid_product";

class CatalogError extends Error {
  constructor(readonly code: StoreCatalogError) {
    super(code);
  }
}

const ownStore = (sellerId: string, storeId: string) =>
  and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt));

/** The store's mode and its selected product ids, in the seller's order. Null for a foreign store. */
export async function getStoreCatalog(sellerId: string, storeId: string, q: Queryable = db): Promise<StoreCatalog | null> {
  if (!UUID_RE.test(storeId)) return null;
  const [store] = await q.select({ mode: stores.catalogMode }).from(stores).where(ownStore(sellerId, storeId)).limit(1);
  if (!store) return null;
  const rows = await q
    .select({ productId: storeProducts.productId })
    .from(storeProducts)
    .where(eq(storeProducts.storeId, storeId))
    .orderBy(storeProducts.position, storeProducts.createdAt);
  return { mode: store.mode as StoreCatalogMode, productIds: rows.map((r) => r.productId) };
}

/**
 * Sets the mode and replaces the selection. The selection is kept when the
 * store switches back to "all", so switching again restores it. Every id must
 * be one of this seller's products (any status: a draft product can be picked
 * now and shows once it is active).
 */
export async function setStoreCatalog(
  sellerId: string,
  storeId: string,
  input: StoreCatalogInput,
  q: Queryable = db,
): Promise<{ success: true; data: StoreCatalog } | { success: false; error: StoreCatalogError }> {
  const parsed = storeCatalogInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { mode, productIds } = parsed.data;
  if (mode === "selected" && productIds.length === 0) return { success: false, error: "empty_selection" };
  if (!UUID_RE.test(storeId)) return { success: false, error: "not_found" };

  try {
    await q.transaction(async (tx) => {
      const [store] = await tx
        .select({ status: stores.status })
        .from(stores)
        .where(ownStore(sellerId, storeId))
        .for("update");
      if (!store) throw new CatalogError("not_found");
      if (store.status !== "active") throw new CatalogError("store_read_only");

      if (productIds.length) {
        const owned = await tx
          .select({ id: products.id })
          .from(products)
          .where(and(eq(products.sellerId, sellerId), inArray(products.id, productIds)));
        if (owned.length !== productIds.length) throw new CatalogError("invalid_product");
      }

      await tx
        .delete(storeProducts)
        .where(
          productIds.length
            ? and(eq(storeProducts.storeId, storeId), notInArray(storeProducts.productId, productIds))
            : eq(storeProducts.storeId, storeId),
        );
      if (productIds.length) {
        await tx
          .insert(storeProducts)
          .values(productIds.map((productId, position) => ({ storeId, productId, position })))
          .onConflictDoUpdate({
            target: [storeProducts.storeId, storeProducts.productId],
            set: { position: sql`excluded.position` },
          });
      }
      await tx.update(stores).set({ catalogMode: mode, updatedAt: sql`now()` }).where(ownStore(sellerId, storeId));
    });
  } catch (error) {
    if (error instanceof CatalogError) return { success: false, error: error.code };
    throw error;
  }
  return { success: true, data: { mode, productIds } };
}

/** `stores_catalog_split`, when the caller already read it (once per request, or with its transaction). */
export type StoreCatalogCheckOptions = { catalogSplit?: boolean };

/**
 * Whether a store host may sell this product: an active product the store
 * shows (`productInStore`, scope `shown`: before the split, the store's
 * seller and, in "selected" mode, one of its picks; after it,
 * `products.store_id = store`). Public (no session): the add-to-cart, gift
 * and manual-order guards call it with the store from the request host or the
 * cart, never a client value. Reads the switch with `q` unless passed.
 */
export async function storeSellsProduct(
  storeId: string,
  productId: string,
  q: Queryable = db,
  options: StoreCatalogCheckOptions = {},
): Promise<boolean> {
  if (!UUID_RE.test(storeId) || !UUID_RE.test(productId)) return false;
  const catalogSplit = options.catalogSplit ?? (await isSwitchOn("stores_catalog_split", q));
  const [row] = await q
    .select({ ok: sql<boolean>`true` })
    .from(products)
    .where(
      and(
        eq(products.id, productId),
        eq(products.status, "active"),
        productInStore(storeId, { catalogSplit, scope: "shown" }),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/**
 * The ids in `productIds` the store does not show (`productInStore`, scope
 * `shown`), in first-seen order, without duplicates. Status is not checked
 * (callers refuse inactive products with their own message). A malformed
 * store id shows nothing. `placeOrderFromCart` runs it with its transaction,
 * so the switch read, this check and the stock decrement share it.
 */
export async function productsOutsideStore(
  storeId: string,
  productIds: readonly string[],
  q: Queryable = db,
  options: StoreCatalogCheckOptions = {},
): Promise<string[]> {
  const ids = [...new Set(productIds)];
  if (ids.length === 0) return [];
  const valid = ids.filter((id) => UUID_RE.test(id));
  if (!UUID_RE.test(storeId) || valid.length === 0) return ids;
  const catalogSplit = options.catalogSplit ?? (await isSwitchOn("stores_catalog_split", q));
  const rows = await q
    .select({ id: products.id })
    .from(products)
    .where(and(inArray(products.id, valid), productInStore(storeId, { catalogSplit, scope: "shown" })));
  const inside = new Set(rows.map((r) => r.id));
  return ids.filter((id) => !inside.has(id));
}

/**
 * Checkout guard for store carts: products in the cart (not saved for later)
 * that the cart's own store (`carts.store_id`) does not show
 * (`productsOutsideStore`): the seller took them out of a selected catalog
 * after they were added, or, after the split, they belong to another store.
 * Empty for marketplace carts.
 */
export async function cartProductsOutsideStoreCatalog(
  cartId: string,
  q: Queryable = db,
  options: StoreCatalogCheckOptions = {},
): Promise<string[]> {
  if (!UUID_RE.test(cartId)) return [];
  const [cart] = await q.select({ storeId: carts.storeId }).from(carts).where(eq(carts.id, cartId)).limit(1);
  if (!cart?.storeId) return [];
  const rows = await q
    .select({ productId: cartItems.productId })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.savedForLater, false)));
  if (rows.length === 0) return [];
  return productsOutsideStore(
    cart.storeId,
    rows.map((r) => r.productId),
    q,
    options,
  );
}
