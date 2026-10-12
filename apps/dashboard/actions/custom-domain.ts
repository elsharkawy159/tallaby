"use server";

import { db, sellers, sellerCustomDomains } from "@workspace/db";
import { eq } from "drizzle-orm";
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
import { getUser } from "./auth";

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

async function currentSeller() {
  const session = await getUser();
  const sellerId = session?.user?.id;
  if (!sellerId) return null;
  return db.query.sellers.findFirst({
    where: eq(sellers.id, sellerId),
    columns: { id: true, subdomain: true, status: true },
  });
}

async function findRow(sellerId: string) {
  const [row] = await db
    .select()
    .from(sellerCustomDomains)
    .where(eq(sellerCustomDomains.sellerId, sellerId))
    .limit(1);
  return row ?? null;
}

async function invalidate(subdomain: string, domain: string) {
  await applyInvalidation(invalidateCustomDomain(subdomain, domain), {
    from: "dashboard",
    mode: "action",
  });
  revalidatePath("/settings");
}

function vercelFailure(error: unknown): CustomDomainResult {
  if (error instanceof VercelDomainsError) {
    console.error("Vercel domains API:", error.vercelCode, error.message);
    return { success: false, error: error.code === "taken" ? "taken" : error.code };
  }
  console.error("Custom domain error:", error);
  return { success: false, error: "failed" };
}

/** The seller's custom domain, or null when they haven't added one. */
export async function getCustomDomain(): Promise<CustomDomainResult> {
  const seller = await currentSeller();
  if (!seller) return { success: false, error: "unauthorized" };
  const row = await findRow(seller.id);
  return { success: true, domain: row ? toView(row) : null };
}

/**
 * Connects `input` (e.g. faster-eg.com) to the seller's storefront: attaches
 * the apex and its www redirect to the ecommerce project on Vercel, then saves
 * it as pending until DNS is set up and verified.
 */
export async function addCustomDomain(input: string): Promise<CustomDomainResult> {
  const seller = await currentSeller();
  if (!seller) return { success: false, error: "unauthorized" };
  if (seller.status !== "approved") return { success: false, error: "notApproved" };

  const domain = normalizeCustomDomain(input);
  const problem = validateCustomDomain(domain);
  if (problem) return { success: false, error: problem };

  if (await findRow(seller.id)) return { success: false, error: "hasDomain" };
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
      .values({ sellerId: seller.id, domain })
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
  await invalidate(seller.subdomain, domain);
  return { success: true, domain: toView(row) };
}

/** Re-checks verification and DNS with Vercel (the seller's "Verify" button). */
export async function verifyCustomDomain(): Promise<CustomDomainResult> {
  const seller = await currentSeller();
  if (!seller) return { success: false, error: "unauthorized" };
  const row = await findRow(seller.id);
  if (!row) return { success: true, domain: null };

  try {
    const updated = await refreshCustomDomain(row);
    if (updated.status !== row.status) await invalidate(seller.subdomain, row.domain);
    return { success: true, domain: toView(updated) };
  } catch (error) {
    return vercelFailure(error);
  }
}

/** Disconnects the domain; the store goes back to {subdomain}.tallaby.com. */
export async function removeCustomDomain(): Promise<CustomDomainResult> {
  const seller = await currentSeller();
  if (!seller) return { success: false, error: "unauthorized" };
  const row = await findRow(seller.id);
  if (!row) return { success: true, domain: null };

  try {
    await removeProjectDomain(wwwOf(row.domain));
    await removeProjectDomain(row.domain);
  } catch (error) {
    return vercelFailure(error);
  }
  await db.delete(sellerCustomDomains).where(eq(sellerCustomDomains.id, row.id));
  await invalidate(seller.subdomain, row.domain);
  return { success: true, domain: null };
}
