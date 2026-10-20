/** Every admin_audit_log row, newest first (docs/admin-saas.md §3.11). Read-only. */
import { adminAuditLog, and, db, eq, sellers, sql, stores, users } from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { ADMIN_AUDIT_ACTIONS, type AdminAuditAction } from "./admin.lib";
import type { Queryable } from "./guard.server";
import { adminOrderBy, type AdminListSort } from "./list-sort.server";
import { ADMIN_LIST_PAGE_SIZE, isUuid, likePattern } from "./saas.lib";

export interface AdminAuditListInput {
  action: AdminAuditAction | null;
  sellerId: string | null;
  /** "platform" = rows with no seller (template changes, 0069). */
  scope: "platform" | null;
  q: string | null;
  page: number;
  /** An id from AUDIT_SORT_IDS; default newest first. */
  sort?: AdminListSort | null;
}

export const AUDIT_SORT_IDS = ["createdAt", "action", "target", "actor"] as const;

const AUDIT_SORT_COLUMNS: Record<(typeof AUDIT_SORT_IDS)[number], SQL> = {
  createdAt: sql`${adminAuditLog.createdAt}`,
  action: sql`${adminAuditLog.action}`,
  target: sql`lower(coalesce(${stores.name}, ${sellers.businessName}))`,
  actor: sql`lower(coalesce(${users.fullName}, ${users.email}))`,
};

export async function listAdminAuditForAdmin(input: AdminAuditListInput, q: Queryable = db) {
  const conditions: SQL[] = [];
  if (input.action && (ADMIN_AUDIT_ACTIONS as readonly string[]).includes(input.action)) {
    conditions.push(eq(adminAuditLog.action, input.action));
  }
  if (input.sellerId && isUuid(input.sellerId)) conditions.push(eq(adminAuditLog.sellerId, input.sellerId));
  if (input.scope === "platform") conditions.push(sql`${adminAuditLog.sellerId} IS NULL`);
  if (input.q) {
    const like = likePattern(input.q);
    conditions.push(sql`(${adminAuditLog.reason} ILIKE ${like} OR ${sellers.businessName} ILIKE ${like} OR ${users.email} ILIKE ${like})`);
  }

  const rows = await q
    .select({
      id: adminAuditLog.id,
      action: adminAuditLog.action,
      reason: adminAuditLog.reason,
      before: adminAuditLog.before,
      after: adminAuditLog.after,
      createdAt: adminAuditLog.createdAt,
      sellerId: adminAuditLog.sellerId,
      sellerName: sql<string | null>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`,
      storeId: adminAuditLog.storeId,
      storeName: stores.name,
      actorName: sql<string | null>`coalesce(${users.fullName}, ${users.email})`,
      // Read through to_jsonb so this also works before 0069 adds the columns.
      targetType: sql<string | null>`to_jsonb(${adminAuditLog})->>'target_type'`,
      targetId: sql<string | null>`to_jsonb(${adminAuditLog})->>'target_id'`,
      totalCount: sql<number>`count(*) OVER ()::int`,
    })
    .from(adminAuditLog)
    .leftJoin(sellers, eq(sellers.id, adminAuditLog.sellerId))
    .leftJoin(stores, eq(stores.id, adminAuditLog.storeId))
    .leftJoin(users, eq(users.id, adminAuditLog.actorId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      adminOrderBy(input.sort, AUDIT_SORT_COLUMNS, sql`${adminAuditLog.createdAt} DESC`, sql`${adminAuditLog.id} DESC`),
    )
    .limit(ADMIN_LIST_PAGE_SIZE)
    .offset((input.page - 1) * ADMIN_LIST_PAGE_SIZE);

  return { rows: rows.map(({ totalCount: _total, ...row }) => row), total: Number(rows[0]?.totalCount ?? 0) };
}
