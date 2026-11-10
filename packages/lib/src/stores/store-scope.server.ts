/**
 * Store tenancy guards for the fully separate stores work (ROADMAP.md F-87a,
 * docs/plans/stores-separation.md §2; CLAUDE.md rule 5).
 *
 * - `primaryStoreId`: the wallet target of account-level charges (plan, AI
 *   packs, email packs, admin adjustments without a store) once wallets are
 *   per store. One indexed read on `stores_one_primary` (0050).
 * - `storeOwnedBy`: whether a store id from a request belongs to the session's
 *   seller. Never trust a client store id without it.
 * - `storeHasProduct` / `assertStoreProduct`: whether a product belongs to a
 *   store. Callers check `storeOwnedBy` first; these only check the pair.
 *
 * Nothing calls these yet (Phase A adds no behaviour). Every function takes
 * an optional Drizzle handle so it can run inside the caller's transaction.
 */
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

export type StoreProductOptions = {
  q?: Queryable;
  /** Whether the catalog split has run; read from `stores_catalog_split` when omitted. */
  catalogSplit?: boolean;
};

/**
 * Whether the product belongs to the store, in any status (drafts and Trash
 * included: this is the seller-side ownership check, not "the storefront
 * sells it"; that is `storeSellsProduct` in catalog.server.ts).
 *
 * Before the catalog split: the product is the store's seller's, and the store
 * shows it (`catalog_mode = 'all'`, or it is in the store's `store_products`).
 * After it (`stores_catalog_split` on): `products.store_id` is the store, and
 * the seller still matches.
 */
export async function storeHasProduct(
  storeId: string,
  productId: string,
  options: StoreProductOptions = {},
): Promise<boolean> {
  if (!UUID_RE.test(storeId) || !UUID_RE.test(productId)) return false;
  const q = options.q ?? db;
  const split = options.catalogSplit ?? (await isSwitchOn("stores_catalog_split", q));

  const membership = split
    ? eq(products.storeId, stores.id)
    : sql`(${stores.catalogMode} = 'all' OR EXISTS (
        SELECT 1 FROM ${storeProducts} sp WHERE sp.store_id = ${stores.id} AND sp.product_id = ${products.id}
      ))`;

  const [row] = await q
    .select({ ok: sql<boolean>`true` })
    .from(stores)
    .innerJoin(products, and(eq(products.id, productId), eq(products.sellerId, stores.sellerId)))
    .where(and(eq(stores.id, storeId), isNull(stores.deletedAt), membership))
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
