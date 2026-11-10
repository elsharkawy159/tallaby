/**
 * Store tenancy guards for the fully separate stores work (ROADMAP.md F-87a,
 * F-87c; docs/plans/stores-separation.md §2; CLAUDE.md rule 5).
 *
 * - `primaryStoreId`: the wallet target of account-level charges (plan, AI
 *   packs, email packs, admin adjustments without a store) once wallets are
 *   per store. One indexed read on `stores_one_primary` (0050).
 * - `storeOwnedBy`: whether a store id from a request belongs to the session's
 *   seller. Never trust a client store id without it.
 * - `productInStore`: the one SQL condition "this product belongs to this
 *   store", for list reads and bulk writes (F-87c).
 * - `productShownInStore` / `StoreCatalogScope`: its storefront form (scope
 *   `shown`), for every store-host catalog read (F-87c slice 4);
 *   `productInStoreOf` takes the store id from a column, for one query over
 *   many stores (the back-in-stock cron).
 * - `storeHasProduct` / `assertStoreProduct`: the same condition for one pair.
 *   Callers check `storeOwnedBy` (or `requireStore`) first; these only check
 *   the pair.
 *
 * Every function takes an optional Drizzle handle so it can run inside the
 * caller's transaction.
 */
import type { SQL } from "drizzle-orm";
import { and, db, eq, isNull, products, sql, storeProducts, stores } from "@workspace/db";
import { isSwitchOn } from "./platform-switches.server";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StoreScopeErrorCode = "store_not_found" | "product_not_in_store";

export class StoreScopeError extends Error {
  constructor(readonly code: StoreScopeErrorCode) {
    super(code);
    this.name = "StoreScopeError";
  }
}

/**
 * The seller's primary store id, or null when the seller has none (no seller
 * row, or a deleted primary). The partial unique index `stores_one_primary`
 * (seller_id) WHERE is_primary serves the read.
 */
export async function primaryStoreId(q: Queryable, sellerId: string): Promise<string | null> {
  if (!UUID_RE.test(sellerId)) return null;
  const [row] = await q
    .select({ id: stores.id })
    .from(stores)
    .where(and(eq(stores.sellerId, sellerId), eq(stores.isPrimary, true), isNull(stores.deletedAt)))
    .limit(1);
  return row?.id ?? null;
}

/** True when the store exists, is not deleted and belongs to this seller (archived stores still count). */
export async function storeOwnedBy(sellerId: string, storeId: string, q: Queryable = db): Promise<boolean> {
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId)) return false;
  const [row] = await q
    .select({ id: stores.id })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  return Boolean(row);
}

/**
 * Which pairs count BEFORE the catalog split (after it, both mean
 * `products.store_id = store`):
 * - `shown`: the store shows the product (`catalog_mode = 'all'`, or a
 *   `store_products` row). The storefront and agent meaning.
 * - `managed`: the product is in the store's account catalog (same seller).
 *   The dashboard meaning while products are still one account catalog: the
 *   Products page lists every account product whichever store is selected,
 *   so a store in 'selected' mode still manages the products it doesn't show
 *   (otherwise a product no store shows could not be edited at all).
 */
export type ProductStoreScope = "shown" | "managed";

export type ProductInStoreOptions = {
  /** Whether the catalog split has run (`stores_catalog_split`). Required: this SQL builder never reads the switch. */
  catalogSplit: boolean;
  scope?: ProductStoreScope;
};

/**
 * The SQL condition "this `products` row belongs to store `storeId`", for a
 * WHERE on `products` (select, update or delete). The store must exist, not
 * be deleted and have the product's seller; then, after the split,
 * `products.store_id` is the store, and before it the `scope` rule above.
 * A malformed store id matches nothing (no query error). It never checks the
 * store against the session: callers run `requireStore`/`storeOwnedBy` first.
 */
export function productInStore(storeId: string, options: ProductInStoreOptions): SQL {
  if (typeof storeId !== "string" || !UUID_RE.test(storeId)) return sql`false`;
  return productInStoreSql(sql`${storeId}`, options);
}

/**
 * `productInStore` with the store id taken from a column of the outer query
 * (for example `a.store_id`), for one query over rows of many stores. Same
 * rule, same SQL; the caller writes the column, never a client value.
 */
