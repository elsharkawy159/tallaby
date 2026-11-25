"use server";

import { db, sellerCustomDomains } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { applyInvalidation, invalidateCustomDomain } from "@workspace/cache";
import {
  normalizeCustomDomain,
  validateCustomDomain,
  type CustomDomainProblem,
} from "@workspace/lib/storefront";
import {
  refreshCustomDomain,
  type CustomDomainRow,
  type CustomDomainStatus,
} from "@workspace/lib/storefront/server";
import {
  CustomDomainProviderError,
  customDomainPublicHost,
  customDomainProvider,
  isWwwPrimary,
  newCustomDomainProviderId,
  type CustomDomainProvider,
  type CustomDomainProviderErrorCode,
  type DnsTarget,
  type DomainVerificationRecord,
} from "@workspace/lib/storefront/custom-domain-provider";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";

/** What the settings card shows about the seller's own domain. */
export type CustomDomainView = {
  domain: string;
  /** The host visitors open: `domain`, or `www.<domain>` while its root isn't live (Cloudflare). */
  publicHost: string;
  /** True when the store is served on `www.<domain>` (the seller should forward the root there). */
  wwwPrimary: boolean;
  status: CustomDomainStatus;
  /** TXT records the provider wants before it trusts the domain, if any. */
  verification: DomainVerificationRecord[];
  /** The records that point the domain at us (from the row's provider). */
  routing: DnsTarget[];
  /** "unverified" | "dns" | "not_attached" while not active. */
  lastError: string | null;
  lastCheckedAt: string | null;
};

export type CustomDomainResult =
  | { success: true; domain: CustomDomainView | null }
  | {
      success: false;
      error:
        | CustomDomainProblem
        | "taken"
        | "hasDomain"
        | "notApproved"
        | "unauthorized"
        | "primaryOnly"
        | Exclude<CustomDomainProviderErrorCode, "taken">
        | "failed";
    };

function toView(row: CustomDomainRow): CustomDomainView {
  return {
    domain: row.domain,
    publicHost: customDomainPublicHost(row.domain, row.providerMeta),
    wwwPrimary: isWwwPrimary(row.providerMeta),
    status: row.status as CustomDomainStatus,
    verification: Array.isArray(row.verification)
      ? (row.verification as DomainVerificationRecord[])
      : [],
    routing: customDomainProvider(row.provider).routingRecords(row.domain),
    lastError: row.lastError,
    lastCheckedAt: row.lastCheckedAt,
  };
}

/**
 * The store whose domain is managed (P4-14: explicit storeId, ownership
 * re-checked; never a client seller id). Null when it is not the caller's.
 */
async function currentStore(storeId: string, options: { forWrite?: boolean } = {}) {
  try {
    const { seller, store } = await requireStore(String(storeId), options);
    return {
      sellerId: seller.sellerId,
      status: seller.status,
      storeId: store.id,
      subdomain: store.subdomain,
      isPrimary: store.isPrimary,
    };
  } catch (error) {
    if (isAccessError(error)) return null;
    throw error;
  }
}

type CurrentStore = NonNullable<Awaited<ReturnType<typeof currentStore>>>;

/**
 * The store's domain row. Until P3-03b (owner approval) a seller has at most
 * one custom domain, attached to the primary store (0050 fills store_id).
 */
async function findRow(store: CurrentStore) {
  const [row] = await db
    .select()
    .from(sellerCustomDomains)
    .where(and(eq(sellerCustomDomains.sellerId, store.sellerId), eq(sellerCustomDomains.storeId, store.storeId)))
    .limit(1);
  return row ?? null;
}

async function invalidate(store: CurrentStore, domain: string) {
  await applyInvalidation(invalidateCustomDomain(store.subdomain, domain), {
    from: "dashboard",
    mode: "action",
  });
  revalidateDashboardPath("/settings");
  revalidateDashboardPath("/stores/[storeId]/website/domain", "layout");
}

function providerFailure(error: unknown): CustomDomainResult {
  if (error instanceof CustomDomainProviderError) {
    console.error(`Custom domain provider (${error.provider ?? "none"}):`, error.providerCode, error.message);
    return { success: false, error: error.code === "taken" ? "taken" : error.code };
  }
  console.error("Custom domain error:", error);
  return { success: false, error: "failed" };
}

