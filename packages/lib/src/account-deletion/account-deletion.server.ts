import { accountDeletionRequests, and, db, desc, eq, sellers, sql, users } from "@workspace/db";
import {
  ACCOUNT_DELETION_EMAIL_MAX,
  ACCOUNT_DELETION_NAME_MAX,
  accountDeletionRequestSchema,
  clipText,
  type AccountDeletionStatus,
  type SellerAccountDeletionView,
} from "./account-deletion.lib";

/**
 * Account deletion requests from Dashboard › Settings (ROADMAP.md F-82, 0157).
 * Server-only. Callers pass the session's user id, never an id from the
 * client. The 0157 trigger adds the admin bell row.
 */

export type CreateAccountDeletionError = "invalid_input" | "already_pending";
export type CreateAccountDeletionResult =
  | { success: true; id: string }
  | { success: false; error: CreateAccountDeletionError };

export type CancelAccountDeletionResult = { success: true } | { success: false; error: "not_found" };

/** The seller's latest pending request, or their latest declined one (to show the team's note). */
export async function getSellerAccountDeletion(userId: string): Promise<SellerAccountDeletionView | null> {
  const [row] = await db
    .select({
      id: accountDeletionRequests.id,
      status: accountDeletionRequests.status,
      reason: accountDeletionRequests.reason,
      adminNote: accountDeletionRequests.adminNote,
      createdAt: accountDeletionRequests.createdAt,
      handledAt: accountDeletionRequests.handledAt,
    })
    .from(accountDeletionRequests)
    .where(and(eq(accountDeletionRequests.userId, userId), sql`${accountDeletionRequests.status} IN ('pending', 'declined')`))
    // A pending request always wins over an older decline.
    .orderBy(sql`(${accountDeletionRequests.status} = 'pending') DESC`, desc(accountDeletionRequests.createdAt))
    .limit(1);
  return row ? { ...row, status: row.status as AccountDeletionStatus } : null;
}

/**
 * Saves a request. One pending request per user (0157's partial unique index
 * settles two quick submits). Email and name are snapshots, so the record
 * stays readable after the user is deleted.
 */
export async function createAccountDeletionRequest(params: { userId: string; input: unknown }): Promise<CreateAccountDeletionResult> {
  const parsed = accountDeletionRequestSchema.safeParse(params.input);
  if (!parsed.success) return { success: false, error: "invalid_input" };

  const [who] = await db
    .select({
      email: users.email,
      fullName: users.fullName,
      sellerName: sql<string | null>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`,
    })
    .from(users)
    .leftJoin(sellers, eq(sellers.id, users.id))
    .where(eq(users.id, params.userId))
    .limit(1);

  const [row] = await db
    .insert(accountDeletionRequests)
    .values({
      userId: params.userId,
      email: clipText(who?.email, ACCOUNT_DELETION_EMAIL_MAX),
      displayName: clipText(who?.sellerName ?? who?.fullName, ACCOUNT_DELETION_NAME_MAX),
      reason: parsed.data.reason,
      source: "dashboard",
    })
    .onConflictDoNothing()
    .returning({ id: accountDeletionRequests.id });
  if (!row) return { success: false, error: "already_pending" };
  return { success: true, id: row.id };
}

/** The seller changed their mind: cancels their own pending request. */
export async function cancelAccountDeletionRequest(userId: string): Promise<CancelAccountDeletionResult> {
  const updated = await db
    .update(accountDeletionRequests)
    .set({ status: "cancelled", cancelledAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(accountDeletionRequests.userId, userId), eq(accountDeletionRequests.status, "pending")))
    .returning({ id: accountDeletionRequests.id });
  return updated.length > 0 ? { success: true } : { success: false, error: "not_found" };
}
