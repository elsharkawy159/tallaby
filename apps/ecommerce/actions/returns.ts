"use server";

import {
  returns,
  returnItems,
  orders,
  orderItems,
  eq,
  and,
  desc, 
  db
} from "@workspace/db";
import { getUser } from "./auth";
import { createNotification } from "./notifications";

export async function getUserReturns(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const conditions = [eq(returns.userId, user.user.id)];

    if (params?.status) {
      conditions.push(eq(returns.status, params.status));
    }

    const userReturns = await db.query.returns.findMany({
      where: and(...conditions),
      with: {
        order: {
          columns: {
            orderNumber: true,
          },
        },
        returnItems: {
          with: {
            orderItem: {
              columns: {
                productName: true,
                price: true,
                quantity: true,
              },
            },
          },
        },
        refunds: true,
      },
      orderBy: [desc(returns.createdAt)],
      limit: params?.limit || 20,
      offset: params?.offset || 0,
    });

    return { success: true, data: userReturns };
  } catch (error) {
    console.error("Error fetching returns:", error);
    return { success: false, error: "Failed to fetch returns" };
  }
}

export async function getReturnDetails(returnId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const returnDetails = await db.query.returns.findFirst({
      where: and(eq(returns.id, returnId), eq(returns.userId, user.user.id)),
      with: {
        order: true,
        returnItems: {
          with: {
            orderItem: {
              with: {
                product: true,
              },
            },
          },
        },
        refunds: true,
      },
    });

    if (!returnDetails) {
      return { success: false, error: "Return not found" };
    }

    return { success: true, data: returnDetails };
  } catch (error) {
    console.error("Error fetching return details:", error);
    return { success: false, error: "Failed to fetch return details" };
  }
}

export async function initiateReturn(data: {
  orderId: string;
  items: Array<{
    orderItemId: string;
    quantity: number;
    reason:
      | "defective"
      | "damaged"
      | "wrong_item"
      | "not_as_described"
      | "better_price"
      | "no_longer_needed"
      | "unauthorized_purchase"
      | "other";
    condition: string;
    details?: string;
  }>;
  returnType?: "refund" | "exchange";
  additionalDetails?: string;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify order belongs to user and is eligible for return
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, data.orderId), eq(orders.userId, user.user.id)),
      with: {
        orderItems: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Check if order is eligible (delivered within 30 days)
    if (order.status !== "delivered") {
      return {
        success: false,
        error: "Order must be delivered to initiate return",
      };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (order.deliveredAt && new Date(order.deliveredAt) < thirtyDaysAgo) {
      return { success: false, error: "Return period has expired (30 days)" };
    }

    // Validate items
    for (const item of data.items) {
      const orderItem = order.orderItems.find(
        (oi) => oi.id === item.orderItemId
      );

      if (!orderItem) {
        return { success: false, error: "Invalid order item" };
      }

      if (item.quantity > orderItem.quantity) {
        return {
          success: false,
          error: `Cannot return more than ordered quantity for ${orderItem.productName}`,
        };
      }

      if (orderItem.isReturned) {
        return {
          success: false,
          error: `Item ${orderItem.productName} has already been returned`,
        };
      }
    }

    // Calculate total return amount
    let totalAmount = 0;
    for (const item of data.items) {
      const orderItem = order.orderItems.find(
        (oi) => oi.id === item.orderItemId
      );
      if (orderItem) {
        totalAmount += Number(orderItem.price) * item.quantity;
      }
    }

    // Generate RMA number
    const rmaNumber = `RMA${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Create return
    const [newReturn] = await db
      .insert(returns)
      .values({
        orderId: data.orderId,
        userId: user.user.id,
        rmaNumber,
        status: "requested",
        returnReason: data.items[0]?.reason as any,
        returnType: data.returnType || "refund",
        additionalDetails: data.additionalDetails,
        totalAmount: totalAmount.toString(),
        returnShippingPaid: false,
      })
      .returning();

    // Create return items
    const returnItemsData = data.items.map((item) => ({
      returnId: newReturn?.id,
      orderItemId: item.orderItemId,
      quantity: item.quantity,
      reason: item.reason,
      condition: item.condition,
      details: item.details,
      status: "pending",
      refundAmount: order.orderItems.find((oi) => oi.id === item.orderItemId)
        ?.price
        ? (
            Number(
              order.orderItems.find((oi) => oi.id === item.orderItemId)?.price
            ) * item.quantity
          ).toString()
        : "0",
    }));

    await db.insert(returnItems).values(returnItemsData as any);

    // Update order items
    for (const item of data.items) {
      await db
        .update(orderItems)
        .set({
          isReturned: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orderItems.id, item.orderItemId));
    }

    // Create notification
    await createNotification({
      userId: user.user.id,
      type: "order_update",
      title: "Return Initiated",
      message: `Your return request #${rmaNumber} has been submitted`,
      data: { returnId: newReturn?.id, rmaNumber },
    });

    return {
      success: true,
      data: {
        return: newReturn,
        rmaNumber,
      },
      message: `Return initiated successfully. RMA: ${rmaNumber}`,
    };
  } catch (error) {
    console.error("Error initiating return:", error);
    return { success: false, error: "Failed to initiate return" };
  }
}

export async function cancelReturn(returnId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const returnRecord = await db.query.returns.findFirst({
      where: and(eq(returns.id, returnId), eq(returns.userId, user.user.id)),
    });

    if (!returnRecord) {
      return { success: false, error: "Return not found" };
    }

    if (!["requested", "pending"].includes(returnRecord.status || "")) {
      return { success: false, error: "Cannot cancel return at this stage" };
    }

    // Update return status
    await db
      .update(returns)
      .set({
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(returns.id, returnId));

    // Update return items
    await db
      .update(returnItems)
      .set({
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(returnItems.returnId, returnId));

    // Revert order items
    const items = await db.query.returnItems.findMany({
      where: eq(returnItems.returnId, returnId),
    });

    for (const item of items) {
      await db
        .update(orderItems)
        .set({
          isReturned: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orderItems.id, item.orderItemId));
    }

    return { success: true, message: "Return cancelled successfully" };
  } catch (error) {
    console.error("Error cancelling return:", error);
    return { success: false, error: "Failed to cancel return" };
  }
}

export async function getReturnLabel(returnId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const returnRecord = await db.query.returns.findFirst({
      where: and(eq(returns.id, returnId), eq(returns.userId, user.user.id)),
    });

    if (!returnRecord) {
      return { success: false, error: "Return not found" };
    }

    if (!returnRecord.returnShippingLabel) {
      return { success: false, error: "Return label not available yet" };
    }

    return {
      success: true,
      data: {
        labelUrl: returnRecord.returnShippingLabel,
        rmaNumber: returnRecord.rmaNumber,
      },
    };
  } catch (error) {
    console.error("Error getting return label:", error);
    return { success: false, error: "Failed to get return label" };
  }
}
