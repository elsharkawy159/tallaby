// apps/ecommerce/actions/seller.ts
"use server";

import {
  db,
  sellers,
  sellerDocuments,
  users,
  products,
  eq,
  desc,
} from "@workspace/db";
import { getUser } from "./auth";

export async function registerAsSeller(data: {
  businessName: string;
  displayName: string;
  businessType: string;
  taxId?: string;
  registrationNumber?: string;
  supportEmail: string;
  supportPhone?: string;
  legalAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  description?: string;
  returnPolicy?: string;
  shippingPolicy?: string;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Check if already a seller
    const existingSeller = await db.query.sellers.findFirst({
      where: eq(sellers.id, user.user.id),
    });

    if (existingSeller) {
      return {
        success: false,
        error: "You are already registered as a seller",
      };
    }

    // Generate slug from display name
    const baseSlug = data.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check for unique slug
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await db.query.sellers.findFirst({
        where: eq(sellers.slug, slug),
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create seller profile
    const [newSeller] = await db
      .insert(sellers)
      .values({
        id: user.user.id,
        businessName: data.businessName,
        displayName: data.displayName,
        slug,
        businessType: data.businessType,
        taxId: data.taxId,
        registrationNumber: data.registrationNumber,
        legalAddress: data.legalAddress,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone,
        description: data.description,
        returnPolicy: data.returnPolicy,
        shippingPolicy: data.shippingPolicy,
        status: "pending",
        isVerified: false,
        commissionRate: 0.15, // 15% default commission
        payoutSchedule: "biweekly",
        walletBalance: "0",
        productCount: 0,
        totalRatings: 0,
      })
      .returning();

    // Update user role
    await db
      .update(users)
      .set({
        role: "seller",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.user.id));

    return {
      success: true,
      data: newSeller,
      message:
        "Seller registration submitted. Your account is pending approval.",
    };
  } catch (error) {
    console.error("Error registering seller:", error);
    return { success: false, error: "Failed to register as seller" };
  }
}

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
          where: eq(products.isActive, true),
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
}

export async function getSellerBySlug(slug: string) {
  try {
    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.slug, slug),
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
    });

    if (!seller) {
      return { success: false, error: "Seller not found" };
    }

    return { success: true, data: seller };
  } catch (error) {
    console.error("Error fetching seller:", error);
    return { success: false, error: "Failed to fetch seller" };
  }
}
