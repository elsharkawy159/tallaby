/**
 * Server-side admin checks for audited admin writes (PLAN.md P9-01, P9-02).
 *
 * The admin app already gates every action with its session guard
 * (`validateAdminAccess`). These functions re-check the actor in the database
 * inside the write transaction, so a lib function can never be called for a
 * non-admin, unverified or suspended user, whatever the caller passes.
 */
import { adminAuditLog, db, eq, users } from "@workspace/db";
import { isAdminWriteRole, type AdminAuditAction } from "./admin.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AdminActorError extends Error {
  readonly code = "not_admin" as const;
  constructor() {
    super("Admin actor required");
    this.name = "AdminActorError";
  }
}

/** Throws AdminActorError unless `actorId` is a verified, unsuspended admin. */
export async function assertAdminActor(q: Queryable, actorId: string): Promise<{ id: string; role: string }> {
  if (typeof actorId !== "string" || !UUID_RE.test(actorId)) throw new AdminActorError();
  const [actor] = await q
    .select({ id: users.id, role: users.role, isVerified: users.isVerified, isSuspended: users.isSuspended })
    .from(users)
    .where(eq(users.id, actorId))
    .limit(1);
  if (!actor || !isAdminWriteRole(actor.role) || actor.isVerified !== true || actor.isSuspended === true) {
    throw new AdminActorError();
  }
  return { id: actor.id, role: actor.role };
}

export type AdminAuditEntry = {
  actorId: string;
  /** Null only for platform-wide actions (0069); then targetType and targetId are required. */
  sellerId: string | null;
  storeId?: string | null;
  /** What was changed when it is not a seller account, e.g. "template" (0069). */
  targetType?: string | null;
  targetId?: string | null;
  action: AdminAuditAction;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason: string;
};

/** Appends one admin_audit_log row. Call it in the same transaction as the change. */
export async function writeAdminAudit(q: Queryable, entry: AdminAuditEntry): Promise<string> {
  const [row] = await q
    .insert(adminAuditLog)
    .values({
      actorId: entry.actorId,
      sellerId: entry.sellerId,
      storeId: entry.storeId ?? null,
      // Only sent when set, so seller rows still insert on a database without 0069.
      ...(entry.targetType ? { targetType: entry.targetType, targetId: entry.targetId ?? null } : {}),
      action: entry.action,
      before: entry.before,
      after: entry.after,
      reason: entry.reason,
    })
    .returning({ id: adminAuditLog.id });
  return row!.id;
}
