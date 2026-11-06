import { cache } from "react";
import { cookies } from "next/headers";
import { db, carts, eq, stores } from "@workspace/db";
import { getOrderLock } from "@workspace/lib/billing/order-lock";
import { activationAccess, type ActivationAccess } from "@workspace/lib/billing/store-access";
import { isSellerActivationLocked } from "@workspace/lib/billing/store-activation";
import { STORE_OWNER_PASS_COOKIE, verifyStoreOwnerPass } from "@workspace/lib/store-sites/owner-pass";
import { storePreviewSecret } from "@workspace/lib/store-sites/preview";

/**
 * A published store whose seller isn't activated yet is private (ROADMAP.md
 * F-76, owner 2026-11-06): only the seller's own browser, holding the pass the
 * dashboard's "View store" link gives it (/api/store-owner-pass), sees the store,
 * with a small banner; everyone else gets the store-offline page. Nothing changes
 * while the USD switch is off, for Pro, or once the seller was activated.
 *
 * The pass is checked against the store of the request host (or of the cart) and
 * that store's seller, both read on the server; ids from the request are never
 * trusted. The cookie is only read when the seller is locked, so a public store's
 * pages don't depend on it.
 */

async function hasOwnerPass(sellerId: string, storeId: string): Promise<boolean> {
  const secret = storePreviewSecret();
  if (!secret) return false;
  const token = (await cookies()).get(STORE_OWNER_PASS_COOKIE)?.value;
  if (!token) return false;
  return verifyStoreOwnerPass(token, { secret, storeId, sellerId }).ok;
}

/** For rendering a storefront page: the short-lived cached lock, once per request. */
export const getStoreActivationAccess = cache(async (sellerId: string, storeId: string): Promise<ActivationAccess> => {
  const locked = await isSellerActivationLocked(sellerId);
  if (!locked) return "public";
  return activationAccess({ locked }, await hasOwnerPass(sellerId, storeId));
});

/**
 * For placing an order on a cart's store: the lock read fresh (never cached), so
 * a seller activated a second ago gets a real order. Marketplace carts (no store)
 * are always public.
 */
export async function getCartActivationAccess(cartId: string): Promise<ActivationAccess> {
  const [row] = await db
    .select({ storeId: stores.id, sellerId: stores.sellerId })
    .from(carts)
    .innerJoin(stores, eq(stores.id, carts.storeId))
    .where(eq(carts.id, cartId))
    .limit(1);
  if (!row) return "public";
  const lock = await getOrderLock(row.sellerId);
  if (!lock.locked) return "public";
  return activationAccess(lock, await hasOwnerPass(row.sellerId, row.storeId));
}
