/**
 * Admin custom domains (docs/admin-saas.md §3.7). Re-check and remove use the
 * same Vercel calls as the seller's own buttons (apps/dashboard/actions/
 * custom-domain.ts), so the admin app needs the STOREFRONT_VERCEL_* env vars.
 */
import { and, db, eq, sellerCustomDomains, sellers, sql, stores } from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { refreshCustomDomain } from "../storefront/custom-domains.server";
import { removeProjectDomain, wwwOf } from "../storefront/vercel-domains";
import { assertAdminActor, AdminActorError, writeAdminAudit, type Queryable } from "./guard.server";
import { adminOrderBy, type AdminListSort } from "./list-sort.server";
import { ADMIN_LIST_PAGE_SIZE, domainAdminActionSchema, likePattern, type SaasAdminError } from "./saas.lib";

export interface AdminDomainListInput {
  status: string | null;
  q: string | null;
  page: number;
  /** An id from DOMAIN_SORT_IDS; default failing first, then recently updated. */
  sort?: AdminListSort | null;
}

export const DOMAIN_SORT_IDS = ["domain", "store", "status", "lastCheckedAt"] as const;

const DOMAIN_SORT_COLUMNS: Record<(typeof DOMAIN_SORT_IDS)[number], SQL> = {
  domain: sql`${sellerCustomDomains.domain}`,
  store: sql`lower(${stores.name})`,
  status: sql`${sellerCustomDomains.status}`,
  lastCheckedAt: sql`${sellerCustomDomains.lastCheckedAt}`,
};

export async function listDomainsForAdmin(input: AdminDomainListInput, q: Queryable = db) {
  const conditions: SQL[] = [];
  if (input.status) conditions.push(eq(sellerCustomDomains.status, input.status));
  if (input.q) {
    const like = likePattern(input.q);
    conditions.push(sql`(${sellerCustomDomains.domain} ILIKE ${like} OR ${stores.name} ILIKE ${like} OR ${sellers.businessName} ILIKE ${like})`);
  }
  const rows = await q
    .select({
      id: sellerCustomDomains.id,
      domain: sellerCustomDomains.domain,
      status: sellerCustomDomains.status,
      lastError: sellerCustomDomains.lastError,
      lastCheckedAt: sellerCustomDomains.lastCheckedAt,
      verifiedAt: sellerCustomDomains.verifiedAt,
      createdAt: sellerCustomDomains.createdAt,
      sellerId: sellerCustomDomains.sellerId,
      sellerName: sql<string | null>`coalesce(nullif(${sellers.displayName}, ''), ${sellers.businessName})`,
      storeId: sellerCustomDomains.storeId,
      storeName: stores.name,
      subdomain: stores.subdomain,
      totalCount: sql<number>`count(*) OVER ()::int`,
    })
    .from(sellerCustomDomains)
    .innerJoin(sellers, eq(sellers.id, sellerCustomDomains.sellerId))
    .leftJoin(stores, eq(stores.id, sellerCustomDomains.storeId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      adminOrderBy(
        input.sort,
        DOMAIN_SORT_COLUMNS,
        sql`(${sellerCustomDomains.status} = 'failed') DESC, ${sellerCustomDomains.updatedAt} DESC`,
        sql`${sellerCustomDomains.id}`,
      ),
    )
    .limit(ADMIN_LIST_PAGE_SIZE)
    .offset((input.page - 1) * ADMIN_LIST_PAGE_SIZE);
  return { rows: rows.map(({ totalCount: _total, ...row }) => row), total: Number(rows[0]?.totalCount ?? 0) };
}

export type AdminDomainRow = Awaited<ReturnType<typeof listDomainsForAdmin>>["rows"][number];

export type DomainAdminResult = {
  domain: string;
  subdomain: string | null;
  status: string | null;
  statusChanged: boolean;
};

/**
 * - recheck: asks Vercel again and saves the result (no setting changes, no audit).
 * - remove_domain: detaches the domain (and its www.) from Vercel, deletes the
 *   row and writes the audit row; the store goes back to its subdomain.
 */
export async function applyDomainAdminAction(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<{ success: true; data: DomainAdminResult } | { success: false; error: SaasAdminError }> {
  const parsed = domainAdminActionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { action, domainId, reason } = parsed.data;

  try {
    await assertAdminActor(q, actorId);
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    throw error;
  }

  const [row] = await q.select().from(sellerCustomDomains).where(eq(sellerCustomDomains.id, domainId)).limit(1);
  if (!row) return { success: false, error: "not_found" };
  const [store] = row.storeId
    ? await q.select({ subdomain: stores.subdomain }).from(stores).where(eq(stores.id, row.storeId)).limit(1)
    : [];
  const subdomain = store?.subdomain ?? null;

  if (action === "recheck") {
    const updated = await refreshCustomDomain(row);
    return { success: true, data: { domain: row.domain, subdomain, status: updated.status, statusChanged: updated.status !== row.status } };
  }

  // Vercel first (as the seller flow does): a failure leaves the row in place to retry.
  await removeProjectDomain(wwwOf(row.domain));
  await removeProjectDomain(row.domain);
  await q.transaction(async (tx) => {
    await assertAdminActor(tx, actorId);
    await tx.delete(sellerCustomDomains).where(and(eq(sellerCustomDomains.id, row.id), eq(sellerCustomDomains.sellerId, row.sellerId)));
    await writeAdminAudit(tx, {
      actorId,
      sellerId: row.sellerId,
      storeId: row.storeId,
      action: "remove_domain",
      before: { domainId: row.id, domain: row.domain, status: row.status },
      after: { domainId: row.id, domain: row.domain, removed: true },
      reason: reason ?? "",
    });
  });
  return { success: true, data: { domain: row.domain, subdomain, status: null, statusChanged: true } };
}
