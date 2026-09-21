"use server";

import {
  db,
  sellers,
  users,
  orderItems,
  orders,
  products,
} from "@workspace/db";

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
  countDistinct,
  max,
  ne,
  sql,
  sum,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { applyInvalidation, invalidateSeller } from "@workspace/cache";
import {
  sellerActionSchema,
  sellerFiltersSchema,
  sellerUpdateSchema,
} from "./sellers.dto";
import type {
  Seller,
  SellerDetail,
  SellerStats,
  SellerFilters,
} from "./sellers.types";

export async function getSellers(filters: SellerFilters = {}) {
  try {
    await getCurrentAdminUser();

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
        isCommissionExempt: sellers.isCommissionExempt,
        freeDelivery: sellers.freeDelivery,
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

    // sellers.productCount is a denormalized counter that drifts; count the
    // real products instead.
    const productCounts = await db
      .select({ sellerId: products.sellerId, total: count() })
      .from(products)
      .groupBy(products.sellerId);
    const productCountBySeller = new Map(
      productCounts.map((row) => [row.sellerId, row.total])
    );

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
      productCount: productCountBySeller.get(seller.id) ?? 0,
      commissionRate: seller.commissionRate ?? 15,
      isCommissionExempt: seller.isCommissionExempt ?? false,
      freeDelivery: seller.freeDelivery ?? false,
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
    await getCurrentAdminUser();

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



    const totalProductsResult = await db
      .select({ count: count() })
      .from(products);

    const totalProducts = totalProductsResult[0]?.count || 0;

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
    await getCurrentAdminUser();

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
    await applyInvalidation(invalidateSeller(validatedData.sellerId), {
      from: "admin",
      mode: "action",
    });
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
    await getCurrentAdminUser();

    const validatedData = sellerUpdateSchema.parse(data);

    await db
      .update(sellers)
      .set({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sellers.id, sellerId));

    revalidatePath("/sellers");
    await applyInvalidation(invalidateSeller(sellerId), {
      from: "admin",
      mode: "action",
    });
    return { success: true, message: "Seller updated successfully" };
  } catch (error) {
    console.error("Error updating seller:", error);
    return { success: false, error: "Failed to update seller" };
  }
}

