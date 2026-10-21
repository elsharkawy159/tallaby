// Deliberately NOT "use server": these reads are only called by Server
// Components, after the page's own admin guard (see sidebar.server.ts).

import { cache } from "react";
import { db, eq, sellers, sellerWallet, stores, users } from "@workspace/db";
import { and, asc, desc, inArray, isNull, sql } from "drizzle-orm";
import { isUuid } from "@workspace/lib/admin";

/**
 * Everything one account is connected to: the person, their seller account
 * (`sellers.id = users.id`) when they sell, that seller's stores and its
 * store-wallet balance. The customer, seller, store, order and product pages
 * all draw their relation chips and owner cards from this one read.
 */
export const getAccountRelations = cache(async (userId: string) => {
  if (!isUuid(userId)) return null;

  const [row] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      role: users.role,
      isGuest: users.isGuest,
      createdAt: users.createdAt,
      seller: {
        id: sellers.id,
        displayName: sellers.displayName,
        businessName: sellers.businessName,
        slug: sellers.slug,
        status: sellers.status,
        plan: sellers.plan,
        logoUrl: sellers.logoUrl,
        feePlan: sellers.feePlan,
        feeTrialStartedAt: sellers.feeTrialStartedAt,
        feeTrialEndsAt: sellers.feeTrialEndsAt,
        isCommissionExempt: sellers.isCommissionExempt,
      },
      walletBalance: sql<string | null>`${sellerWallet.balance}::text`,
    })
    .from(users)
    .leftJoin(sellers, eq(sellers.id, users.id))
    .leftJoin(sellerWallet, eq(sellerWallet.sellerId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;

  const seller = row.seller?.id ? row.seller : null;
  const sellerStores = seller
    ? await db
        .select({
          id: stores.id,
          name: stores.name,
          subdomain: stores.subdomain,
          logoUrl: stores.logoUrl,
          isPrimary: stores.isPrimary,
          status: stores.status,
          siteStatus: stores.siteStatus,
          createdAt: stores.createdAt,
        })
        .from(stores)
        .where(and(eq(stores.sellerId, seller.id), isNull(stores.deletedAt)))
        .orderBy(desc(stores.isPrimary), asc(stores.createdAt))
    : [];

  const { seller: _seller, walletBalance, ...user } = row;
  return {
    user,
    seller: seller
      ? { ...seller, name: seller.displayName?.trim() || seller.businessName, walletBalance }
      : null,
    stores: sellerStores,
  };
});

export type AccountRelations = NonNullable<Awaited<ReturnType<typeof getAccountRelations>>>;
export type RelatedSeller = NonNullable<AccountRelations["seller"]>;
export type RelatedStore = AccountRelations["stores"][number];

/** Which of these user ids also own a seller account: for list-page badges. */
export async function sellerIdsAmong(userIds: string[]): Promise<Set<string>> {
  const ids = [...new Set(userIds.filter(isUuid))];
  if (!ids.length) return new Set();
  const rows = await db.select({ id: sellers.id }).from(sellers).where(inArray(sellers.id, ids));
  return new Set(rows.map((r) => r.id));
}

/** Names for the orders-list relation filter bar. Unknown ids come back null. */
export async function getRelationFilterLabels(filter: { sellerId?: string; storeId?: string; customerId?: string }) {
  const [seller, store, customer] = await Promise.all([
    filter.sellerId && isUuid(filter.sellerId)
      ? db
          .select({ id: sellers.id, displayName: sellers.displayName, businessName: sellers.businessName })
          .from(sellers)
          .where(eq(sellers.id, filter.sellerId))
          .limit(1)
          .then(([r]) => (r ? { id: r.id, name: r.displayName?.trim() || r.businessName } : null))
      : null,
    filter.storeId && isUuid(filter.storeId)
      ? db
          .select({ id: stores.id, name: stores.name, logoUrl: stores.logoUrl })
          .from(stores)
          .where(eq(stores.id, filter.storeId))
          .limit(1)
          .then(([r]) => r ?? null)
      : null,
    filter.customerId && isUuid(filter.customerId)
      ? db
          .select({ id: users.id, fullName: users.fullName, email: users.email, avatarUrl: users.avatarUrl })
          .from(users)
          .where(eq(users.id, filter.customerId))
          .limit(1)
          .then(([r]) => (r ? { id: r.id, name: r.fullName || r.email || "Customer", avatarUrl: r.avatarUrl } : null))
      : null,
  ]);
  return { seller, store, customer };
}
