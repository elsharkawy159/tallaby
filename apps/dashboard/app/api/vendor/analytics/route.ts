import { NextRequest, NextResponse } from "next/server";
import { db } from "@workspace/db";
import {
  orders,
  orderItems,
  products,
  productListings,
  productViews,
  reviews,
  coupons,
  couponUsage,
  sellers,
  categories,
  brands,
} from "@workspace/db/src/drizzle/schema";
import { analyticsFilterSchema } from "@/lib/validations/vendor-schemas";
import {
  eq,
  and,
  desc,
  asc,
  like,
  gte,
  lte,
  inArray,
  sql,
  or,
  not,
  isNull,
  count,
  sum,
  avg,
  max,
  min,
  date,
  extract,
} from "drizzle-orm";

// GET /api/vendor/analytics - Get vendor analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate search parameters
    const searchData = {
      sellerId: searchParams.get("sellerId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      categoryId: searchParams.get("categoryId"),
      productId: searchParams.get("productId"),
      status: searchParams.get("status") || "all",
      groupBy: searchParams.get("groupBy") || "day",
    };

    // Validate seller ID
    if (!searchData.sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Validate search parameters
    try {
      analyticsFilterSchema.parse(searchData);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: error },
        { status: 400 }
      );
    }

    // Build base conditions
    const baseConditions = [eq(orderItems.sellerId, searchData.sellerId)];

    // Date range filter
    if (searchData.startDate) {
      baseConditions.push(gte(orders.createdAt, searchData.startDate));
    }
    if (searchData.endDate) {
      baseConditions.push(lte(orders.createdAt, searchData.endDate));
    }

    // Category filter
    if (searchData.categoryId) {
      baseConditions.push(eq(products.mainCategoryId, searchData.categoryId));
    }

    // Product filter
    if (searchData.productId) {
      baseConditions.push(eq(orderItems.productId, searchData.productId));
    }

    // Status filter
    if (searchData.status && searchData.status !== "all") {
      baseConditions.push(eq(orderItems.status, searchData.status));
    }

    // Get sales analytics
    const salesAnalytics = await getSalesAnalytics(
      baseConditions,
      searchData.groupBy
    );

    // Get product analytics
    const productAnalytics = await getProductAnalytics(baseConditions);

    // Get customer analytics
    const customerAnalytics = await getCustomerAnalytics(baseConditions);

    // Get inventory analytics
    const inventoryAnalytics = await getInventoryAnalytics(searchData.sellerId);

    // Get review analytics
    const reviewAnalytics = await getReviewAnalytics(
      searchData.sellerId,
      searchData.startDate,
      searchData.endDate
    );

    // Get coupon analytics
    const couponAnalytics = await getCouponAnalytics(
      searchData.sellerId,
      searchData.startDate,
      searchData.endDate
    );

    return NextResponse.json({
      sales: salesAnalytics,
      products: productAnalytics,
      customers: customerAnalytics,
      inventory: inventoryAnalytics,
      reviews: reviewAnalytics,
      coupons: couponAnalytics,
      summary: {
        totalRevenue: salesAnalytics.totalRevenue,
        totalOrders: salesAnalytics.totalOrders,
        totalProducts: productAnalytics.totalProducts,
        totalCustomers: customerAnalytics.totalCustomers,
        averageOrderValue: salesAnalytics.averageOrderValue,
        conversionRate: salesAnalytics.conversionRate,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// Helper function to get sales analytics
async function getSalesAnalytics(conditions: any[], groupBy: string) {
  const dateFormat =
    groupBy === "day"
      ? "YYYY-MM-DD"
      : groupBy === "week"
        ? "YYYY-WW"
        : groupBy === "month"
          ? "YYYY-MM"
          : groupBy === "quarter"
            ? "YYYY-Q"
            : "YYYY";

  // Get sales by date
  const salesByDate = await db
    .select({
      date: sql<string>`to_char(${orders.createdAt}, ${dateFormat})`,
      revenue: sum(orderItems.total),
      orders: count(orders.id),
      items: sum(orderItems.quantity),
      averageOrderValue: avg(orderItems.total),
    })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(and(...conditions))
    .groupBy(sql`to_char(${orders.createdAt}, ${dateFormat})`)
    .orderBy(asc(sql`to_char(${orders.createdAt}, ${dateFormat})`));

  // Get total sales metrics
  const totalMetrics = await db
    .select({
      totalRevenue: sum(orderItems.total),
      totalOrders: count(orders.id),
      totalItems: sum(orderItems.quantity),
      averageOrderValue: avg(orderItems.total),
      totalCustomers: count(sql`distinct ${orders.userId}`),
    })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(and(...conditions));

  // Get sales by status
  const salesByStatus = await db
    .select({
      status: orderItems.status,
      revenue: sum(orderItems.total),
      orders: count(orders.id),
      items: sum(orderItems.quantity),
    })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(and(...conditions))
    .groupBy(orderItems.status);

  // Get top selling products
  const topProducts = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      revenue: sum(orderItems.total),
      quantity: sum(orderItems.quantity),
      orders: count(orders.id),
    })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(and(...conditions))
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(desc(sum(orderItems.total)))
    .limit(10);

  return {
    byDate: salesByDate,
    byStatus: salesByStatus,
    topProducts,
    totalRevenue: totalMetrics[0]?.totalRevenue || 0,
    totalOrders: totalMetrics[0]?.totalOrders || 0,
    totalItems: totalMetrics[0]?.totalItems || 0,
    averageOrderValue: totalMetrics[0]?.averageOrderValue || 0,
    totalCustomers: totalMetrics[0]?.totalCustomers || 0,
    conversionRate: 0, // This would need to be calculated with view data
  };
}

// Helper function to get product analytics
async function getProductAnalytics(conditions: any[]) {
  // Get product performance
  const productPerformance = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      revenue: sum(orderItems.total),
      quantity: sum(orderItems.quantity),
      orders: count(orders.id),
      averageRating: avg(reviews.rating),
      reviewCount: count(reviews.id),
    })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(reviews, eq(orderItems.productId, reviews.productId))
    .where(and(...conditions))
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(desc(sum(orderItems.total)))
    .limit(20);

  // Get category performance
  const categoryPerformance = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      revenue: sum(orderItems.total),
      quantity: sum(orderItems.quantity),
      orders: count(orders.id),
      products: count(sql`distinct ${orderItems.productId}`),
    })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(categories, eq(products.mainCategoryId, categories.id))
    .where(and(...conditions))
    .groupBy(categories.id, categories.name)
    .orderBy(desc(sum(orderItems.total)));

  // Get brand performance
  const brandPerformance = await db
    .select({
      brandId: brands.id,
      brandName: brands.name,
      revenue: sum(orderItems.total),
      quantity: sum(orderItems.quantity),
      orders: count(orders.id),
      products: count(sql`distinct ${orderItems.productId}`),
    })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(and(...conditions))
    .groupBy(brands.id, brands.name)
    .orderBy(desc(sum(orderItems.total)));

  return {
    performance: productPerformance,
    byCategory: categoryPerformance,
    byBrand: brandPerformance,
    totalProducts: productPerformance.length,
  };
}

