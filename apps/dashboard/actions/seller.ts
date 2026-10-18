"use server";

import { db } from "@workspace/db";
import { sellers, sellerDocuments, sellerCustomDomains } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  applyInvalidation,
  invalidateCustomDomain,
  invalidateStorefront,
  mergeInvalidations,
} from "@workspace/cache";
import { type SubdomainProblem } from "@workspace/lib/storefront";
import {
  checkStoreSubdomain as checkStoreSubdomainStatus,
  updateStoreSubdomain as updateStoreSubdomainForStore,
} from "@workspace/lib/stores/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { getUser } from "./auth";


export async function getSellerProfile() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, session.user.id),
    });

    if (!seller) {
      throw new Error("Seller profile not found");
    }

    return { success: true, data: seller };
  } catch (error) {
    console.error("Error fetching seller profile:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateSellerProfile(data: {
  businessName?: string;
  displayName?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  returnPolicy?: string;
  shippingPolicy?: string;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const updatedSeller = await db
      .update(sellers)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sellers.id, session.user.id))
      .returning();

    // Name, logo, banner and policies all show on the storefront.
    if (updatedSeller[0]) {
      await applyInvalidation(invalidateStorefront([updatedSeller[0].subdomain]), {
        from: "dashboard",
        mode: "action",
      });
    }

    return { success: true, data: updatedSeller[0] };
  } catch (error) {
    console.error("Error updating seller profile:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getSellerDocuments() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const documents = await db.query.sellerDocuments.findMany({
      where: eq(sellerDocuments.sellerId, session.user.id),
      orderBy: [desc(sellerDocuments.uploadedAt)],
    });

    return { success: true, data: documents };
  } catch (error) {
    console.error("Error fetching seller documents:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function uploadSellerDocument(data: {
  documentType: string;
  fileUrl: string;
  expiryDate?: string;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const newDocument = await db
      .insert(sellerDocuments)
      .values({
        sellerId: session.user.id,
        documentType: data.documentType,
        fileUrl: data.fileUrl,
        expiryDate: data.expiryDate,
        status: "pending",
      })
      .returning();

    return { success: true, data: newDocument[0] };
  } catch (error) {
    console.error("Error uploading document:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getSellerMetrics() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, session.user.id),
      columns: {
        storeRating: true,
        positiveRatingPercent: true,
        totalRatings: true,
        productCount: true,
        walletBalance: true,
        sellerLevel: true,
        sellerMetrics: true,
      },
    });

    return { success: true, data: seller };
  } catch (error) {
    console.error("Error fetching seller metrics:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
export type SubdomainResult =
  | { success: true; subdomain: string }
  | {
      success: false;
      error: SubdomainProblem | "taken" | "unauthorized" | "notFound" | "readOnly" | "rateLimited" | "failed";
    };

const subdomainCheckLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

function subdomainFailure(error: unknown): SubdomainResult {
  if (isAccessError(error)) {
    if (error.code === "unauthorized" || error.code === "no_seller") return { success: false, error: "unauthorized" };
    return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
  }
  console.error("Error updating store subdomain:", error);
  return { success: false, error: "failed" };
}

/**
 * Live check while the seller types a new address for one of their stores
 * (P4-14: any store, not only the primary). Ownership is re-checked here.
 */
export async function checkStoreSubdomain(storeId: string, input: string): Promise<SubdomainResult> {
  try {
    const { seller, store } = await requireStore(String(storeId));
    if (!subdomainCheckLimiter.check(`subdomain-check:${seller.sellerId}`)) {
      return { success: false, error: "rateLimited" };
    }
    const check = await checkStoreSubdomainStatus(seller.sellerId, String(input ?? "").slice(0, 64), {
      storeId: store.id,
    });
    if (check.status !== "available") return { success: false, error: check.status };
    return { success: true, subdomain: check.subdomain };
  } catch (error) {
    return subdomainFailure(error);
  }
}

/**
 * Moves one store to {subdomain}.tallaby.com. The old address keeps
 * redirecting to the new one, so links already shared still work. The single
 * update path is @workspace/lib's updateStoreSubdomain; for the primary store
 * the 0050 trigger keeps sellers.subdomain in sync.
 */
export async function updateStoreSubdomain(storeId: string, input: string): Promise<SubdomainResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    const result = await updateStoreSubdomainForStore(seller.sellerId, store.id, String(input ?? "").slice(0, 64));
    if (!result.success) {
      if (result.error === "not_found") return { success: false, error: "notFound" };
      if (result.error === "store_read_only") return { success: false, error: "readOnly" };
      if (result.error === "invalid_input" || result.error === "available") return { success: false, error: "invalid" };
      return { success: false, error: result.error };
    }

    const { subdomain, previous } = result.data;
    if (previous !== subdomain) {
      // This store's profile under both names, and its custom domain lookup.
      const [domain] = await db
        .select({ domain: sellerCustomDomains.domain })
        .from(sellerCustomDomains)
        .where(and(eq(sellerCustomDomains.storeId, store.id), eq(sellerCustomDomains.sellerId, seller.sellerId)))
        .limit(1);
      await applyInvalidation(
        mergeInvalidations(
          invalidateStorefront([previous, subdomain]),
          ...(domain ? [invalidateCustomDomain(subdomain, domain.domain)] : []),
        ),
        { from: "dashboard", mode: "action" },
      );
    }
    revalidatePath("/settings");
    revalidatePath(`/stores/${store.id}`, "layout");
    // The sidebar store switcher shows store addresses.
    revalidatePath("/", "layout");
    return { success: true, subdomain };
  } catch (error) {
    return subdomainFailure(error);
  }
}