export async function getSellerById(sellerId: string) {
  try {
    await getCurrentAdminUser();

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

export async function updateSellerCommissionExempt(
  sellerId: string,
  isCommissionExempt: boolean
) {
  try {
    await getCurrentAdminUser();

    const validatedData = sellerUpdateSchema.parse({ isCommissionExempt });

    await db
      .update(sellers)
      .set({
        isCommissionExempt: validatedData.isCommissionExempt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sellers.id, sellerId));

    revalidatePath("/sellers");
    await applyInvalidation(invalidateSeller(sellerId), {
      from: "admin",
      mode: "action",
    });
    return {
      success: true,
      message: isCommissionExempt
        ? "Seller is now exempt from platform commission"
        : "Platform commission re-enabled for seller",
    };
  } catch (error) {
    console.error("Error updating seller commission exemption:", error);
    return {
      success: false,
      error: "Failed to update commission exemption",
    };
  }
}

export async function updateSellerFreeDelivery(
  sellerId: string,
  freeDelivery: boolean
) {
  try {
    await getCurrentAdminUser();

    const validatedData = sellerUpdateSchema.parse({ freeDelivery });

    await db
      .update(sellers)
      .set({
        freeDelivery: validatedData.freeDelivery,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sellers.id, sellerId));

    revalidatePath("/sellers");
    await applyInvalidation(invalidateSeller(sellerId), {
      from: "admin",
      mode: "action",
    });
    return {
      success: true,
      message: freeDelivery
        ? "Free delivery enabled for all of this seller's products"
        : "Free delivery disabled for this seller",
    };
  } catch (error) {
    console.error("Error updating seller free delivery:", error);
    return {
      success: false,
      error: "Failed to update free delivery",
    };
  }
}

export async function deleteSeller(sellerId: string) {
  try {
    await getCurrentAdminUser();

    await db.delete(sellers).where(eq(sellers.id, sellerId));

    revalidatePath("/sellers");
    await applyInvalidation(invalidateSeller(sellerId), {
      from: "admin",
      mode: "action",
    });
    return { success: true, message: "Seller deleted successfully" };
  } catch (error) {
    console.error("Error deleting seller:", error);
    return { success: false, error: "Failed to delete seller" };
  }
}

export async function getSellerDetail(
  sellerId: string
): Promise<{ success: boolean; data?: SellerDetail; error?: string }> {
  try {
    await getCurrentAdminUser();

    if (!/^[0-9a-f-]{36}$/i.test(sellerId)) {
      return { success: false, error: "Seller not found" };
    }

    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .limit(1);

    if (!seller) {
      return { success: false, error: "Seller not found" };
    }

    // Cancelled items never became revenue.
    const liveItems = and(
      eq(orderItems.sellerId, sellerId),
      ne(orderItems.status, "cancelled")
    );

    const [
      ownerRows,
      productStatusRows,
      salesRows,
      customerRows,
      topProductRows,
      recentOrderRows,
    ] = await Promise.all([
      // The seller row shares its id with the owning user account.
      db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          isSuspended: users.isSuspended,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, sellerId))
        .limit(1),

      db
        .select({ status: products.status, total: count() })
        .from(products)
        .where(eq(products.sellerId, sellerId))
        .groupBy(products.status),

      db
        .select({
          orders: countDistinct(orderItems.orderId),
          customers: countDistinct(orders.userId),
          itemsSold: sum(orderItems.quantity),
          grossSales: sum(orderItems.total),
          commission: sum(orderItems.commissionAmount),
          earnings: sum(orderItems.sellerEarning),
          refundedItems: sql<number>`count(*) filter (where ${orderItems.isRefunded} or ${orderItems.isReturned})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(liveItems),

      db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          orders: countDistinct(orderItems.orderId),
          totalSpent: sum(orderItems.total),
          lastOrderAt: max(orders.createdAt),
        })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .innerJoin(users, eq(users.id, orders.userId))
        .where(liveItems)
        .groupBy(users.id, users.fullName, users.email)
        .orderBy(desc(sum(orderItems.total)))
        .limit(5),

      db
        .select({
          productId: orderItems.productId,
          name: max(orderItems.productName),
          unitsSold: sum(orderItems.quantity),
          revenue: sum(orderItems.total),
        })
        .from(orderItems)
        .where(liveItems)
        .groupBy(orderItems.productId)
        .orderBy(desc(sum(orderItems.total)))
        .limit(5),

      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: users.fullName,
          status: orders.status,
          total: sum(orderItems.total),
          createdAt: orders.createdAt,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .leftJoin(users, eq(users.id, orders.userId))
        .where(eq(orderItems.sellerId, sellerId))
        .groupBy(
          orders.id,
          orders.orderNumber,
          users.fullName,
          orders.status,
          orders.createdAt
        )
        .orderBy(desc(orders.createdAt))
        .limit(5),
    ]);

    const productCounts = {
      total: 0,
      active: 0,
      pending: 0,
      draft: 0,
      rejected: 0,
    };
    for (const row of productStatusRows) {
      productCounts[row.status] = row.total;
      productCounts.total += row.total;
    }

    const s = salesRows[0];
    const orderCount = Number(s?.orders ?? 0);
    const grossSales = Number(s?.grossSales ?? 0);

    const detail: SellerDetail = {
      seller: {
        ...seller,
        legalAddress: (seller.legalAddress ?? {}) as Record<string, unknown>,
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
        productCount: productCounts.total,
        commissionRate: seller.commissionRate ?? 15,
        isCommissionExempt: seller.isCommissionExempt ?? false,
        freeDelivery: seller.freeDelivery ?? false,
        payoutSchedule: seller.payoutSchedule ?? "biweekly",
        sellerLevel: seller.sellerLevel ?? "standard",
        walletBalance: seller.walletBalance ?? "0",
        joinDate: seller.joinDate ?? seller.createdAt ?? "",
        createdAt: seller.createdAt ?? "",
        updatedAt: seller.updatedAt ?? "",
      } as Seller,
      owner: ownerRows[0] ?? null,
      products: productCounts,
      sales: {
        orders: orderCount,
        customers: Number(s?.customers ?? 0),
        itemsSold: Number(s?.itemsSold ?? 0),
        grossSales,
        commission: Number(s?.commission ?? 0),
        earnings: Number(s?.earnings ?? 0),
        refundedItems: Number(s?.refundedItems ?? 0),
        averageOrderValue: orderCount > 0 ? grossSales / orderCount : 0,
      },
      topCustomers: customerRows.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        email: r.email,
        orders: Number(r.orders),
        totalSpent: Number(r.totalSpent ?? 0),
        lastOrderAt: r.lastOrderAt,
      })),
      topProducts: topProductRows.map((r) => ({
        productId: r.productId,
        name: r.name ?? "Unnamed product",
        unitsSold: Number(r.unitsSold ?? 0),
        revenue: Number(r.revenue ?? 0),
      })),
      recentOrders: recentOrderRows.map((r) => ({
        id: r.id,
        orderNumber: r.orderNumber,
        customerName: r.customerName,
        status: r.status,
        total: Number(r.total ?? 0),
        createdAt: r.createdAt,
      })),
    };

    return { success: true, data: detail };
  } catch (error) {
    console.error("Error fetching seller detail:", error);
    return { success: false, error: "Failed to fetch seller" };
  }
}
