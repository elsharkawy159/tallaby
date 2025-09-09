"use server";

import { db, orders, products, sellerPayouts, sellerPayoutItems, orderItems, sellers } from "@workspace/db";
import { eq, and, desc, sql, gte, between } from "drizzle-orm";
import { getUser } from "./auth";

export async function getSellerPayouts(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const conditions = [eq(sellerPayouts.sellerId, session.user.id)];
    
    if (params?.status) {
      conditions.push(eq(sellerPayouts.status, params.status));
    }

    const payoutsList = await db.query.sellerPayouts.findMany({
      where: and(...conditions),
      with: {
        sellerPayoutItems: {
          with: {
            order: {
              columns: {
                orderNumber: true,
              },
            },
            orderItem: {
              columns: {
                productName: true,
                quantity: true,
              },
            },
          },
        },
      },
      orderBy: [desc(sellerPayouts.createdAt)],
      limit: params?.limit || 20,
      offset: params?.offset || 0,
    });

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(sellerPayouts)
      .where(and(...conditions));

    return { 
      success: true, 
      data: payoutsList,
      totalCount: Number(totalCount[0].count)
    };
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getPayoutDetails(payoutId: string) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const payout = await db.query.sellerPayouts.findFirst({
      where: and(
        eq(sellerPayouts.id, payoutId),
        eq(sellerPayouts.sellerId, session.user.id)
      ),
      with: {
        sellerPayoutItems: {
          with: {
            order: true,
            orderItem: {
              with: {
                product: {
                  columns: {
                    title: true,
                    sku: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payout) {
      throw new Error("Payout not found");
    }

    return { success: true, data: payout };
  } catch (error) {
    console.error("Error fetching payout details:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getPendingEarnings() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get delivered orders not yet paid out
    const pendingEarnings = await db
      .select({
        totalAmount: sql<number>`sum(${orderItems.sellerEarning})`,
        count: sql<number>`count(*)`,
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.sellerId, session.user.id),
          eq(orderItems.status, 'delivered'),
          eq(orderItems.isRefunded, false),
          sql`${orderItems.id} NOT IN (
            SELECT order_item_id FROM ${sellerPayoutItems}
          )`
        )
      );

    return { 
      success: true, 
      data: {
        pendingAmount: pendingEarnings[0]?.totalAmount || 0,
        orderCount: pendingEarnings[0]?.count || 0,
      }
    };
  } catch (error) {
    console.error("Error fetching pending earnings:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getWalletBalance() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, session.user.id),
      columns: {
        walletBalance: true,
        payoutSchedule: true,
        lastPayoutDate: true,
        lastPayoutAmount: true,
      },
    });

    return { success: true, data: seller };
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getPayoutStats(year?: number) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1).toISOString();
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59).toISOString();

    const monthlyPayouts = await db
      .select({
        month: sql<string>`TO_CHAR(${sellerPayouts.processedAt}, 'YYYY-MM')`,
        totalAmount: sql<number>`sum(${sellerPayouts.netAmount})`,
        count: sql<number>`count(*)`,
      })
      .from(sellerPayouts)
      .where(
        and(
          eq(sellerPayouts.sellerId, session.user.id),
          eq(sellerPayouts.status, 'completed'),
          between(sellerPayouts.processedAt, startDate, endDate)
        )
      )
      .groupBy(sql`TO_CHAR(${sellerPayouts.processedAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${sellerPayouts.processedAt}, 'YYYY-MM')`);

    const totalStats = await db
      .select({
        totalPaid: sql<number>`sum(${sellerPayouts.netAmount})`,
        totalFees: sql<number>`sum(${sellerPayouts.fee})`,
        totalTax: sql<number>`sum(${sellerPayouts.taxWithheld})`,
        payoutCount: sql<number>`count(*)`,
      })
      .from(sellerPayouts)
      .where(
        and(
          eq(sellerPayouts.sellerId, session.user.id),
          eq(sellerPayouts.status, 'completed')
        )
      );

    return { 
      success: true, 
      data: {
        monthly: monthlyPayouts,
        total: totalStats[0],
      }
    };
  } catch (error) {
    console.error("Error fetching payout stats:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// dashboard/actions/analytics.ts
export async function getDashboardAnalytics() {
  try {
     const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const today = new Date().toDateString();
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);

    // Sales Analytics
    const salesStats = await db
      .select({
        todaySales: sql<number>`sum(case when DATE(${orderItems.createdAt}) = CURRENT_DATE then ${orderItems.sellerEarning} else 0 end)`,
        thisMonthSales: sql<number>`sum(case when ${orderItems.createdAt} >= ${thisMonth.toISOString()} then ${orderItems.sellerEarning} else 0 end)`,
        lastMonthSales: sql<number>`sum(case when ${orderItems.createdAt} >= ${lastMonth.toISOString()} and ${orderItems.createdAt} < ${thisMonth.toISOString()} then ${orderItems.sellerEarning} else 0 end)`,
        todayOrders: sql<number>`count(case when DATE(${orderItems.createdAt}) = CURRENT_DATE then 1 end)`,
        thisMonthOrders: sql<number>`count(case when ${orderItems.createdAt} >= ${thisMonth.toISOString()} then 1 end)`,
      })
      .from(orderItems)
      .where(eq(orderItems.sellerId, session.user.id));

    // Product Performance
    const topProducts = await db
      .select({
        productId: orderItems.productId,
        productName: orderItems.productName,
        totalSold: sql<number>`sum(${orderItems.quantity})`,
        totalRevenue: sql<number>`sum(${orderItems.sellerEarning})`,
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.sellerId, session.user.id),
          gte(orderItems.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        )
      )
      .groupBy(orderItems.productId, orderItems.productName)
      .orderBy(sql`sum(${orderItems.quantity}) DESC`)
      .limit(10);

    // Customer Analytics
    const repeatCustomers = await db
      .select({
        customerId: orders.userId,
        orderCount: sql<number>`count(distinct ${orders.id})`,
        totalSpent: sql<number>`sum(${orderItems.sellerEarning})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orderItems.sellerId, session.user.id))
      .groupBy(orders.userId)
      .having(sql`count(distinct ${orders.id}) > 1`)
      .orderBy(sql`sum(${orderItems.sellerEarning}) DESC`)
      .limit(10);

    // Conversion Rate
    const conversionStats = await db.query.products.findMany({
      where: eq(products.sellerId, session.user.id),
      columns: {
        id: true,
        title: true,
        reviewCount: true,
        averageRating: true,
      },
      orderBy: [desc(products.reviewCount)],
      limit: 10,
    });

    // Daily Sales Trend (Last 30 days)
    const dailyTrend = await db
      .select({
        date: sql<string>`DATE(${orderItems.createdAt})`,
        sales: sql<number>`sum(${orderItems.sellerEarning})`,
        orders: sql<number>`count(*)`,
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.sellerId, session.user.id),
          gte(orderItems.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        )
      )
      .groupBy(sql`DATE(${orderItems.createdAt})`)
      .orderBy(sql`DATE(${orderItems.createdAt})`);

    return { 
      success: true, 
      data: {
        sales: salesStats[0],
        topProducts,
        repeatCustomers,
        conversionStats,
        dailyTrend,
      }
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    let dateFormat: string;
    let daysBack: number;

    switch (period) {
      case 'daily':
        dateFormat = 'YYYY-MM-DD';
        daysBack = 30;
        break;
      case 'weekly':
        dateFormat = 'YYYY-WW';
        daysBack = 90;
        break;
      case 'monthly':
        dateFormat = 'YYYY-MM';
        daysBack = 365;
        break;
      case 'yearly':
        dateFormat = 'YYYY';
        daysBack = 1825; // 5 years
        break;
    }

    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    const revenueData = await db
      .select({
        period: sql<string>`TO_CHAR(${orderItems.createdAt}, ${dateFormat})`,
        revenue: sql<number>`sum(${orderItems.sellerEarning})`,
        orders: sql<number>`count(*)`,
        avgOrderValue: sql<number>`avg(${orderItems.sellerEarning})`,
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.sellerId, session.user.id),
          gte(orderItems.createdAt, startDate),
          eq(orderItems.isRefunded, false)
        )
      )
      .groupBy(sql`TO_CHAR(${orderItems.createdAt}, ${dateFormat})`)
      .orderBy(sql`TO_CHAR(${orderItems.createdAt}, ${dateFormat})`);

    return { success: true, data: revenueData };
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}