/**
 * Has the seller chosen a template for this store? (owner, 2026-10-27: Tallaby
 * Classic is no longer treated as the seller's choice; a store cannot go live
 * until a template is picked.)
 *
 * A new store still gets Tallaby Classic in its DRAFTS as a placeholder
 * (stores/starter-site.server.ts), so the editor and preview work before a
 * pick, but the scaffold writes no `template_installs` row. Only "Use
 * template" (applyStoreTemplate) writes one, so an install that was not
 * undone is the explicit choice. A store that was ever published
 * (`first_published_at`, or `site_status` published/unpublished) counts as
 * chosen, so stores that are already live are unaffected.
 *
 * Internal: the caller must already have checked that the store belongs to
 * the session's seller. Server-only.
 */
import { eq, sql, stores, templateInstalls, type db } from "@workspace/db";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export async function storeTemplateChosen(q: Queryable, storeId: string): Promise<boolean> {
  // The subquery names its tables itself: a one-table select renders Drizzle
  // columns unqualified, so `${templateInstalls.storeId} = ${stores.id}` came
  // out as "store_id" = "id" (both template_installs) and was never true.
  const [row] = await q
    .select({
      chosen: sql<boolean>`(${stores.firstPublishedAt} IS NOT NULL
        OR ${stores.siteStatus} IN ('published', 'unpublished')
        OR EXISTS (SELECT 1 FROM ${templateInstalls} ti WHERE ti.store_id = "stores"."id" AND ti.undone_at IS NULL))`,
    })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);
  return Boolean(row?.chosen);
}
