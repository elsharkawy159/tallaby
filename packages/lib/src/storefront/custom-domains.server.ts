/**
 * Seller custom domains (faster-eg.com) on the server: the DB lookups and
 * the provider status check (Vercel or Cloudflare, per row) shared by the
 * dashboard, the ecommerce proxy and the re-check cron.
 */

import type { SQL } from "drizzle-orm";
import { db, and, eq, isNull, or, sql, sellerCustomDomains, sellers, stores } from "@workspace/db";
import {
  customDomainProvider,
  type CustomDomainCheck,
  type CustomDomainStatus,
} from "./custom-domain-provider";

export type { CustomDomainCheck, CustomDomainStatus };

export type CustomDomainRow = typeof sellerCustomDomains.$inferSelect;

type Queryable = Pick<typeof db, "select">;

/**
 * The public host of a `seller_custom_domains` row in SQL, the same rule as
 * `customDomainPublicHost` (custom-domain-provider.lib.ts): `www.<domain>`
 * for a www-primary row (`provider_meta.primary = "www"`), else the domain.
 * For selects that build a link a visitor or seller opens; identity checks
 * and labels keep using `domain`.
 */
export function customDomainPublicHostSql(): SQL<string> {
  return sql<string>`CASE WHEN ${sellerCustomDomains.providerMeta}->>'primary' = 'www' THEN 'www.' || ${sellerCustomDomains.domain} ELSE ${sellerCustomDomains.domain} END`;
}

/**
 * The same rule for raw SQL over `seller_custom_domains` aliased `alias`
 * (a fixed name in code, never input): `SELECT ${customDomainPublicHostRawSql("d")} FROM seller_custom_domains d`.
 */
export function customDomainPublicHostRawSql(alias: string): SQL {
  if (!/^[a-z_][a-z0-9_]*$/.test(alias)) throw new Error(`Invalid SQL alias "${alias}"`);
  return sql.raw(`CASE WHEN ${alias}.provider_meta->>'primary' = 'www' THEN 'www.' || ${alias}.domain ELSE ${alias}.domain END`);
}

/**
 * Rows whose public host is `host`: a root-primary row named `host`, or,
 * for `www.<domain>`, the www-primary row of `<domain>`. The root of a
 * www-primary row matches nothing (it isn't routed). Both branches use the
 * unique index on `domain`.
 */
function publicHostIs(host: string): SQL | undefined {
  const notWwwPrimary = sql`(${sellerCustomDomains.providerMeta}->>'primary') IS DISTINCT FROM 'www'`;
  const root = and(eq(sellerCustomDomains.domain, host), notWwwPrimary);
  const bare = host.startsWith("www.") ? host.slice("www.".length) : "";
  if (!bare) return root;
  return or(root, and(eq(sellerCustomDomains.domain, bare), sql`${sellerCustomDomains.providerMeta}->>'primary' = 'www'`));
}

/**
 * The store subdomain an active custom domain serves at `domain` (its public
 * host: the root, or `www.<root>` for a www-primary row), or null. Resolves
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
        publicHostIs(domain),
        eq(sellerCustomDomains.status, "active"),
        eq(stores.status, "active"),
        isNull(stores.deletedAt),
        eq(sellers.status, "approved"),
      ),
    )
    .limit(1);
  return row?.subdomain ?? null;
}

/** The public host of the active custom domain of the store at `subdomain`, or null. */
export async function findActiveCustomDomainForSubdomain(
  subdomain: string,
  q: Queryable = db,
): Promise<string | null> {
  const [row] = await q
    .select({ domain: customDomainPublicHostSql() })
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

/**
 * What the ecommerce proxy needs to route a store host, in one query: the
 * store's subdomain, its active custom domain, and its languages (the default
 * language is what an unprefixed address shows). Only active, non-deleted
 * stores of approved sellers, as the lookups above.
 */
export type StoreHostInfo = {
  subdomain: string;
  customDomain: string | null;
  defaultLocale: string;
  supportedLocales: string[];
};

/** `customDomain` is the public host (see customDomainPublicHostSql). */
const storeHostColumns = () => ({
  subdomain: stores.subdomain,
  customDomain: sql<string | null>`${customDomainPublicHostSql()}`,
  defaultLocale: stores.defaultLocale,
  supportedLocales: stores.supportedLocales,
});

/** The store at `subdomain`, with its active custom domain (if any) and its languages, or null. */
export async function findStoreHostBySubdomain(subdomain: string, q: Queryable = db): Promise<StoreHostInfo | null> {
  const [row] = await q
    .select(storeHostColumns())
    .from(stores)
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .leftJoin(
      sellerCustomDomains,
      and(eq(sellerCustomDomains.storeId, stores.id), eq(sellerCustomDomains.status, "active")),
    )
    .where(
      and(
        eq(stores.subdomain, subdomain),
        eq(stores.status, "active"),
        isNull(stores.deletedAt),
        eq(sellers.status, "approved"),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** The store an active custom domain serves at its public host `domain`, with its languages, or null. */
export async function findStoreHostByCustomDomain(domain: string, q: Queryable = db): Promise<StoreHostInfo | null> {
  const [row] = await q
    .select(storeHostColumns())
    .from(sellerCustomDomains)
    .innerJoin(stores, eq(stores.id, sellerCustomDomains.storeId))
    .innerJoin(sellers, eq(sellers.id, stores.sellerId))
    .where(
      and(
        publicHostIs(domain),
        eq(sellerCustomDomains.status, "active"),
        eq(stores.status, "active"),
        isNull(stores.deletedAt),
        eq(sellers.status, "approved"),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** True when `domain` is the public host of an active custom domain (any approved seller). */
export async function isActiveCustomDomain(domain: string): Promise<boolean> {
  return (await findSubdomainForCustomDomain(domain)) !== null;
}

/**
 * Asks the domain's provider where `domain` stands (`vercel` unless told
 * otherwise, as before 0177). Active once the provider routes it with a valid
 * certificate; a domain that was active and stops being so becomes `failed`,
 * otherwise it stays `pending`.
 */
export async function checkCustomDomain(
  domain: string,
  previous: CustomDomainStatus,
  options: { provider?: string; meta?: unknown } = {},
): Promise<CustomDomainCheck> {
  return customDomainProvider(options.provider ?? "vercel").check(domain, previous, { meta: options.meta });
}

/** Runs `checkCustomDomain` with the row's own provider and saves the result. Returns the updated row. */
export async function refreshCustomDomain(row: CustomDomainRow): Promise<CustomDomainRow> {
  const check = await checkCustomDomain(row.domain, row.status as CustomDomainStatus, {
    provider: row.provider,
    meta: row.providerMeta,
  });
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
      // Only when the provider decided it (Cloudflare: which host is public).
      ...(check.meta ? { providerMeta: check.meta } : {}),
    })
    .where(eq(sellerCustomDomains.id, row.id))
    .returning();
  return updated ?? row;
}
