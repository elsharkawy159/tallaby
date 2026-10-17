/**
 * Seller custom domains (faster-eg.com) on the server: the DB lookups and
 * the Vercel status check shared by the dashboard, the ecommerce proxy and the
 * re-check cron.
 */

import { db, and, eq, isNull, sellerCustomDomains, sellers, stores } from "@workspace/db";
import {
  getProjectDomain,
  isDomainMisconfigured,
  verifyProjectDomain,
  type VercelVerificationRecord,
} from "./vercel-domains";

export type CustomDomainStatus = "pending" | "active" | "failed";

export type CustomDomainRow = typeof sellerCustomDomains.$inferSelect;

type Queryable = Pick<typeof db, "select">;

/**
 * The store subdomain an active custom domain serves, or null. Resolves
 * through the domain's store (PLAN.md P5-00): only active, non-deleted stores
 * of approved sellers.
 */
export async function findSubdomainForCustomDomain(domain: string, q: Queryable = db): Promise<string | null> {
  const [row] = await q
    .select({ subdomain: stores.subdomain })
    .from(sellerCustomDomains)
    .innerJoin(stores, eq(stores.id, sellerCustomDomains.storeId))
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .where(
      and(
        eq(sellerCustomDomains.domain, domain),
        eq(sellerCustomDomains.status, "active"),
        eq(stores.status, "active"),
        isNull(stores.deletedAt),
        eq(sellers.status, "approved"),
      ),
    )
    .limit(1);
  return row?.subdomain ?? null;
}

/** The active custom domain of the store at `subdomain`, or null. */
export async function findActiveCustomDomainForSubdomain(
  subdomain: string,
  q: Queryable = db,
): Promise<string | null> {
  const [row] = await q
    .select({ domain: sellerCustomDomains.domain })
    .from(stores)
    .innerJoin(sellerCustomDomains, eq(sellerCustomDomains.storeId, stores.id))
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .where(
      and(
        eq(stores.subdomain, subdomain),
        eq(stores.status, "active"),
        isNull(stores.deletedAt),
        eq(sellerCustomDomains.status, "active"),
        eq(sellers.status, "approved"),
      ),
    )
    .limit(1);
  return row?.domain ?? null;
}

/** True when `domain` is an active custom domain (any approved seller). */
export async function isActiveCustomDomain(domain: string): Promise<boolean> {
  return (await findSubdomainForCustomDomain(domain)) !== null;
}

export type CustomDomainCheck = {
  status: CustomDomainStatus;
  verification: VercelVerificationRecord[] | null;
  lastError: string | null;
};

/**
 * Asks Vercel where `domain` stands. Active once Vercel has verified
 * ownership and DNS points at it; a domain that was active and stops being
 * so becomes `failed`, otherwise it stays `pending`.
 */
export async function checkCustomDomain(
  domain: string,
  previous: CustomDomainStatus,
): Promise<CustomDomainCheck> {
  let project = await getProjectDomain(domain);
  if (project && !project.verified) {
    project = (await verifyProjectDomain(domain)) ?? project;
  }

  const notReady = previous === "active" ? "failed" : "pending";
  if (!project) {
    return { status: "failed", verification: null, lastError: "not_attached" };
  }
  if (!project.verified) {
    return {
      status: notReady,
      verification: project.verification ?? null,
      lastError: "unverified",
    };
  }
  if (await isDomainMisconfigured(domain)) {
    return { status: notReady, verification: null, lastError: "dns" };
  }
  return { status: "active", verification: null, lastError: null };
}

/** Runs `checkCustomDomain` and saves the result. Returns the updated row. */
export async function refreshCustomDomain(row: CustomDomainRow): Promise<CustomDomainRow> {
  const check = await checkCustomDomain(row.domain, row.status as CustomDomainStatus);
  const now = new Date().toISOString();
  const [updated] = await db
    .update(sellerCustomDomains)
    .set({
      status: check.status,
      verification: check.verification,
      lastError: check.lastError,
      lastCheckedAt: now,
      updatedAt: now,
      ...(check.status === "active" && row.status !== "active" ? { verifiedAt: now } : {}),
    })
    .where(eq(sellerCustomDomains.id, row.id))
    .returning();
  return updated ?? row;
}
