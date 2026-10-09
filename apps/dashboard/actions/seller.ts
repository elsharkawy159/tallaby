"use server";

import { db } from "@workspace/db";
import { sellers, sellerDocuments, sellerSubdomainRedirects } from "@workspace/db";
import { eq, desc, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import {
  normalizeSubdomain,
  validateSubdomain,
  type SubdomainProblem,
} from "@workspace/lib/storefront";
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
  | { success: false; error: SubdomainProblem | "taken" | "unauthorized" | "failed" };

class SubdomainTakenError extends Error {}

/** True when another seller uses `subdomain` now, or used it before. */
async function isSubdomainTaken(
  tx: Pick<typeof db, "select">,
  subdomain: string,
  sellerId: string,
) {
  const [owner] = await tx
    .select({ id: sellers.id })
    .from(sellers)
    .where(and(eq(sellers.subdomain, subdomain), ne(sellers.id, sellerId)))
    .limit(1);
  if (owner) return true;
  const [reserved] = await tx
    .select({ id: sellerSubdomainRedirects.sellerId })
    .from(sellerSubdomainRedirects)
    .where(
      and(
        eq(sellerSubdomainRedirects.subdomain, subdomain),
        ne(sellerSubdomainRedirects.sellerId, sellerId),
      ),
    )
    .limit(1);
  return Boolean(reserved);
}

/** Live check while the seller types a new store address. */
export async function checkStoreSubdomain(input: string): Promise<SubdomainResult> {
  const session = await getUser();
  if (!session?.user?.id) return { success: false, error: "unauthorized" };

  const subdomain = normalizeSubdomain(input);
  const problem = validateSubdomain(subdomain);
  if (problem) return { success: false, error: problem };
  if (await isSubdomainTaken(db, subdomain, session.user.id)) {
    return { success: false, error: "taken" };
  }
  return { success: true, subdomain };
}

/**
 * Moves the seller's storefront to {subdomain}.tallaby.com. The old address
 * keeps redirecting to the new one, so links already shared still work.
 */
export async function updateStoreSubdomain(input: string): Promise<SubdomainResult> {
  const session = await getUser();
  const sellerId = session?.user?.id;
  if (!sellerId) return { success: false, error: "unauthorized" };

  const subdomain = normalizeSubdomain(input);
  const problem = validateSubdomain(subdomain);
  if (problem) return { success: false, error: problem };

  const current = await db.query.sellers.findFirst({
    where: eq(sellers.id, sellerId),
    columns: { subdomain: true },
  });
  if (!current) return { success: false, error: "unauthorized" };
  if (current.subdomain === subdomain) return { success: true, subdomain };

  try {
    await db.transaction(async (tx) => {
      if (await isSubdomainTaken(tx, subdomain, sellerId)) {
        throw new SubdomainTakenError();
      }
      const now = new Date().toISOString();
      // Taking back one of their own old addresses: it stops redirecting.
      await tx
        .delete(sellerSubdomainRedirects)
        .where(
          and(
            eq(sellerSubdomainRedirects.subdomain, subdomain),
            eq(sellerSubdomainRedirects.sellerId, sellerId),
          ),
        );
      await tx
        .insert(sellerSubdomainRedirects)
        .values({ subdomain: current.subdomain, sellerId })
        .onConflictDoNothing();
      await tx
        .update(sellers)
        .set({ subdomain, subdomainUpdatedAt: now, updatedAt: now })
        .where(eq(sellers.id, sellerId));
    });
  } catch (error) {
    // 23505: another seller claimed it between the check and the update.
    const code = (error as { code?: string; cause?: { code?: string } })?.cause?.code
      ?? (error as { code?: string })?.code;
    if (error instanceof SubdomainTakenError || code === "23505") {
      return { success: false, error: "taken" };
    }
    console.error("Error updating store subdomain:", error);
    return { success: false, error: "failed" };
  }

  await applyInvalidation(invalidateStorefront([current.subdomain, subdomain]), {
    from: "dashboard",
    mode: "action",
  });
  revalidatePath("/settings");
  return { success: true, subdomain };
}