// Helper function to get customer analytics
async function getCustomerAnalytics(conditions: any[]) {
  // Get customer segments
  const customerSegments = await db
    .select({
      customerId: orders.userId,
      customerEmail: sql<string>`${orders.userId}`, // This would need to be joined with users table
      totalSpent: sum(orderItems.total),
      orders: count(orders.id),
      items: sum(orderItems.quantity),
      averageOrderValue: avg(orderItems.total),
      lastOrderDate: max(orders.createdAt),
    })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(and(...conditions))
    .groupBy(orders.userId)
    .orderBy(desc(sum(orderItems.total)))
    .limit(50);

  // Get customer lifetime value
  const customerLTV = await db
    .select({
      averageLTV: avg(sql`customer_total.total_spent`),
      maxLTV: max(sql`customer_total.total_spent`),
      minLTV: min(sql`customer_total.total_spent`),
    })
    .from(
      db
        .select({
          userId: orders.userId,
          totalSpent: sum(orderItems.total),
        })
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(and(...conditions))
        .groupBy(orders.userId)
        .as("customer_total")
    );

  // Get repeat customers
  const repeatCustomers = await db
    .select({
      repeatCustomers: count(sql`distinct ${orders.userId}`),
    })
    .from(
      db
        .select({
          userId: orders.userId,
          orderCount: count(orders.id),
        })
        .from(orders)
        .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
        .where(and(...conditions))
        .groupBy(orders.userId)
        .having(sql`count(${orders.id}) > 1`)
        .as("repeat_customers")
    );

  return {
    segments: customerSegments,
    lifetimeValue: customerLTV[0] || { averageLTV: 0, maxLTV: 0, minLTV: 0 },
    repeatCustomers: repeatCustomers[0]?.repeatCustomers || 0,
    totalCustomers: customerSegments.length,
  };
}

