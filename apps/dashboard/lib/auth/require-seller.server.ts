import { getOrderLock, type OrderLock } from "@workspace/lib/billing/order-lock";
import { cache } from "react";
import { and, db, eq, isNull, sellers, stores } from "@workspace/db";
import { getSessionUser } from "./session.server";
import {
  type AccessCode,
  type AccessOptions,
  checkSellerAccess,
  checkStoreAccess,
  isUuid,
} from "./access.lib";

/**
 * Authorization for every dashboard server action and page (PLAN.md P1-03,
 * CLAUDE.md rule 5). Server code bypasses RLS, so this is the check:
 *   - the seller id comes only from the session, never from the client;
 *   - a store is loaded only together with its owner check, and any store that
 *     is not the caller's is reported as not found.
 * Loads are memoized per request with React cache(); the policy itself is pure
 * (access.lib.ts).
 */

export class AccessError extends Error {
  constructor(readonly code: AccessCode) {
    super(code);
    this.name = "AccessError";
  }
}

export type SellerContext = {
  userId: string;
  sellerId: string;
  status: string;
  plan: string;
  maxStoresOverride: number | null;
};

export type StoreContext = {
  id: string;
  sellerId: string;
  name: string;
  subdomain: string;
  isPrimary: boolean;
  status: string;
};

const loadSession = async (): Promise<string | null> => (await getSessionUser())?.id ?? null;

/** One read of the seller row per request; seller-access.ts shares it. */
export const loadSeller = cache(async (userId: string) => {
  const [row] = await db
    .select({
      id: sellers.id,
      status: sellers.status,
      plan: sellers.plan,
      maxStoresOverride: sellers.maxStoresOverride,
    })
    .from(sellers)
    .where(eq(sellers.id, userId))
    .limit(1);
  return row ?? null;
});

// Scoped by seller in SQL as well as in checkStoreAccess: a foreign store is
// never even read.
const loadStore = cache(async (sellerId: string, storeId: string) => {
  const [row] = await db
    .select({
      id: stores.id,
      sellerId: stores.sellerId,
      name: stores.name,
      subdomain: stores.subdomain,
      isPrimary: stores.isPrimary,
      status: stores.status,
      deletedAt: stores.deletedAt,
    })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  return row ?? null;
});

export async function requireSeller(options: AccessOptions = {}): Promise<SellerContext> {
  const userId = await loadSession();
  if (!userId) throw new AccessError("unauthorized");

  const seller = await loadSeller(userId);
  const result = checkSellerAccess(seller ? (seller.status ?? "pending") : null, options);
  if (!result.ok) throw new AccessError(result.code);

  return {
    userId,
    sellerId: seller!.id,
    status: seller!.status ?? "pending",
    plan: seller!.plan,
    maxStoresOverride: seller!.maxStoresOverride,
  };
}

export async function requireStore(
  storeId: string,
  options: AccessOptions = {},
): Promise<{ seller: SellerContext; store: StoreContext }> {
  const seller = await requireSeller(options);
  if (typeof storeId !== "string" || !isUuid(storeId)) throw new AccessError("not_found");

  const row = await loadStore(seller.sellerId, storeId);
  const result = checkStoreAccess(row, seller.sellerId, seller.status, options);
  if (!result.ok) throw new AccessError(result.code);

  const { deletedAt: _deletedAt, ...store } = row!;
  return { seller, store };
}

/**
 * This seller's activation and grace window, once per request (ROADMAP.md F-68,
 * F-84). `ordersLocked` hides orders; `activated` gates AI and campaign emails.
 * Never cached across requests.
 */
export const loadOrderLock = cache((sellerId: string) => getOrderLock(sellerId));

/** The session seller's lock, for a page deciding what to show. */
export async function currentOrderLock(): Promise<OrderLock> {
  const { sellerId } = await requireSeller();
  return loadOrderLock(sellerId);
}

/** `requireSeller` for anything that reads or changes orders: hiding a page isn't authorization. */
export async function requireOrdersSeller(options: AccessOptions = {}): Promise<SellerContext> {
  const seller = await requireSeller(options);
  if ((await loadOrderLock(seller.sellerId)).ordersLocked) throw new AccessError("orders_locked");
  return seller;
}

/**
 * `requireOrdersSeller` for one order: once orders are locked (F-84), the
 * seller's first order still opens and can be worked on, and no other.
 */
export async function requireOrderSeller(orderId: string, options: AccessOptions = {}): Promise<SellerContext> {
  const seller = await requireSeller(options);
  const lock = await loadOrderLock(seller.sellerId);
  if (lock.ordersLocked && (!lock.firstOrderId || lock.firstOrderId !== orderId)) throw new AccessError("orders_locked");
  return seller;
}

/**
 * Reading the orders list: a seller whose orders are open sees every order; once
 * they are locked (not activated and the grace window is over, F-84) only the
 * first order shows (`onlyOrderId`, set here from the server, never the client).
 * With no first order there is nothing to read. Changing orders still needs
 * requireOrdersSeller or requireOrderSeller.
 */
export async function requireOrdersView(options: AccessOptions = {}): Promise<{ sellerId: string; onlyOrderId: string | null }> {
  const seller = await requireSeller(options);
  const lock = await loadOrderLock(seller.sellerId);
  if (!lock.ordersLocked) return { sellerId: seller.sellerId, onlyOrderId: null };
  if (!lock.firstOrderId) throw new AccessError("orders_locked");
  return { sellerId: seller.sellerId, onlyOrderId: lock.firstOrderId };
}

/** `requireStore` for anything that reads or changes orders. */
export async function requireOrdersStore(
  storeId: string,
  options: AccessOptions = {},
): Promise<{ seller: SellerContext; store: StoreContext }> {
  const result = await requireStore(storeId, options);
  if ((await loadOrderLock(result.seller.sellerId)).ordersLocked) throw new AccessError("orders_locked");
  return result;
}

export function isAccessError(error: unknown): error is AccessError {
  return error instanceof AccessError;
}
