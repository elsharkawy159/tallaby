import { accountDeletionRequests, and, db, desc, eq, isNull, sellers, sql, stores, users } from "@workspace/db";
import {
  accountRestoreSchema,
  canRestoreAccountDeletion,
  restoredSellerStatus,
  type AccountDeletionSource,
  type AccountDeletionStatus,
} from "../account-deletion/account-deletion.lib";
import { setAuthUserBan } from "../account-deletion/account-deletion.server";
import { AdminActorError, assertAdminActor, writeAdminAudit, type Queryable } from "./guard.server";

/**
 * Admin › Account deletions (ROADMAP.md F-82, 0157). A seller's "Delete my
 * account" closes the account at once; the dashboard cron purges it after 30
 * days. Here the team sees each one and can restore an account before its
 * purge (the seller emails support). No money moves from this module.
 */

export type AccountDeletionFilter = AccountDeletionStatus | "all";

export type AdminAccountDeletionRow = {
  id: string;
  status: AccountDeletionStatus;
  source: AccountDeletionSource;
  email: string | null;
  displayName: string | null;
  userId: string | null;
  createdAt: string;
  purgeAfter: string;
  handledAt: string | null;
};

export type AdminAccountDeletionDetail = AdminAccountDeletionRow & {
  reason: string | null;
  adminNote: string | null;
  previousSellerStatus: string | null;
  handledByEmail: string | null;
  /** Null once the user is purged. */
  account: {
    stores: number;
    walletBalance: string | null;
    walletCurrency: string | null;
    /** Orders with this seller's items that are not finished yet (they go with the purge). */
    openOrders: number;
  } | null;
};

export async function listAccountDeletionsForAdmin(filter: AccountDeletionFilter, q: Queryable = db): Promise<AdminAccountDeletionRow[]> {
  const rows = await q
    .select({
      id: accountDeletionRequests.id,
      status: accountDeletionRequests.status,
      source: accountDeletionRequests.source,
      email: accountDeletionRequests.email,
      displayName: accountDeletionRequests.displayName,
      userId: accountDeletionRequests.userId,
      createdAt: accountDeletionRequests.createdAt,
      purgeAfter: accountDeletionRequests.purgeAfter,
      handledAt: accountDeletionRequests.handledAt,
    })
    .from(accountDeletionRequests)
    .where(filter === "all" ? undefined : eq(accountDeletionRequests.status, filter))
    .orderBy(desc(accountDeletionRequests.createdAt))
    .limit(100);
  return rows.map((row) => ({
    ...row,
    status: row.status as AccountDeletionStatus,
    source: row.source as AccountDeletionSource,
  }));
}

export async function getAccountDeletionForAdmin(requestId: string, q: Queryable = db): Promise<AdminAccountDeletionDetail | null> {
  const [row] = await q
    .select({
      id: accountDeletionRequests.id,
      status: accountDeletionRequests.status,
      source: accountDeletionRequests.source,
      email: accountDeletionRequests.email,
      displayName: accountDeletionRequests.displayName,
      userId: accountDeletionRequests.userId,
      reason: accountDeletionRequests.reason,
      adminNote: accountDeletionRequests.adminNote,
      previousSellerStatus: accountDeletionRequests.previousSellerStatus,
      createdAt: accountDeletionRequests.createdAt,
      purgeAfter: accountDeletionRequests.purgeAfter,
      handledAt: accountDeletionRequests.handledAt,
      handledByEmail: users.email,
    })
    .from(accountDeletionRequests)
    .leftJoin(users, eq(users.id, accountDeletionRequests.handledBy))
    .where(eq(accountDeletionRequests.id, requestId))
    .limit(1);
  if (!row) return null;

  let account: AdminAccountDeletionDetail["account"] = null;
  if (row.userId) {
    // sellers.id = users.id. Read-only counts for context.
    const [facts] = await q.execute<{ stores: number; wallet_balance: string | null; wallet_currency: string | null; open_orders: number }>(sql`
      SELECT
        (SELECT count(*)::int FROM stores s WHERE s.seller_id = ${row.userId} AND s.deleted_at IS NULL) AS stores,
        (SELECT w.balance::text FROM seller_wallet w WHERE w.seller_id = ${row.userId} LIMIT 1) AS wallet_balance,
        (SELECT w.currency FROM seller_wallet w WHERE w.seller_id = ${row.userId} LIMIT 1) AS wallet_currency,
        (SELECT count(DISTINCT oi.order_id)::int
           FROM order_items oi JOIN orders o ON o.id = oi.order_id
          WHERE oi.seller_id = ${row.userId}
            AND o.status IN ('pending', 'payment_processing', 'confirmed', 'shipping_soon', 'shipped', 'out_for_delivery', 'refund_requested')) AS open_orders
    `);
    if (facts) {
      account = {
        stores: Number(facts.stores ?? 0),
        walletBalance: facts.wallet_balance,
        walletCurrency: facts.wallet_currency,
        openOrders: Number(facts.open_orders ?? 0),
      };
    }
  }

  return {
    ...row,
    status: row.status as AccountDeletionStatus,
    source: row.source as AccountDeletionSource,
    account,
  };
}

