import { cache } from "react";
import { and, db, eq, isNull, sellers, stores } from "@workspace/db";
import { createClient } from "@/supabase/server";
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

const loadSession = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
});

const loadSeller = cache(async (userId: string) => {
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

export function isAccessError(error: unknown): error is AccessError {
  return error instanceof AccessError;
}
