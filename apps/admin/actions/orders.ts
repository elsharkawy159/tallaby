"use server";

import { db } from "@workspace/db";
import { orders, orderItems, users, products, sellers } from "@workspace/db";
import { eq, and, desc, sql, gte, lte, like, or } from "drizzle-orm";
import { getAdminUser } from "./auth";

export async function getAllOrders(params?: {
  status?: string;
  paymentStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    await getAdminUser(); // Verify admin access

    const conditions = [];

    if (params?.status) {
      conditions.push(eq(orders.status, params.status as any));
    }

    if (params?.paymentStatus) {
      conditions.push(eq(orders.paymentStatus, params.paymentStatus as any));
    }

    if (params?.dateFrom) {
      conditions.push(gte(orders.createdAt, params.dateFrom.toISOString()));
    }

    if (params?.dateTo) {
      conditions.push(lte(orders.createdAt, params.dateTo.toISOString()));
    }

    if (params?.search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${params.search}%`),
          like(orders.id, `%${params.search}%`)
        )
      );
    }

    const ordersList = await db.query.orders.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: {
          columns: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          with: {
            product: {
              columns: {
                title: true,
                sku: true,
                images: true,
              },
            },
            seller: {
              columns: {
                businessName: true,
                displayName: true,
              },
            },
          },
        },
        payments: true,
        shipments: true,
      },
      orderBy: [desc(orders.createdAt)],
      limit: params?.limit || 50,
      offset: params?.offset || 0,
    });

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      success: true,
      data: ordersList,
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

export async function getOrderById(orderId: string) {
  try {
    await getAdminUser(); // Verify admin access

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        user: true,
        userAddress_shippingAddressId: true,
        userAddress_billingAddressId: true,
        orderItems: {
          with: {
            product: true,
            productVariant: true,
            seller: true,
            reviews: true,
            shipmentItems: {
              with: {
                shipment: true,
              },
            },
          },
        },
        payments: true,
        shipments: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return { success: true, data: order };
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status:
    | "pending"
    | "confirmed"
    | "shipping_soon"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
) {
  try {
    await getAdminUser(); // Verify admin access

    const updatedOrder = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date().toISOString(),
        ...(status === "cancelled"
          ? { cancelledAt: new Date().toISOString() }
          : {}),
        ...(status === "delivered"
          ? { deliveredAt: new Date().toISOString() }
          : {}),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder.length) {
      throw new Error("Order not found");
    }

    return { success: true, data: updatedOrder[0] };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus:
    | "pending"
    | "paid"
    | "failed"
    | "refunded"
    | "partially_refunded"
) {
  try {
    await getAdminUser(); // Verify admin access

    const updatedOrder = await db
      .update(orders)
      .set({
        paymentStatus,
        updatedAt: new Date().toISOString(),
        ...(paymentStatus === "paid"
          ? { paidAt: new Date().toISOString() }
          : {}),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder.length) {
      throw new Error("Order not found");
    }

    return { success: true, data: updatedOrder[0] };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getOrderStats() {
  try {
    await getAdminUser(); // Verify admin access

    const stats = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
        totalRevenue: sql<number>`sum(${orders.totalAmount})`,
      })
      .from(orders)
      .groupBy(orders.status);

    const todayStats = await db
      .select({
        revenue: sql<number>`sum(${orders.totalAmount})`,
        orders: sql<number>`count(*)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, new Date().toDateString()));

    const monthlyStats = await db
      .select({
        revenue: sql<number>`sum(${orders.totalAmount})`,
        orders: sql<number>`count(*)`,
      })
      .from(orders)
      .where(
        gte(
          orders.createdAt,
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()
        )
      );

    return {
      success: true,
      data: {
        byStatus: stats,
        today: todayStats[0],
        monthly: monthlyStats[0],
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

export async function deleteOrders(orderIds: string[]) {
  try {
    await getAdminUser(); // Verify admin access

    const deletedOrders = await db
      .delete(orders)
      .where(sql`${orders.id} = ANY(${orderIds})`)
      .returning();

    return { success: true, data: deletedOrders };
  } catch (error) {
    console.error("Error deleting orders:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function exportOrders(format: "csv" | "excel" = "csv") {
  try {
    await getAdminUser(); // Verify admin access

    const ordersData = await db.query.orders.findMany({
      with: {
        user: {
          columns: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        orderItems: {
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
      orderBy: [desc(orders.createdAt)],
    });

    // Transform data for export
    const exportData = ordersData.map((order) => ({
      "Order Number": order.orderNumber,
      "Customer Name":
        `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim(),
      "Customer Email": order.user?.email || "",
      "Total Amount": order.totalAmount,
      Status: order.status,
      "Payment Status": order.paymentStatus,
      "Items Count": order.orderItems.length,
      "Created At": new Date(order.createdAt || new Date()).toLocaleString(),
    }));

    return { success: true, data: exportData };
  } catch (error) {
    console.error("Error exporting orders:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
