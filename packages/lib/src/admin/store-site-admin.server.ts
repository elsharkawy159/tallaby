/**
 * Guard, flag and audit helpers for the admin website builder. The admin app
 * opens any store in the shared builder; these resolve the store (and its real
 * seller) from the database, never from the client.
 */
import { db, eq, sellers, sql, stores } from "@workspace/db";
import { assertAdminActor, writeAdminAudit, type AdminAuditEntry, type Queryable } from "./guard.server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AdminStoreRef = {
  sellerId: string;
  storeId: string;
  subdomain: string;
  status: string;
  sellerStatus: string;
};

/**
 * Throws AdminActorError unless `actorId` is an admin. Returns the store with
 * its owning seller, or null for a malformed id, a missing store or a deleted one.
 */
export async function resolveStoreForAdmin(
  actorId: string,
  storeId: string,
  q: Queryable = db,
): Promise<AdminStoreRef | null> {
  await assertAdminActor(q, actorId);
  if (typeof storeId !== "string" || !UUID_RE.test(storeId)) return null;
  const [row] = await q
    .select({
      sellerId: stores.sellerId,
      storeId: stores.id,
      subdomain: stores.subdomain,
      status: stores.status,
      deletedAt: stores.deletedAt,
      sellerStatus: sellers.status,
    })
    .from(stores)
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .where(eq(stores.id, storeId))
    .limit(1);
  if (!row || row.deletedAt !== null) return null;
  return {
    sellerId: row.sellerId,
    storeId: row.storeId,
    subdomain: row.subdomain,
    status: row.status,
    sellerStatus: row.sellerStatus ?? "pending",
  };
}

/** Marks the store's site as edited by an admin (0085). */
export async function markSiteEditedByAdmin(storeId: string, q: Queryable = db): Promise<void> {
  await q.update(stores).set({ siteEditedByAdminAt: sql`now()` }).where(eq(stores.id, storeId));
}

export type StoreSiteAuditEntry = Pick<AdminAuditEntry, "actorId" | "action" | "before" | "after" | "reason"> & {
  sellerId: string;
  storeId: string;
};

/** One admin_audit_log row for a store-site change. Call it in the change's transaction. */
export function auditStoreSite(q: Queryable, entry: StoreSiteAuditEntry): Promise<string> {
  return writeAdminAudit(q, { ...entry, storeId: entry.storeId });
}
