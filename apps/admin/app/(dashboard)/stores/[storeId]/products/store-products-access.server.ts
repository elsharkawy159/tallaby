import "server-only";
import { and, db, eq, isNull, sellers, stores } from "@workspace/db";
import { isAdminWriteRole, type AdminAuditAction } from "@workspace/lib/admin";
import { assertAdminActor, writeAdminAudit } from "@workspace/lib/admin/server";
import { parseStoreCurrency } from "@workspace/lib";
import type { AgentProductContext } from "@workspace/lib/products/agent/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";
import { sellerProductImagePath } from "./store-products.lib";

/**
 * Who may manage a store's products from Admin, and as which seller.
 * Plain server helpers (not actions). The seller is always the store's own
 * owner read from the database (sellers.id = stores.seller_id), never an id
 * from the browser; the store id comes from the route and must be a live
 * store. Every shared product command then re-checks in SQL that the store is
 * that seller's and that each product belongs to the store.
 */

export class StoreProductsAccessError extends Error {
  constructor(readonly code: "not_admin" | "not_found") {
    super(code);
    this.name = "StoreProductsAccessError";
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AdminStoreProductsAccess = {
  adminId: string;
  canWrite: boolean;
  store: { id: string; name: string; sellerId: string; subdomain: string; status: string; currencyLabel: string };
  /** The context the shared product commands take: the store's seller, acting admin as the stock/trash actor. */
  ctx: AgentProductContext;
};

/** Admins with product rights; `forWrite` also needs the admin or super_admin role (as other store writes). */
export async function requireStoreProductsAccess(storeId: unknown, { forWrite }: { forWrite: boolean }): Promise<AdminStoreProductsAccess> {
  let admin;
  try {
    admin = await validateAdminAccess("canManageProducts");
  } catch {
    throw new StoreProductsAccessError("not_admin");
  }
  const canWrite = isAdminWriteRole(admin.role);
  if (forWrite && !canWrite) throw new StoreProductsAccessError("not_admin");
  if (typeof storeId !== "string" || !UUID_RE.test(storeId)) throw new StoreProductsAccessError("not_found");

  const [row] = await db
    .select({
      id: stores.id,
      name: stores.name,
      sellerId: stores.sellerId,
      subdomain: stores.subdomain,
      status: stores.status,
      settings: stores.settings,
      sellerStatus: sellers.status,
    })
    .from(stores)
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .where(and(eq(stores.id, storeId), isNull(stores.deletedAt)))
    .limit(1);
  if (!row) throw new StoreProductsAccessError("not_found");

  return {
    adminId: admin.id,
    canWrite,
    store: {
      id: row.id,
      name: row.name,
      sellerId: row.sellerId,
      subdomain: row.subdomain,
      status: row.status,
      currencyLabel: parseStoreCurrency(row.settings).label,
    },
    // sellerStatus decides publishing exactly as for the seller ("approved" only).
    ctx: { sellerId: row.sellerId, userId: admin.id, sellerStatus: row.sellerStatus ?? "pending", storeId: row.id },
  };
}

/** One admin_audit_log row for a store product change, written right after the shared command succeeds. */
export async function auditStoreProducts(
  access: AdminStoreProductsAccess,
  action: AdminAuditAction,
  after: Record<string, unknown>,
  before: Record<string, unknown> = {},
) {
  try {
    await assertAdminActor(db, access.adminId);
    await writeAdminAudit(db, {
      actorId: access.adminId,
      sellerId: access.store.sellerId,
      storeId: access.store.id,
      targetType: "product",
      targetId: typeof after.productId === "string" ? after.productId : null,
      action,
      before,
      after,
      reason: "Admin store build",
    });
  } catch (error) {
    // The change is already saved; a failed audit row is logged, not shown as a failed save.
    console.error("[admin-store-products] audit failed", action, error instanceof Error ? error.message : error);
  }
}

/**
 * The image uploader for the shared create command: accepts only photos
 * already uploaded to this seller's folder in the "products" bucket (Admin's
 * signed upload), so nothing is downloaded and no other seller's file is used.
 */
export function sellerFolderImageUploader(sellerId: string) {
  return async (url: string) => {
    const path = sellerProductImagePath(url, { supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, sellerId });
    return path ? { ok: true as const, path } : { ok: false as const, reason: "not a photo uploaded for this store" };
  };
}
