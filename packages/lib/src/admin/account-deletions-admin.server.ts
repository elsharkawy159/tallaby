import { accountDeletionRequests, db, desc, eq, sql, users } from "@workspace/db";
import {
  ACCOUNT_DELETION_DAYS,
  accountDeletionUpdateSchema,
  canAdminSetAccountDeletionStatus,
  type AccountDeletionSource,
  type AccountDeletionStatus,
} from "../account-deletion/account-deletion.lib";
import { AdminActorError, assertAdminActor, writeAdminAudit, type Queryable } from "./guard.server";

/**
 * Admin › Account deletions (ROADMAP.md F-82, 0157). The team deletes the
 * user by hand (Supabase › Authentication › Users › Delete user, which
 * cascades per 0134) after checking the wallet and open orders shown here,
 * then marks the request completed. No money moves from this module.
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
  handledAt: string | null;
  /** Still pending past the ACCOUNT_DELETION_DAYS promise (computed by the database clock). */
  overdue: boolean;
};

export type AdminAccountDeletionDetail = AdminAccountDeletionRow & {
  reason: string | null;
  adminNote: string | null;
  cancelledAt: string | null;
  handledByEmail: string | null;
  /** Null once the user is deleted. */
  account: {
    stores: number;
    walletBalance: string | null;
    walletCurrency: string | null;
    /** Orders with this seller's items that are not finished yet. */
    openOrders: number;
  } | null;
};

const overdue = sql<boolean>`(${accountDeletionRequests.status} = 'pending' AND ${accountDeletionRequests.createdAt} < now() - make_interval(days => ${ACCOUNT_DELETION_DAYS}))`;

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
      handledAt: accountDeletionRequests.handledAt,
      overdue,
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
      createdAt: accountDeletionRequests.createdAt,
      handledAt: accountDeletionRequests.handledAt,
      cancelledAt: accountDeletionRequests.cancelledAt,
      overdue,
      handledByEmail: users.email,
    })
    .from(accountDeletionRequests)
    .leftJoin(users, eq(users.id, accountDeletionRequests.handledBy))
    .where(eq(accountDeletionRequests.id, requestId))
    .limit(1);
  if (!row) return null;

  let account: AdminAccountDeletionDetail["account"] = null;
  if (row.userId) {
    // sellers.id = users.id. Read-only counts for the admin's checks.
    const [facts] = await q.execute<{ stores: number; wallet_balance: string | null; wallet_currency: string | null; open_orders: number }>(sql`
      SELECT
        (SELECT count(*)::int FROM stores s WHERE s.seller_id = ${row.userId}) AS stores,
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

export type UpdateAccountDeletionError = "not_admin" | "invalid_input" | "not_found" | "not_allowed" | "unchanged";
export type UpdateAccountDeletionResult =
  | { success: true; status: AccountDeletionStatus }
  | { success: false; error: UpdateAccountDeletionError };

class UpdateError extends Error {
  constructor(readonly code: "not_found" | "not_allowed" | "unchanged") {
    super(code);
  }
}

/** Sets a request's status and note, with an audit row. Never deletes the user. */
export async function updateAccountDeletionByAdmin(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<UpdateAccountDeletionResult> {
  const parsed = accountDeletionUpdateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const next = parsed.data;

  try {
    return await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [request] = await tx
        .select({
          id: accountDeletionRequests.id,
          userId: accountDeletionRequests.userId,
          status: accountDeletionRequests.status,
          adminNote: accountDeletionRequests.adminNote,
        })
        .from(accountDeletionRequests)
        .where(eq(accountDeletionRequests.id, next.requestId))
        .for("update");
      if (!request) throw new UpdateError("not_found");
      if (!canAdminSetAccountDeletionStatus(request.status, next.status)) throw new UpdateError("not_allowed");
      if (request.status === next.status && (request.adminNote ?? null) === (next.note ?? null)) throw new UpdateError("unchanged");

      await tx
        .update(accountDeletionRequests)
        .set({
          status: next.status,
          adminNote: next.note,
          handledBy: actorId,
          handledAt: sql`now()`,
          updatedAt: sql`now()`,
        })
        .where(eq(accountDeletionRequests.id, request.id));

      await writeAdminAudit(tx, {
        actorId,
        // The user may already be deleted; the request is then the target.
        sellerId: null,
        targetType: "account_deletion_request",
        targetId: request.id,
        action: "update_account_deletion_request",
        before: { status: request.status, hasNote: Boolean(request.adminNote), userId: request.userId },
        after: { status: next.status, hasNote: Boolean(next.note) },
        reason: `Account deletion request marked ${next.status}`,
      });

      return { success: true as const, status: next.status };
    });
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof UpdateError) return { success: false, error: error.code };
    throw error;
  }
}
