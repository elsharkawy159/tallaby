import { and, db, eq, isNull, sellers, stores } from "@workspace/db";
import { AgentError, type AgentContext } from "./types";

/**
 * Ownership checks every agent tool and the confirm step use (CLAUDE.md
 * rule 5). The store must belong to the context's seller and not be deleted;
 * writes also need it active (archived and suspended stores are read-only,
 * like the dashboard). The lib functions the tools call check again.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type OwnedStore = { id: string; status: string; subdomain: string; settings: unknown; contact: unknown; seo: unknown };

export async function requireOwnedStore(ctx: Pick<AgentContext, "sellerId" | "storeId">, opts: { forWrite: boolean }): Promise<OwnedStore> {
  if (!UUID_RE.test(ctx.storeId) || !UUID_RE.test(ctx.sellerId)) throw new AgentError("not_found", "Store not found.");
  const [store] = await db
    .select({
      id: stores.id,
      status: stores.status,
      subdomain: stores.subdomain,
      settings: stores.settings,
      contact: stores.contact,
      seo: stores.seo,
    })
    .from(stores)
    .where(and(eq(stores.id, ctx.storeId), eq(stores.sellerId, ctx.sellerId), isNull(stores.deletedAt)))
    .limit(1);
  if (!store) throw new AgentError("not_found", "Store not found.");
  if (opts.forWrite && store.status !== "active") throw new AgentError("store_read_only", "This store is archived or suspended.");
  return store;
}

/** sellers.status, needed by the product tools (only approved sellers publish). */
export async function sellerStatusOf(sellerId: string): Promise<string> {
  const [row] = await db.select({ status: sellers.status }).from(sellers).where(eq(sellers.id, sellerId)).limit(1);
  if (!row) throw new AgentError("not_found", "Seller not found.");
  return row.status ?? "pending";
}
