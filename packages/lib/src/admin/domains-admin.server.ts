/**
 * Admin custom domains (docs/admin-saas.md §3.7). Re-check and remove use the
 * same Vercel calls as the seller's own buttons (apps/dashboard/actions/
 * custom-domain.ts), so the admin app needs the STOREFRONT_VERCEL_* env vars.
 */
import { and, db, eq, isNull, or, sellerCustomDomains, sellers, sql, stores } from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { normalizeCustomDomain, validateCustomDomain } from "../storefront";
import { refreshCustomDomain, type CustomDomainRow } from "../storefront/custom-domains.server";
import { addProjectDomain, removeProjectDomain, wwwOf } from "../storefront/vercel-domains";
import { assertAdminActor, AdminActorError, writeAdminAudit, type Queryable } from "./guard.server";
import { adminOrderBy, type AdminListSort } from "./list-sort.server";
import { ADMIN_LIST_PAGE_SIZE, domainAdminActionSchema, domainAssignSchema, likePattern, type SaasAdminError } from "./saas.lib";

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

export type DomainAssignError =
  | SaasAdminError
  | "domain_invalid"
  | "domain_platform"
  | "domain_taken"
  | "store_has_domain"
  | "seller_has_domain";

export type DomainAssignResult = { domainId: string; domain: string; subdomain: string; status: string };

/**
 * An admin connects a custom domain to a store, the same way the seller's
 * "Connect" button does (apps/dashboard/actions/custom-domain.ts): the apex
 * and its www redirect are attached to the ecommerce project on Vercel, then
 * the row is saved as pending with an audit row. Any store of the seller,
 * but still one domain per seller until P3-03b drops
 * `seller_custom_domains_seller_id_key`. The seller then sets up DNS from the
 * records shown in their dashboard (or here).
 */
export async function assignDomainForAdmin(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<{ success: true; data: DomainAssignResult } | { success: false; error: DomainAssignError }> {
  const parsed = domainAssignSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const { storeId, reason } = parsed.data;
  const domain = normalizeCustomDomain(parsed.data.domain);
  const problem = validateCustomDomain(domain);
  if (problem) return { success: false, error: problem === "platform" ? "domain_platform" : "domain_invalid" };

  try {
    await assertAdminActor(q, actorId);
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    throw error;
  }

  const [store] = await q
    .select({ id: stores.id, sellerId: stores.sellerId, subdomain: stores.subdomain })
    .from(stores)
    .where(and(eq(stores.id, storeId), isNull(stores.deletedAt)))
    .limit(1);
  if (!store) return { success: false, error: "not_found" };

  const existing = await q
    .select({ storeId: sellerCustomDomains.storeId, sellerId: sellerCustomDomains.sellerId, domain: sellerCustomDomains.domain })
    .from(sellerCustomDomains)
    .where(
      or(
        eq(sellerCustomDomains.storeId, store.id),
        eq(sellerCustomDomains.sellerId, store.sellerId),
        eq(sellerCustomDomains.domain, domain),
      ),
    );
  if (existing.some((row) => row.domain === domain)) return { success: false, error: "domain_taken" };
  if (existing.some((row) => row.storeId === store.id)) return { success: false, error: "store_has_domain" };
  if (existing.length > 0) return { success: false, error: "seller_has_domain" };

  const detach = () => Promise.allSettled([removeProjectDomain(wwwOf(domain)), removeProjectDomain(domain)]);
  try {
    await addProjectDomain(domain);
    await addProjectDomain(wwwOf(domain), { redirect: domain });
  } catch (error) {
    // Don't leave a half-attached domain behind.
    await detach();
    throw error;
  }

  let row: CustomDomainRow | undefined;
  try {
    row = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [inserted] = await tx
        .insert(sellerCustomDomains)
        .values({ sellerId: store.sellerId, storeId: store.id, domain })
        .returning();
      await writeAdminAudit(tx, {
        actorId,
        sellerId: store.sellerId,
        storeId: store.id,
        action: "assign_domain",
        before: { domain: null },
        after: { domainId: inserted!.id, domain, status: inserted!.status },
        reason,
      });
      return inserted;
    });
  } catch (error) {
    await detach();
    // 23505: someone connected it (or another domain for this seller) in the meantime.
    const code = (error as { cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code;
    if (code === "23505") return { success: false, error: "domain_taken" };
    throw error;
  }
  if (!row) return { success: false, error: "not_found" };

  // Fill in Vercel's verification records right away; the cron re-checks later.
  try {
    row = await refreshCustomDomain(row);
  } catch (error) {
    console.error("Error checking assigned custom domain:", error);
  }
  return { success: true, data: { domainId: row.id, domain, subdomain: store.subdomain, status: row.status } };
}
