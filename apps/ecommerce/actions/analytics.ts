
"use server";

import { db } from "@workspace/db";
import { searchLogs, products, orders, orderItems } from "@workspace/db";
import { getUser, getSessionId } from "./auth";
import { desc, sql } from "drizzle-orm";
import { eq } from "drizzle-orm";

export async function trackProductView(productId: string, source?: string) {
  try {
    const user = await getUser();
    const sessionId = await getSessionId();

    await db.insert(searchLogs).values({
      userId: user?.user.id,
      sessionId,
      query: '',
      clickedProductId: productId,
      filters: source ? { source } : null,
    });

    return { success: true };
  } catch (error) {
    console.error("Error tracking product view:", error);
    // Don't return error to user - analytics should fail silently
    return { success: true };
  }
}

export async function trackSearch(query: string, filters?: any, resultCount?: number) {
  try {
    const user = await getUser();
    const sessionId = await getSessionId();

    await db.insert(searchLogs).values({
      userId: user?.user.id,
      sessionId,
      query,
      filters,
      resultCount,
    });

    return { success: true };
  } catch (error) {
    console.error("Error tracking search:", error);
    return { success: true };
  }
}

export async function trackAddToCart(data: {
  productId: string;
  quantity: number;
  variantId?: string;
  price: number;
  source?: string;
}) {
  try {
    // This would typically send to analytics service
    // For now, we'll just log it
    console.log("Add to cart tracked:", data);
    return { success: true };
  } catch (error) {
    console.error("Error tracking add to cart:", error);
    return { success: true };
  }
}

export async function trackPurchase(data: {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}) {
  try {
    // Track purchase event
    console.log("Purchase tracked:", data);
    return { success: true };
  } catch (error) {
    console.error("Error tracking purchase:", error);
    return { success: true };
  }
}

export async function trackEvent(eventName: string, data?: any) {
  try {
    const user = await getUser();
    const sessionId = await getSessionId();

    // This would typically send to analytics service
    console.log("Event tracked:", {
      eventName,
      userId: user?.user.id,
      sessionId,
      data,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error tracking event:", error);
    return { success: true };
  }
}

export async function getUserAnalytics() {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Get user's shopping statistics
    const stats = await db
      .select({
        totalOrders: sql<number>`count(distinct ${orders.id})`,
        totalSpent: sql<number>`sum(${orders.totalAmount})`,
        totalProducts: sql<number>`count(distinct ${orderItems.productId})`,
        avgOrderValue: sql<number>`avg(${orders.totalAmount})`,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(eq(orders.userId, user.user.id));

    // Get favorite categories
    const favoriteCategories = await db
      .select({
        categoryId: products.categoryId,
        orderCount: sql<number>`count(*)`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.userId, user.user.id))
      .groupBy(products.categoryId)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    return {
      success: true,
      data: {
        stats: stats[0],
        favoriteCategories,
      }
    };
  } catch (error) {
    console.error("Error getting user analytics:", error);
    return { success: false, error: "Failed to get analytics" };
  }
}