// Helper function to get inventory analytics
async function getInventoryAnalytics(sellerId: string) {
  // Get inventory status
  const inventoryStatus = await db
    .select({
      totalProducts: count(productListings.id),
      activeProducts: count(
        and(
          eq(productListings.isActive, true),
          eq(productListings.sellerId, sellerId)
        )
      ),
      outOfStock: count(
        and(
          eq(productListings.quantity, 0),
          eq(productListings.sellerId, sellerId)
        )
      ),
      lowStock: count(
        and(
          sql`${productListings.quantity} > 0 AND ${productListings.quantity} <= 10`,
          eq(productListings.sellerId, sellerId)
        )
      ),
      totalValue: sum(
        sql`${productListings.price} * ${productListings.quantity}`
      ),
      averagePrice: avg(productListings.price),
    })
    .from(productListings)
    .where(eq(productListings.sellerId, sellerId));

  // Get low stock products
  const lowStockProducts = await db
    .select({
      productId: productListings.productId,
      sku: productListings.sku,
      quantity: productListings.quantity,
      price: productListings.price,
    })
    .from(productListings)
    .where(
      and(
        sql`${productListings.quantity} > 0 AND ${productListings.quantity} <= 10`,
        eq(productListings.sellerId, sellerId)
      )
    )
    .orderBy(asc(productListings.quantity))
    .limit(20);

  // Get out of stock products
  const outOfStockProducts = await db
    .select({
      productId: productListings.productId,
      sku: productListings.sku,
      price: productListings.price,
    })
    .from(productListings)
    .where(
      and(
        eq(productListings.quantity, 0),
        eq(productListings.sellerId, sellerId)
      )
    )
    .limit(20);

  return {
    status: inventoryStatus[0] || {
      totalProducts: 0,
      activeProducts: 0,
      outOfStock: 0,
      lowStock: 0,
      totalValue: 0,
      averagePrice: 0,
    },
    lowStock: lowStockProducts,
    outOfStock: outOfStockProducts,
  };
}

// Helper function to get review analytics
async function getReviewAnalytics(
  sellerId: string,
  startDate?: string,
  endDate?: string
) {
  const conditions = [eq(reviews.sellerId, sellerId)];

  if (startDate) {
    conditions.push(gte(reviews.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(reviews.createdAt, endDate));
  }

  // Get review statistics
  const reviewStats = await db
    .select({
      totalReviews: count(reviews.id),
      averageRating: avg(reviews.rating),
      fiveStar: count(sql`CASE WHEN ${reviews.rating} = 5 THEN 1 END`),
      fourStar: count(sql`CASE WHEN ${reviews.rating} = 4 THEN 1 END`),
      threeStar: count(sql`CASE WHEN ${reviews.rating} = 3 THEN 1 END`),
      twoStar: count(sql`CASE WHEN ${reviews.rating} = 2 THEN 1 END`),
      oneStar: count(sql`CASE WHEN ${reviews.rating} = 1 THEN 1 END`),
      verifiedPurchases: count(
        sql`CASE WHEN ${reviews.isVerifiedPurchase} = true THEN 1 END`
      ),
    })
    .from(reviews)
    .where(and(...conditions));

  // Get recent reviews
  const recentReviews = await db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      rating: reviews.rating,
      title: reviews.title,
      comment: reviews.comment,
      isVerifiedPurchase: reviews.isVerifiedPurchase,
      helpfulCount: reviews.helpfulCount,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(and(...conditions))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  return {
    stats: reviewStats[0] || {
      totalReviews: 0,
      averageRating: 0,
      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
      verifiedPurchases: 0,
    },
    recent: recentReviews,
  };
}

// Helper function to get coupon analytics
async function getCouponAnalytics(
  sellerId: string,
  startDate?: string,
  endDate?: string
) {
  const conditions = [eq(coupons.sellerId, sellerId)];

  if (startDate) {
    conditions.push(gte(coupons.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(coupons.createdAt, endDate));
  }

  // Get coupon statistics
  const couponStats = await db
    .select({
      totalCoupons: count(coupons.id),
      activeCoupons: count(
        and(
          eq(coupons.isActive, true),
          gte(coupons.expiresAt, new Date().toISOString())
        )
      ),
      totalUsage: sum(coupons.usageCount),
      totalDiscount: sum(couponUsage.discountAmount),
    })
    .from(coupons)
    .leftJoin(couponUsage, eq(coupons.id, couponUsage.couponId))
    .where(and(...conditions));

  // Get top performing coupons
  const topCoupons = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      name: coupons.name,
      discountType: coupons.discountType,
      discountValue: coupons.discountValue,
      usageCount: coupons.usageCount,
      totalDiscount: sum(couponUsage.discountAmount),
    })
    .from(coupons)
    .leftJoin(couponUsage, eq(coupons.id, couponUsage.couponId))
    .where(and(...conditions))
    .groupBy(
      coupons.id,
      coupons.code,
      coupons.name,
      coupons.discountType,
      coupons.discountValue,
      coupons.usageCount
    )
    .orderBy(desc(sum(couponUsage.discountAmount)))
    .limit(10);

  return {
    stats: couponStats[0] || {
      totalCoupons: 0,
      activeCoupons: 0,
      totalUsage: 0,
      totalDiscount: 0,
    },
    topPerforming: topCoupons,
  };
}
