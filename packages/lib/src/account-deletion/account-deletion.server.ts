import {
  accountDeletionRequests,
  and,
  db,
  eq,
  isNull,
  lte,
  sellerPushSubscriptions,
  sellers,
  sql,
  stores,
  users,
} from "@workspace/db";
import { getServiceClient } from "@workspace/db/supabase/service";
import {
  ACCOUNT_DELETION_BAN_DURATION,
  ACCOUNT_DELETION_EMAIL_MAX,
  ACCOUNT_DELETION_NAME_MAX,
  accountDeletionRequestSchema,
  clipText,
  isAuthUserMissingError,
} from "./account-deletion.lib";

/**
 * Closing and purging seller accounts (ROADMAP.md F-82, 0157). Server-only.
 * Callers pass the session's user id, never an id from the client.
 *
 * Close (the seller's "Delete my account"): one transaction saves the request
 * and suspends the seller (the dashboard then refuses them and their
 * storefronts stop resolving), and removes their push devices. After the
 * commit the auth user is banned so no sign-in works until the purge. No
 * money moves: the wallet stays frozen and goes with the purge (owner,
 * 2026-11-06: the balance is lost).
 */

export type CloseAccountError = "invalid_input" | "already_closed" | "no_seller";
export type CloseAccountResult =
  | { success: true; requestId: string; subdomains: string[]; banned: boolean }
  | { success: false; error: CloseAccountError };

class CloseError extends Error {
  constructor(readonly code: "already_closed" | "no_seller") {
    super(code);
  }
}

/** Bans (or unbans with "none") the auth user. Returns false on failure; the caller logs. */
export async function setAuthUserBan(userId: string, banDuration: string): Promise<boolean> {
  const { error } = await getServiceClient().auth.admin.updateUserById(userId, { ban_duration: banDuration });
  return !error;
}

export async function closeSellerAccount(params: { userId: string; input: unknown }): Promise<CloseAccountResult> {
  const parsed = accountDeletionRequestSchema.safeParse(params.input);
  if (!parsed.success) return { success: false, error: "invalid_input" };

  let requestId: string;
  let subdomains: string[];
  try {
    ({ requestId, subdomains } = await db.transaction(async (tx) => {
      const [seller] = await tx
        .select({
          status: sellers.status,
          name: sql<string | null>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`,
          email: users.email,
          fullName: users.fullName,
        })
        .from(sellers)
        .innerJoin(users, eq(users.id, sellers.id))
        .where(eq(sellers.id, params.userId))
        .for("update", { of: sellers });
      if (!seller) throw new CloseError("no_seller");

      const [row] = await tx
        .insert(accountDeletionRequests)
        .values({
          userId: params.userId,
          email: clipText(seller.email, ACCOUNT_DELETION_EMAIL_MAX),
          displayName: clipText(seller.name ?? seller.fullName, ACCOUNT_DELETION_NAME_MAX),
          reason: parsed.data.reason,
          source: "dashboard",
          previousSellerStatus: seller.status,
        })
        .onConflictDoNothing()
        .returning({ id: accountDeletionRequests.id });
      if (!row) throw new CloseError("already_closed");

      await tx.update(sellers).set({ status: "suspended", updatedAt: sql`now()` }).where(eq(sellers.id, params.userId));
      // No phone alerts for a closed account; the seller turns them on again after a restore.
      await tx.delete(sellerPushSubscriptions).where(eq(sellerPushSubscriptions.sellerId, params.userId));

      const owned = await tx
        .select({ subdomain: stores.subdomain })
        .from(stores)
        .where(and(eq(stores.sellerId, params.userId), isNull(stores.deletedAt)));
      return { requestId: row.id, subdomains: owned.map((store) => store.subdomain) };
    }));
  } catch (error) {
    if (error instanceof CloseError) return { success: false, error: error.code };
    throw error;
  }

  // After the commit: a failed ban still leaves the account blocked (suspended seller); the caller logs it.
  const banned = await setAuthUserBan(params.userId, ACCOUNT_DELETION_BAN_DURATION).catch(() => false);
  return { success: true, requestId, subdomains, banned };
}

export type PurgeResult = { purged: number; failed: number };

/**
 * The daily purge (dashboard `/api/cron/account-deletions`): deletes the auth
 * user of every closed account past its 30 days. 0134's cascades remove
 * everything the user owned; the request row stays (user_id SET NULL) and is
 * marked completed. One failure never stops the others.
 */
export async function purgeDueAccountDeletions(now: Date = new Date(), limit = 50): Promise<PurgeResult> {
  const due = await db
    .select({ id: accountDeletionRequests.id, userId: accountDeletionRequests.userId })
    .from(accountDeletionRequests)
    .where(and(eq(accountDeletionRequests.status, "scheduled"), lte(accountDeletionRequests.purgeAfter, now.toISOString())))
    .orderBy(accountDeletionRequests.purgeAfter)
    .limit(limit);

  const result: PurgeResult = { purged: 0, failed: 0 };
  for (const request of due) {
    try {
      if (request.userId) {
        const { error } = await getServiceClient().auth.admin.deleteUser(request.userId);
        if (error && !isAuthUserMissingError(error)) throw new Error(error.message);
      }
      await db
        .update(accountDeletionRequests)
        .set({ status: "completed", handledAt: sql`now()`, updatedAt: sql`now()` })
        .where(and(eq(accountDeletionRequests.id, request.id), eq(accountDeletionRequests.status, "scheduled")));
      result.purged += 1;
    } catch (error) {
      result.failed += 1;
      console.error("[account-deletion] purge failed", request.id, error instanceof Error ? error.message : error);
    }
  }
  return result;
}