export type RestoreAccountError = "not_admin" | "invalid_input" | "not_found" | "not_allowed" | "user_gone";
export type RestoreAccountResult =
  | { success: true; sellerId: string; subdomains: string[]; unbanned: boolean }
  | { success: false; error: RestoreAccountError };

class RestoreError extends Error {
  constructor(readonly code: "not_found" | "not_allowed" | "user_gone") {
    super(code);
  }
}

/**
 * Reopens a closed account before its purge: the seller status it had before,
 * the auth ban lifted, the request marked restored. Nothing was deleted, so
 * stores, products, orders and the wallet come back as they were.
 */
export async function restoreAccountByAdmin(actorId: string, input: unknown, q: Queryable = db): Promise<RestoreAccountResult> {
  const parsed = accountRestoreSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const next = parsed.data;

  let sellerId: string;
  let subdomains: string[];
  try {
    ({ sellerId, subdomains } = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [request] = await tx
        .select({
          id: accountDeletionRequests.id,
          userId: accountDeletionRequests.userId,
          status: accountDeletionRequests.status,
          previousSellerStatus: accountDeletionRequests.previousSellerStatus,
        })
        .from(accountDeletionRequests)
        .where(eq(accountDeletionRequests.id, next.requestId))
        .for("update");
      if (!request) throw new RestoreError("not_found");
      if (!canRestoreAccountDeletion(request.status)) throw new RestoreError("not_allowed");
      if (!request.userId) throw new RestoreError("user_gone");

      const status = restoredSellerStatus(request.previousSellerStatus);
      const updated = await tx
        .update(sellers)
        .set({ status, updatedAt: sql`now()` })
        .where(eq(sellers.id, request.userId))
        .returning({ id: sellers.id });
      if (updated.length === 0) throw new RestoreError("user_gone");

      await tx
        .update(accountDeletionRequests)
        .set({ status: "restored", adminNote: next.note, handledBy: actorId, handledAt: sql`now()`, updatedAt: sql`now()` })
        .where(eq(accountDeletionRequests.id, request.id));

      await writeAdminAudit(tx, {
        actorId,
        sellerId: request.userId,
        targetType: "account_deletion_request",
        targetId: request.id,
        action: "restore_closed_account",
        before: { requestStatus: request.status, sellerStatus: "suspended" },
        after: { requestStatus: "restored", sellerStatus: status },
        reason: next.note ?? "Closed account restored before its purge",
      });

      const owned = await tx
        .select({ subdomain: stores.subdomain })
        .from(stores)
        .where(and(eq(stores.sellerId, request.userId), isNull(stores.deletedAt)));
      return { sellerId: request.userId, subdomains: owned.map((store) => store.subdomain) };
    }));
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof RestoreError) return { success: false, error: error.code };
    throw error;
  }

  const unbanned = await setAuthUserBan(sellerId, "none").catch(() => false);
  return { success: true, sellerId, subdomains, unbanned };
}
