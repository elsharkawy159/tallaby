// apps/ecommerce/actions/seller.ts
"use server";

import { unstable_cache } from "next/cache";
import {
  db,
  sellers,
  sellerDocuments,
  products,
  eq,
  desc,
  asc,
  sql,
} from "@workspace/db";
import { categoryTags, productTags } from "@workspace/cache";
import { normalizeGovernorate } from "@workspace/lib/shipping";
import { getUser } from "./auth";

// CACHED: Public storefront listing - only approved sellers are shown
export async function getAllSellers(params?: {
  limit?: number;
  offset?: number;
}) {
  const cacheKey = `all-sellers-${params?.limit ?? 200}-${params?.offset ?? 0}`;

  return unstable_cache(
    async () => {
      try {
        const sellerList = await db.query.sellers.findMany({
          where: eq(sellers.status, "approved"),
          columns: {
            id: true,
            displayName: true,
            slug: true,
            description: true,
            logoUrl: true,
            storeRating: true,
            positiveRatingPercent: true,
            totalRatings: true,
            productCount: true,
            isVerified: true,
          },
          orderBy: [asc(sellers.displayName)],
          limit: params?.limit ?? 200,
          offset: params?.offset ?? 0,
        });

        return { success: true, data: sellerList };
      } catch (error) {
        console.error("Error fetching sellers:", error);
        return { success: false, error: "Failed to fetch sellers" };
      }
    },
    [cacheKey],
    {
      tags: ["sellers"],
      revalidate: 3600,
    }
  )();
}

export type SellerStoreCategory = {
  /** Root slug (or id when slugless); duplicate roots sharing a slug merge. */
  key: string;
  name: string | null;
  nameAr: string | null;
  productCount: number;
  /** The seller's product categories under this root, for filtering. */
  categoryIds: string[];
};

// NOT CACHED: Mutation - uploads document
export async function uploadSellerDocument(data: {
  documentType:
    | "business_license"
    | "tax_certificate"
    | "id_proof"
    | "address_proof"
    | "other";
  fileUrl: string;
  expiryDate?: string;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Check if user is a seller
    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, user.user.id),
    });

    if (!seller) {
      return { success: false, error: "Seller profile not found" };
    }

    const [newDocument] = await db
      .insert(sellerDocuments)
      .values({
        sellerId: user.user.id,
        documentType: data.documentType,
        fileUrl: data.fileUrl,
        expiryDate: data.expiryDate,
        status: "pending",
      })
      .returning();

    return { success: true, data: newDocument };
  } catch (error) {
    console.error("Error uploading document:", error);
    return { success: false, error: "Failed to upload document" };
  }
}

export async function getSellerProfile(sellerId: string) {
  // CACHED: Semi-dynamic public data - seller profiles change infrequently
  return unstable_cache(
    async () => {
      try {
        const seller = await db.query.sellers.findFirst({
          where: eq(sellers.id, sellerId),
          columns: {
            id: true,
            displayName: true,
            slug: true,
            description: true,
            logoUrl: true,
            bannerUrl: true,
            returnPolicy: true,
            shippingPolicy: true,
            storeRating: true,
            positiveRatingPercent: true,
            totalRatings: true,
            productCount: true,
            isVerified: true,
            joinDate: true,
          },
          with: {
            products: {
              where: eq(products.status, "active"),
              limit: 12,
              orderBy: [desc(products.averageRating)],
            },
          },
        });

        if (!seller) {
          return { success: false, error: "Seller not found" };
        }

        return { success: true, data: seller };
      } catch (error) {
        console.error("Error fetching seller profile:", error);
        return { success: false, error: "Failed to fetch seller profile" };
      }
    },
    [`seller-profile-${sellerId}`],
    {
      tags: ["sellers", `seller-${sellerId}`],
      revalidate: 3600, // 1 hour - seller profiles change infrequently
    }
  )();
}

export async function getSellerBySlug(slug: string) {
  // CACHED: Semi-dynamic public data - seller profiles change infrequently
  return unstable_cache(
    async () => {
      try {
        const seller = await db.query.sellers.findFirst({
          where: eq(sellers.slug, slug),
          columns: {
            id: true,
            displayName: true,
            slug: true,
            subdomain: true,
            description: true,
            logoUrl: true,
            bannerUrl: true,
            returnPolicy: true,
            shippingPolicy: true,
            storeRating: true,
            positiveRatingPercent: true,
            totalRatings: true,
            productCount: true,
            isVerified: true,
            joinDate: true,
            status: true,
            storeDescription: true,
            freeDelivery: true,
            legalAddress: true,
          },
        });

        if (!seller) {
          return { success: false, error: "Seller not found" };
        }

        // Only the governorate is public; the rest of the legal address is not.
        const { legalAddress, ...profile } = seller;
        const state = (legalAddress as { state?: string } | null)?.state;
        return {
          success: true,
          data: { ...profile, governorate: normalizeGovernorate(state) },
        };
      } catch (error) {
        console.error("Error fetching seller:", error);
        return { success: false, error: "Failed to fetch seller" };
      }
    },
    // v2: entries now include `subdomain`.
    [`seller-slug-v2-${slug}`],
    {
      tags: ["sellers", `seller-${slug}`],
      revalidate: 3600, // 1 hour - seller profiles change infrequently
    }
  )();
}
