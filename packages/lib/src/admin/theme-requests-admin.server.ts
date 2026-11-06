import { and, db, desc, eq, sellerNotifications, sellers, sql, stores, themeRequests, users } from "@workspace/db";
import {
  planThemeRequestUpdate,
  themeRequestNotification,
  themeRequestUpdateSchema,
  type EmailedThemeRequestStatus,
  type ThemeRequestStatus,
} from "../theme-requests/theme-requests.lib";
import { AdminActorError, assertAdminActor, writeAdminAudit, type Queryable } from "./guard.server";

/**
 * Admin › Theme requests (ROADMAP.md F-77, 0156). A built theme ships to the
 * code-only gallery with a deploy; here the team tracks each request and
 * replies. A status change writes the seller's bell row (pushed by the 0124
 * dispatcher) in the same transaction as the update and its audit row; the
 * caller asks the backend for the ready/declined email after the commit.
 */

export type ThemeRequestFilter = ThemeRequestStatus | "open" | "all";

export type AdminThemeRequestRow = {
  id: string;
  status: ThemeRequestStatus;
  referenceUrl: string | null;
  description: string | null;
  imageCount: number;
  createdAt: string;
  updatedAt: string;
  sellerId: string;
  sellerName: string | null;
  storeId: string | null;
  storeName: string | null;
  subdomain: string | null;
};

export type AdminThemeRequestDetail = AdminThemeRequestRow & {
  note: string | null;
  imagePaths: string[];
  adminReply: string | null;
  handledAt: string | null;
  handledByEmail: string | null;
  sellerEmail: string | null;
};

const sellerName = sql<string | null>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`;

function statusWhere(filter: ThemeRequestFilter) {
  if (filter === "all") return undefined;
  if (filter === "open") return sql`${themeRequests.status} IN ('new', 'in_progress')`;
  return eq(themeRequests.status, filter);
}

export async function listThemeRequestsForAdmin(filter: ThemeRequestFilter, q: Queryable = db): Promise<AdminThemeRequestRow[]> {
  const rows = await q
    .select({
      id: themeRequests.id,
      status: themeRequests.status,
      referenceUrl: themeRequests.referenceUrl,
      description: themeRequests.description,
      imageCount: sql<number>`coalesce(cardinality(${themeRequests.imagePaths}), 0)::int`,
      createdAt: themeRequests.createdAt,
      updatedAt: themeRequests.updatedAt,
      sellerId: themeRequests.sellerId,
      sellerName,
      storeId: themeRequests.storeId,
      storeName: stores.name,
      subdomain: stores.subdomain,
    })
    .from(themeRequests)
    .innerJoin(sellers, eq(sellers.id, themeRequests.sellerId))
    .leftJoin(stores, eq(stores.id, themeRequests.storeId))
    .where(statusWhere(filter))
    .orderBy(desc(themeRequests.createdAt))
    .limit(100);
  return rows.map((row) => ({ ...row, status: row.status as ThemeRequestStatus, imageCount: Number(row.imageCount) }));
}

export async function getThemeRequestForAdmin(requestId: string, q: Queryable = db): Promise<AdminThemeRequestDetail | null> {
  const [row] = await q
    .select({
      id: themeRequests.id,
      status: themeRequests.status,
      referenceUrl: themeRequests.referenceUrl,
      description: themeRequests.description,
      note: themeRequests.note,
      imagePaths: themeRequests.imagePaths,
      imageCount: sql<number>`coalesce(cardinality(${themeRequests.imagePaths}), 0)::int`,
      adminReply: themeRequests.adminReply,
      handledAt: themeRequests.handledAt,
      handledByEmail: users.email,
      createdAt: themeRequests.createdAt,
      updatedAt: themeRequests.updatedAt,
      sellerId: themeRequests.sellerId,
      sellerName,
      storeId: themeRequests.storeId,
      storeName: stores.name,
      subdomain: stores.subdomain,
    })
    .from(themeRequests)
    .innerJoin(sellers, eq(sellers.id, themeRequests.sellerId))
    .leftJoin(stores, eq(stores.id, themeRequests.storeId))
    .leftJoin(users, eq(users.id, themeRequests.handledBy))
    .where(eq(themeRequests.id, requestId))
    .limit(1);
  if (!row) return null;
  // sellers.id = users.id: the seller's login email.
  const [account] = await q.select({ email: users.email }).from(users).where(eq(users.id, row.sellerId)).limit(1);
  return { ...row, sellerEmail: account?.email ?? null, status: row.status as ThemeRequestStatus, imageCount: Number(row.imageCount) };
}

export type UpdateThemeRequestError = "not_admin" | "invalid_input" | "not_found" | "unchanged";
export type UpdateThemeRequestResult =
  | { success: true; status: ThemeRequestStatus; notified: boolean; email: EmailedThemeRequestStatus | null }
  | { success: false; error: UpdateThemeRequestError };

class UpdateError extends Error {
  constructor(readonly code: "not_found" | "unchanged") {
    super(code);
  }
}

/** Sets a request's status and reply. Saving the same status again notifies nobody. */
export async function updateThemeRequestByAdmin(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<UpdateThemeRequestResult> {
  const parsed = themeRequestUpdateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const next = parsed.data;

  try {
    return await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [request] = await tx
        .select({
          id: themeRequests.id,
          sellerId: themeRequests.sellerId,
          storeId: themeRequests.storeId,
          status: themeRequests.status,
          adminReply: themeRequests.adminReply,
        })
        .from(themeRequests)
        .where(eq(themeRequests.id, next.requestId))
        .for("update");
      if (!request) throw new UpdateError("not_found");

      const plan = planThemeRequestUpdate(request, { status: next.status, reply: next.reply });
      if (!plan.changed) throw new UpdateError("unchanged");

      await tx
        .update(themeRequests)
        .set({
          status: next.status,
          adminReply: next.reply,
          handledBy: actorId,
          handledAt: sql`now()`,
          updatedAt: sql`now()`,
        })
        .where(and(eq(themeRequests.id, request.id), eq(themeRequests.status, request.status)));

      let notified = false;
      if (plan.notify) {
        const row = themeRequestNotification({ id: request.id, sellerId: request.sellerId, storeId: request.storeId, status: next.status });
        const inserted = await tx.insert(sellerNotifications).values(row).onConflictDoNothing().returning({ id: sellerNotifications.id });
        notified = inserted.length > 0;
      }

      await writeAdminAudit(tx, {
        actorId,
        sellerId: request.sellerId,
        storeId: request.storeId,
        targetType: "theme_request",
        targetId: request.id,
        action: "update_theme_request",
        before: { status: request.status, hasReply: Boolean(request.adminReply) },
        after: { status: next.status, hasReply: Boolean(next.reply), notified },
        reason: plan.statusChanged ? `Theme request marked ${next.status.replace("_", " ")}` : "Theme request reply edited",
      });

      return { success: true as const, status: next.status, notified, email: plan.email };
    });
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    if (error instanceof UpdateError) return { success: false, error: error.code };
    throw error;
  }
}
