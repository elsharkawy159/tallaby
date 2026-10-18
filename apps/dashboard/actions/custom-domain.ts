"use server";

import { db, sellerCustomDomains } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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
  addProjectDomain,
  removeProjectDomain,
  wwwOf,
  VercelDomainsError,
  type VercelDomainError,
  type VercelVerificationRecord,
} from "@workspace/lib/storefront/vercel-domains";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";

/** What the settings card shows about the seller's own domain. */
export type CustomDomainView = {
  domain: string;
  status: CustomDomainStatus;
  /** TXT records Vercel wants before it trusts the domain, if any. */
  verification: VercelVerificationRecord[];
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
        | Exclude<VercelDomainError, "taken">
        | "failed";
    };

function toView(row: CustomDomainRow): CustomDomainView {
  return {
    domain: row.domain,
    status: row.status as CustomDomainStatus,
    verification: Array.isArray(row.verification)
      ? (row.verification as VercelVerificationRecord[])
      : [],
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
  revalidatePath("/settings");
  revalidatePath(`/stores/${store.storeId}/website/domain`, "layout");
}

function vercelFailure(error: unknown): CustomDomainResult {
  if (error instanceof VercelDomainsError) {
    console.error("Vercel domains API:", error.vercelCode, error.message);
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
 * its www redirect to the ecommerce project on Vercel, then saves it as
 * pending until DNS is set up and verified. Primary store only until P3-03b.
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

  try {
    await addProjectDomain(domain);
    await addProjectDomain(wwwOf(domain), { redirect: domain });
  } catch (error) {
    // Don't leave a half-attached domain behind.
    await Promise.allSettled([
      removeProjectDomain(wwwOf(domain)),
      removeProjectDomain(domain),
    ]);
    return vercelFailure(error);
  }

  let row: CustomDomainRow | undefined;
  try {
    [row] = await db
      .insert(sellerCustomDomains)
      .values({ sellerId: store.sellerId, storeId: store.storeId, domain })
      .returning();
  } catch (error) {
    await Promise.allSettled([
      removeProjectDomain(wwwOf(domain)),
      removeProjectDomain(domain),
    ]);
    // 23505: another seller (or another tab) added it in the meantime.
    const code =
      (error as { cause?: { code?: string } })?.cause?.code ??
      (error as { code?: string })?.code;
    if (code === "23505") return { success: false, error: "taken" };
    console.error("Error saving custom domain:", error);
    return { success: false, error: "failed" };
  }
  if (!row) return { success: false, error: "failed" };

  // Fill in Vercel's verification records right away.
  try {
    row = await refreshCustomDomain(row);
  } catch (error) {
    console.error("Error checking new custom domain:", error);
  }
  await invalidate(store, domain);
  return { success: true, domain: toView(row) };
}

/** Re-checks verification and DNS with Vercel (the seller's "Verify" button). */
export async function verifyCustomDomain(storeId: string): Promise<CustomDomainResult> {
  const store = await currentStore(storeId);
  if (!store) return { success: false, error: "unauthorized" };
  const row = await findRow(store);
  if (!row) return { success: true, domain: null };

  try {
    const updated = await refreshCustomDomain(row);
    if (updated.status !== row.status) await invalidate(store, row.domain);
    return { success: true, domain: toView(updated) };
  } catch (error) {
    return vercelFailure(error);
  }
}

/** Disconnects the domain; the store goes back to {subdomain}.tallaby.com. */
export async function removeCustomDomain(storeId: string): Promise<CustomDomainResult> {
  const store = await currentStore(storeId);
  if (!store) return { success: false, error: "unauthorized" };
  const row = await findRow(store);
  if (!row) return { success: true, domain: null };

  try {
    await removeProjectDomain(wwwOf(row.domain));
    await removeProjectDomain(row.domain);
  } catch (error) {
    return vercelFailure(error);
  }
  await db
    .delete(sellerCustomDomains)
    .where(and(eq(sellerCustomDomains.id, row.id), eq(sellerCustomDomains.sellerId, store.sellerId)));
  await invalidate(store, row.domain);
  return { success: true, domain: null };
}