export function productInStoreOf(storeIdColumn: SQL, options: ProductInStoreOptions): SQL {
  return productInStoreSql(storeIdColumn, options);
}

function productInStoreSql(storeId: SQL, { catalogSplit, scope = "shown" }: ProductInStoreOptions): SQL {
  const store =sql`scope_store.id = ${storeId} AND scope_store.deleted_at IS NULL AND scope_store.seller_id = ${products.sellerId}`;
  if (catalogSplit) {
    return sql`(${products.storeId} = ${storeId} AND EXISTS (SELECT 1 FROM ${stores} scope_store WHERE ${store}))`;
  }
  if (scope === "managed") {
    return sql`EXISTS (SELECT 1 FROM ${stores} scope_store WHERE ${store})`;
  }
  return sql`EXISTS (SELECT 1 FROM ${stores} scope_store WHERE ${store} AND (scope_store.catalog_mode = 'all' OR EXISTS (
    SELECT 1 FROM ${storeProducts} scope_sp WHERE scope_sp.store_id = scope_store.id AND scope_sp.product_id = ${products.id}
  )))`;
}

/**
 * The catalog of one store host: which store, and whether the catalog split has
 * run. Storefront reads take it (never a client value: the store comes from the
 * request host, the switch from `isSwitchOn` outside any cached function), and
 * a cached read puts both in its key, so an entry never mixes stores or modes.
 */
export type StoreCatalogScope = { storeId: string; catalogSplit: boolean };

/** `productInStore(storeId, { catalogSplit, scope: 'shown' })`: what the store's storefront shows. */
export function productShownInStore({ storeId, catalogSplit }: StoreCatalogScope): SQL {
  return productInStore(storeId, { catalogSplit, scope: "shown" });
}

/**
 * The same condition for raw SQL that aliases `products` (`FROM products p`):
 * an EXISTS on the bare table, so the shared condition's column names resolve.
 * `alias` is a plain identifier the caller writes.
 */
export function aliasedProductShownInStore(alias: string, scope: StoreCatalogScope): SQL {
  if (!/^[a-z_][a-z0-9_]*$/.test(alias)) throw new Error("aliasedProductShownInStore: bad alias");
  return sql`EXISTS (SELECT 1 FROM ${products} WHERE ${products.id} = ${sql.raw(alias)}.id AND ${productShownInStore(scope)})`;
}

export type StoreProductOptions = {
  q?: Queryable;
  /** Whether the catalog split has run; read from `stores_catalog_split` when omitted. */
  catalogSplit?: boolean;
  /** Before the split: `shown` (default) or `managed`; see `ProductStoreScope`. */
  scope?: ProductStoreScope;
};

/**
 * Whether the product belongs to the store, in any status (drafts and Trash
 * included: this is the ownership check, not "the storefront sells it"; that
 * is `storeSellsProduct` in catalog.server.ts). One read of `productInStore`,
 * so this guard and the list/bulk WHERE clauses cannot drift.
 */
export async function storeHasProduct(
  storeId: string,
  productId: string,
  options: StoreProductOptions = {},
): Promise<boolean> {
  if (!UUID_RE.test(storeId) || !UUID_RE.test(productId)) return false;
  const q = options.q ?? db;
  const catalogSplit = options.catalogSplit ?? (await isSwitchOn("stores_catalog_split", q));

  const [row] = await q
    .select({ ok: sql<boolean>`true` })
    .from(products)
    .where(and(eq(products.id, productId), productInStore(storeId, { catalogSplit, scope: options.scope })))
    .limit(1);
  return Boolean(row);
}

/** Throws `StoreScopeError('product_not_in_store')` unless the product belongs to the store. */
export async function assertStoreProduct(
  storeId: string,
  productId: string,
  options: StoreProductOptions = {},
): Promise<void> {
  if (!(await storeHasProduct(storeId, productId, options))) {
    throw new StoreScopeError("product_not_in_store");
  }
}

/** Throws `StoreScopeError('store_not_found')` unless the store is this seller's. */
export async function assertStoreOwnedBy(sellerId: string, storeId: string, q: Queryable = db): Promise<void> {
  if (!(await storeOwnedBy(sellerId, storeId, q))) {
    throw new StoreScopeError("store_not_found");
  }
}
