"use server";

import { db, sellers, users, orderItems } from "@workspace/db";

import {
  eq,
  and,
  or,
  like,
  gte,
  lte,
  desc,
  asc,
  count,
  sum,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  sellerActionSchema,
  sellerFiltersSchema,
  sellerUpdateSchema,
} from "./sellers.dto";
import type { Seller, SellerStats, SellerFilters } from "./sellers.types";

export async function getSellers(filters: SellerFilters = {}) {
  try {
    const conditions = [];

    // Status filter
    if (filters.status) {
      conditions.push(eq(sellers.status, filters.status));
    }

    // Business type filter
    if (filters.businessType) {
      conditions.push(eq(sellers.businessType, filters.businessType));
    }

    // Verification filter
    if (filters.isVerified !== undefined) {
      conditions.push(eq(sellers.isVerified, filters.isVerified));
    }

    // Search filter
    if (filters.search) {
      conditions.push(
        or(
          like(sellers.businessName, `%${filters.search}%`),
          like(sellers.displayName, `%${filters.search}%`),
          like(sellers.slug, `%${filters.search}%`)
        )
      );
    }

    // Date range filter
    if (filters.dateRange) {
      conditions.push(
        and(
          gte(sellers.joinDate, filters.dateRange.from.toISOString()),
          lte(sellers.joinDate, filters.dateRange.to.toISOString())
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sellersData = await db
      .select({
        id: sellers.id,
        businessName: sellers.businessName,
        displayName: sellers.displayName,
        slug: sellers.slug,
        description: sellers.description,
        logoUrl: sellers.logoUrl,
        bannerUrl: sellers.bannerUrl,
        taxId: sellers.taxId,
        businessType: sellers.businessType,
        registrationNumber: sellers.registrationNumber,
        legalAddress: sellers.legalAddress,
        status: sellers.status,
        verificationDetails: sellers.verificationDetails,
        returnPolicy: sellers.returnPolicy,
        shippingPolicy: sellers.shippingPolicy,
        isVerified: sellers.isVerified,
        approvedCategories: sellers.approvedCategories,
        supportEmail: sellers.supportEmail,
        supportPhone: sellers.supportPhone,
        commissionRate: sellers.commissionRate,
        feeStructure: sellers.feeStructure,
        taxInformation: sellers.taxInformation,
        paymentDetails: sellers.paymentDetails,
        storeRating: sellers.storeRating,
        positiveRatingPercent: sellers.positiveRatingPercent,
        totalRatings: sellers.totalRatings,
        productCount: sellers.productCount,
        fulfillmentOptions: sellers.fulfillmentOptions,
        payoutSchedule: sellers.payoutSchedule,
        lastPayoutDate: sellers.lastPayoutDate,
        lastPayoutAmount: sellers.lastPayoutAmount,
        walletBalance: sellers.walletBalance,
        stripeAccountId: sellers.stripeAccountId,
        externalIds: sellers.externalIds,
        sellerLevel: sellers.sellerLevel,
        joinDate: sellers.joinDate,
        sellerMetrics: sellers.sellerMetrics,
        createdAt: sellers.createdAt,
        updatedAt: sellers.updatedAt,
      })
      .from(sellers)
      .where(whereClause)
      .orderBy(desc(sellers.joinDate));

    // Cast the JSON fields to proper types
    const typedSellersData = sellersData.map((seller) => ({
      ...seller,
      legalAddress: seller.legalAddress as Record<string, unknown>,
      verificationDetails: seller.verificationDetails as Record<string, unknown> | null,
      approvedCategories: seller.approvedCategories as string[] | null,
      feeStructure: seller.feeStructure as Record<string, unknown> | null,
      taxInformation: seller.taxInformation as Record<string, unknown> | null,
      paymentDetails: seller.paymentDetails as Record<string, unknown> | null,
      fulfillmentOptions: seller.fulfillmentOptions as string[] | null,
      externalIds: seller.externalIds as Record<string, unknown> | null,
      sellerMetrics: seller.sellerMetrics as Record<string, unknown> | null,
      isVerified: seller.isVerified ?? false,
      storeRating: seller.storeRating ?? 0,
      positiveRatingPercent: seller.positiveRatingPercent ?? 0,
      totalRatings: seller.totalRatings ?? 0,
      productCount: seller.productCount ?? 0,
      commissionRate: seller.commissionRate ?? 15,
      payoutSchedule: seller.payoutSchedule ?? "biweekly",
      sellerLevel: seller.sellerLevel ?? "standard",
      walletBalance: seller.walletBalance ?? "0",
      joinDate: seller.joinDate ?? new Date().toISOString(),
      createdAt: seller.createdAt ?? new Date().toISOString(),
      updatedAt: seller.updatedAt ?? new Date().toISOString(),
    }));

    return { success: true, data: typedSellersData };
  } catch (error) {
    console.error("Error fetching sellers:", error);
    return { success: false, error: "Failed to fetch sellers" };
  }
}

export async function getSellerStats(): Promise<{
  success: boolean;
  data?: SellerStats;
  error?: string;
}> {
  try {
    // Get total sellers count
    const totalSellersResult = await db
      .select({ count: count() })
      .from(sellers);

    const totalSellers = totalSellersResult[0]?.count || 0;

    // Get active sellers count
    const activeSellersResult = await db
      .select({ count: count() })
      .from(sellers)
      .where(eq(sellers.status, "approved"));

    const activeSellers = activeSellersResult[0]?.count || 0;

    // Get pending sellers count
    const pendingSellersResult = await db
      .select({ count: count() })
      .from(sellers)
      .where(eq(sellers.status, "pending"));

    const pendingSellers = pendingSellersResult[0]?.count || 0;

    // Get suspended sellers count
    const suspendedSellersResult = await db
      .select({ count: count() })
      .from(sellers)
      .where(eq(sellers.status, "suspended"));

    const suspendedSellers = suspendedSellersResult[0]?.count || 0;



    const totalProducts = 0;

    // Get total revenue (sum of all order items)
    const totalRevenueResult = await db
      .select({ total: sum(orderItems.price) })
      .from(orderItems);

    const totalRevenue = Number(totalRevenueResult[0]?.total || 0);

    const stats: SellerStats = {
      totalSellers,
      activeSellers,
      pendingSellers,
      suspendedSellers,
      totalProducts,
      totalRevenue,
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    return { success: false, error: "Failed to fetch seller statistics" };
  }
}

export async function updateSellerStatus(
  sellerId: string,
  status: "pending" | "approved" | "suspended" | "restricted",
  reason?: string
) {
  try {
    const validatedData = sellerActionSchema.parse({
      sellerId,
      action:
        status === "approved"
          ? "approve"
          : status === "suspended"
            ? "suspend"
            : "reactivate",
      reason,
    });

    await db
      .update(sellers)
      .set({
        status:
          validatedData.action === "approve"
            ? "approved"
            : validatedData.action === "suspend"
              ? "suspended"
              : "approved",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sellers.id, validatedData.sellerId));

    revalidatePath("/sellers");
    return {
      success: true,
      message: `Seller ${validatedData.action}d successfully`,
    };
  } catch (error) {
    console.error("Error updating seller status:", error);
    return { success: false, error: "Failed to update seller status" };
  }
}

export async function updateSeller(
  sellerId: string,
  data: Record<string, unknown>
) {
  try {
    const validatedData = sellerUpdateSchema.parse(data);

    await db
      .update(sellers)
      .set({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sellers.id, sellerId));

    revalidatePath("/sellers");
    return { success: true, message: "Seller updated successfully" };
  } catch (error) {
    console.error("Error updating seller:", error);
    return { success: false, error: "Failed to update seller" };
  }
}

export async function getSellerById(sellerId: string) {
  try {
    const seller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .limit(1);

    if (!seller[0]) {
      return { success: false, error: "Seller not found" };
    }

    return { success: true, data: seller[0] };
  } catch (error) {
    console.error("Error fetching seller:", error);
    return { success: false, error: "Failed to fetch seller" };
  }
}

export async function deleteSeller(sellerId: string) {
  try {

    await db.delete(sellers).where(eq(sellers.id, sellerId));

    revalidatePath("/sellers");
    return { success: true, message: "Seller deleted successfully" };
  } catch (error) {
    console.error("Error deleting seller:", error);
    return { success: false, error: "Failed to delete seller" };
  }
}