/** The store's custom domain, or null when it has none. */
export async function getCustomDomain(storeId: string): Promise<CustomDomainResult> {
  const store = await currentStore(storeId);
  if (!store) return { success: false, error: "unauthorized" };
  const row = await findRow(store);
  return { success: true, domain: row ? toView(row) : null };
}

/**
 * Connects `input` (e.g. faster-eg.com) to the store: attaches the apex and
 * its www at the provider for new domains (CUSTOM_DOMAIN_PROVIDER, Vercel by
 * default; never from the client), then saves it as pending with that provider
 * until DNS is set up and verified. Primary store only until P3-03b.
 */
export async function addCustomDomain(storeId: string, input: string): Promise<CustomDomainResult> {
  const store = await currentStore(storeId, { forWrite: true });
  if (!store) return { success: false, error: "unauthorized" };
  if (!store.isPrimary) return { success: false, error: "primaryOnly" };
  if (store.status !== "approved") return { success: false, error: "notApproved" };

  const domain = normalizeCustomDomain(input);
  const problem = validateCustomDomain(domain);
  if (problem) return { success: false, error: problem };

  const [existing] = await db
    .select({ id: sellerCustomDomains.id })
    .from(sellerCustomDomains)
    .where(eq(sellerCustomDomains.sellerId, store.sellerId))
    .limit(1);
  if (existing) return { success: false, error: "hasDomain" };
  const [owner] = await db
    .select({ id: sellerCustomDomains.id })
    .from(sellerCustomDomains)
    .where(eq(sellerCustomDomains.domain, domain))
    .limit(1);
  if (owner) return { success: false, error: "taken" };

  let provider: CustomDomainProvider;
  let meta: Awaited<ReturnType<CustomDomainProvider["attach"]>>["meta"];
  try {
    provider = customDomainProvider(newCustomDomainProviderId());
    // attach() detaches what it attached when it fails part-way.
    ({ meta } = await provider.attach(domain));
  } catch (error) {
    return providerFailure(error);
  }

  let row: CustomDomainRow | undefined;
  try {
    [row] = await db
      .insert(sellerCustomDomains)
      .values({ sellerId: store.sellerId, storeId: store.storeId, domain, provider: provider.id, providerMeta: meta })
      .returning();
  } catch (error) {
    await provider.detach(domain, { meta, bestEffort: true });
    // 23505: another seller (or another tab) added it in the meantime.
    const code =
      (error as { cause?: { code?: string } })?.cause?.code ??
      (error as { code?: string })?.code;
    if (code === "23505") return { success: false, error: "taken" };
    console.error("Error saving custom domain:", error);
    return { success: false, error: "failed" };
  }
  if (!row) return { success: false, error: "failed" };

  // Fill in the provider's verification records right away.
  try {
    row = await refreshCustomDomain(row);
  } catch (error) {
    console.error("Error checking new custom domain:", error);
  }
  await invalidate(store, domain);
  return { success: true, domain: toView(row) };
}

/** Re-checks verification and DNS with the domain's provider (the seller's "Verify" button). */
export async function verifyCustomDomain(storeId: string): Promise<CustomDomainResult> {
  // It saves the refreshed status, so it is a write: a suspended seller is refused.
  const store = await currentStore(storeId, { forWrite: true });
  if (!store) return { success: false, error: "unauthorized" };
  const row = await findRow(store);
  if (!row) return { success: true, domain: null };

  try {
    const updated = await refreshCustomDomain(row);
    const hostChanged =
      customDomainPublicHost(updated.domain, updated.providerMeta) !== customDomainPublicHost(row.domain, row.providerMeta);
    if (updated.status !== row.status || hostChanged) await invalidate(store, row.domain);
    return { success: true, domain: toView(updated) };
  } catch (error) {
    return providerFailure(error);
  }
}

/** Disconnects the domain; the store goes back to {subdomain}.tallaby.com. */
export async function removeCustomDomain(storeId: string): Promise<CustomDomainResult> {
  const store = await currentStore(storeId, { forWrite: true });
  if (!store) return { success: false, error: "unauthorized" };
  const row = await findRow(store);
  if (!row) return { success: true, domain: null };

  try {
    await customDomainProvider(row.provider).detach(row.domain, { meta: row.providerMeta });
  } catch (error) {
    return providerFailure(error);
  }
  await db
    .delete(sellerCustomDomains)
    .where(and(eq(sellerCustomDomains.id, row.id), eq(sellerCustomDomains.sellerId, store.sellerId)));
  await invalidate(store, row.domain);
  return { success: true, domain: null };
}
