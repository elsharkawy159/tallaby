import type { SQL } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { productInStore, storeHasProduct } from "@workspace/lib/stores/scope/server";
import type { AccessOptions } from "@/lib/auth/access.lib";
import {
  AccessError,
  isAccessError,
  requireStore,
  type SellerContext,
  type StoreContext,
} from "@/lib/auth/require-seller.server";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";

/**
 * Store authorization for dashboard product reads and writes (ROADMAP.md F-87c
 * slices 1–2; docs/plans/stores-separation-f87c-slices.md; CLAUDE.md rule 5).
 *
 * Every product page and action takes an explicit `storeId`: the
 * `/stores/[storeId]/products/*` segment, or the argument a client sends. It
 * is checked here against the session's seller (`requireStore`: a foreign,
 * deleted or forged store is `not_found`), and every product id against that
 * store with the shared `productInStore` condition, scope `managed`:
 * - before the catalog split (switch off): the product is the store's
 *   seller's, exactly today's account rule;
 * - after it: `products.store_id` is the store.
 * The `tallaby_store` cookie only picks where links go; it is never read here.
 *
 * Archived and admin-suspended stores (slice 2 decision): writes need an
 * active store (`forWrite`) only once the split is on. Before it the products
 * are one account catalog that every store of the seller manages, so a store's
 * status never owned them: blocking writes there would lock a seller whose
 * primary store an admin suspended out of their whole catalog, which today
 * they are not. Reads never check the status (the pages show read-only data).
 */

export type ProductStoreContext = {
  seller: SellerContext;
  store: StoreContext;
  catalogSplit: boolean;
  /** `productInStore(store.id, { catalogSplit, scope: 'managed' })`, for a WHERE on `products`. */
  inStore: SQL;
};

export type ProductStoreOptions = AccessOptions & {
  /** A read (page, list, export): never refused for the store's status. Default: a write. */
  read?: boolean;
};

/** The store named by the request, owned by the session's seller, with the product condition for it. */
export async function requireProductStore(
  storeId: unknown,
  options: ProductStoreOptions = {},
): Promise<ProductStoreContext> {
  const { read = false, ...access } = options;
  const catalogSplit = await isSwitchOn("stores_catalog_split");
  // After the split a product write is a write to that store: archived/suspended stores are read-only.
  const storeAccess: AccessOptions = !read && catalogSplit ? { ...access, forWrite: true } : access;
  const { seller, store } = await requireStore(typeof storeId === "string" ? storeId : "", storeAccess);
  return { seller, store, catalogSplit, inStore: productInStore(store.id, { catalogSplit, scope: "managed" }) };
}

/** `requireProductStore` plus one product: a product outside the store is `not_found` (never says which). */
export async function requireStoreProduct(
  storeId: unknown,
  productId: unknown,
  options: ProductStoreOptions = {},
): Promise<ProductStoreContext> {
  const ctx = await requireProductStore(storeId, options);
  const ok =
    typeof productId === "string" &&
    (await storeHasProduct(ctx.store.id, productId, { catalogSplit: ctx.catalogSplit, scope: "managed" }));
  if (!ok) throw new AccessError("not_found");
  return ctx;
}

/**
 * `requireProductStore` for a `/stores/[storeId]/products/*` page (a read). A
 * missing, deleted, foreign or forged store is a 404, as on every other store
 * page (`loadStorePage`); no session goes to login, no seller row to signup.
 */
export async function loadProductStorePage(storeId: string): Promise<ProductStoreContext> {
  try {
    return await requireProductStore(storeId, { read: true });
  } catch (error) {
    if (isAccessError(error)) {
      if (error.code === "unauthorized") redirect("/login");
      if (error.code === "no_seller") redirect("/signup");
      notFound();
    }
    throw error;
  }
}
