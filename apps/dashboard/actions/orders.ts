"use server";

import { db } from "@workspace/db";
import { orders, orderItems, shipments } from "@workspace/db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { getUser } from "./auth";

export async function getSellerOrders(params?: {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const conditions = [eq(orderItems.sellerId, session.user.id)];

    if (params?.status) {
      conditions.push(eq(orderItems.status, params.status as any));
    }

    if (params?.dateFrom) {
      conditions.push(gte(orderItems.createdAt, params.dateFrom.toISOString()));
    }

    if (params?.dateTo) {
      conditions.push(lte(orderItems.createdAt, params.dateTo.toISOString()));
    }

    const sellerOrderItems = await db.query.orderItems.findMany({
      where: and(...conditions),
      with: {
        order: {
          with: {
            user: {
              columns: {
                email: true,
                firstName: true,
                lastName: true,
                fullName: true,
              },
            },
            userAddress_shippingAddressId: true,
          },
        },
        product: {
          columns: {
            title: true,
            slug: true,
            images: true,
          },
        },
        productVariant: true,
      },
      orderBy: [desc(orderItems.createdAt)],
      limit: params?.limit || 50,
      offset: params?.offset || 0,
    });

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(orderItems)
      .where(and(...conditions));

    return {
      success: true,
      data: sellerOrderItems,
      totalCount: Number(totalCount[0].count),
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getOrderDetails(orderId: string) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const orderDetails = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        orderItems: {
          where: eq(orderItems.sellerId, session.user.id),
          with: {
            product: true,
            productVariant: true,
            shipmentItems: {
              with: {
                shipment: true,
              },
            },
            reviews: true,
          },
        },
        user: {
          columns: {
            email: true,
            firstName: true,
            lastName: true,
            fullName: true,
            phone: true,
          },
        },
        userAddress_shippingAddressId: true,
        userAddress_billingAddressId: true,
        payments: true,
        shipments: {
          where: eq(shipments.sellerId, session.user.id),
        },
      },
    });

    if (!orderDetails || orderDetails.orderItems.length === 0) {
      throw new Error("Order not found or unauthorized");
    }

    return { success: true, data: orderDetails };
  } catch (error) {
    console.error("Error fetching order details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateOrderItemStatus(
  orderItemId: string,
  status: "pending" | "payment_processing" | "confirmed" | "shipping_soon" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "refund_requested" | "refunded" | "returned"
) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const updatedItem = await db
      .update(orderItems)
      .set({
        status,
        updatedAt: new Date().toISOString(),
        ...(status === "shipped"
          ? { shippedAt: new Date().toISOString() }
          : {}),
        ...(status === "delivered"
          ? { deliveredAt: new Date().toISOString() }
          : {}),
        ...(status === "cancelled"
          ? { cancelledAt: new Date().toISOString() }
          : {}),
      })
      .where(
        and(
          eq(orderItems.id, orderItemId),
          eq(orderItems.sellerId, session.user.id)
        )
      )
      .returning();

    if (!updatedItem.length) {
      throw new Error("Order item not found or unauthorized");
    }

    return { success: true, data: updatedItem[0] };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getOrderStats() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const stats = await db
      .select({
        status: orderItems.status,
        count: sql<number>`count(*)`,
        totalRevenue: sql<number>`sum(${orderItems.total})`,
        totalEarnings: sql<number>`sum(${orderItems.sellerEarning})`,
      })
      .from(orderItems)
      .where(eq(orderItems.sellerId, session.user.id))
      .groupBy(orderItems.status);

    const todayRevenue = await db
      .select({
        revenue: sql<number>`sum(${orderItems.total})`,
        orders: sql<number>`count(*)`,
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.sellerId, session.user.id),
          gte(orderItems.createdAt, new Date().toDateString())
        )
      );

    return {
      success: true,
      data: {
        byStatus: stats,
        today: todayRevenue[0],
      },
    };
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function processRefund(data: {
  orderItemId: string;
  refundAmount: string;
  refundReason: string;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const updatedItem = await db
      .update(orderItems)
      .set({
        isRefunded: true,
        refundAmount: data.refundAmount,
        refundReason: data.refundReason,
        refundedAt: new Date().toISOString(),
        status: "refunded",
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(orderItems.id, data.orderItemId),
          eq(orderItems.sellerId, session.user.id)
        )
      )
      .returning();

    if (!updatedItem.length) {
      throw new Error("Order item not found or unauthorized");
    }

    return { success: true, data: updatedItem[0] };
  } catch (error) {
    console.error("Error processing refund:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
