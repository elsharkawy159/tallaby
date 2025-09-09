"use server";

import { db } from "@workspace/db";
import { sellers, sellerDocuments } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getUser } from "./auth";


export async function getSellerProfile() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, session.user.id),
      with: {
        user: {
          columns: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
      },
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