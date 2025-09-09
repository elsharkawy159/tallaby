"use server";

import { db } from "@workspace/db";
import {
  shipments,
  shipmentItems,
  orderItems,
  deliveries,
} from "@workspace/db";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { getUser } from "./auth";

export async function getSellerShipments(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const conditions = [eq(shipments.sellerId, session.user.id)];

    if (params?.status) {
      conditions.push(eq(shipments.status, params.status));
    }

    const shipmentsList = await db.query.shipments.findMany({
      where: and(...conditions),
      with: {
        order: {
          columns: {
            orderNumber: true,
            userId: true,
          },
          with: {
            user: {
              columns: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        shipmentItems: {
          with: {
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
        deliveries: {
          orderBy: [desc(deliveries.createdAt)],
          limit: 1,
        },
      },
      orderBy: [desc(shipments.createdAt)],
      limit: params?.limit || 20,
      offset: params?.offset || 0,
    });

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(shipments)
      .where(and(...conditions));

    return {
      success: true,
      data: shipmentsList,
      totalCount: Number(totalCount[0].count),
    };
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function createShipment(data: {
  orderId: string;
  orderItemIds: string[];
  carrier?: string;
  trackingNumber?: string;
  serviceLevel?: string;
  packageWeight?: string;
  dimensions?: any;
  estimatedDeliveryDate?: string;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Verify order items belong to seller
    const items = await db.query.orderItems.findMany({
      where: and(
        eq(orderItems.sellerId, session.user.id),
        sql`${orderItems.id} = ANY(${data.orderItemIds})`
      ),
    });

    if (items.length !== data.orderItemIds.length) {
      throw new Error("Some order items not found or unauthorized");
    }

    // Create shipment
    const newShipment = await db
      .insert(shipments)
      .values({
        orderId: data.orderId,
        sellerId: session.user.id,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        serviceLevel: data.serviceLevel,
        packageWeight: data.packageWeight,
        dimensions: data.dimensions,
        estimatedDeliveryDate: data.estimatedDeliveryDate,
        status: "pending",
      })
      .returning();

    // Add shipment items
    const shipmentItemsData = data.orderItemIds.map((itemId) => {
      const item = items.find((i) => i.id === itemId);
      return {
        shipmentId: newShipment[0].id,
        orderItemId: itemId,
        quantity: item?.quantity || 1,
      };
    });

    await db.insert(shipmentItems).values(shipmentItemsData);

    // Update order items status
    await db
      .update(orderItems)
      .set({
        status: "shipping_soon",
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(orderItems.sellerId, session.user.id),
          sql`${orderItems.id} = ANY(${data.orderItemIds})`
        )
      );

    return { success: true, data: newShipment[0] };
  } catch (error) {
    console.error("Error creating shipment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateShipment(
  shipmentId: string,
  data: {
    trackingNumber?: string;
    carrier?: string;
    status?: string;
    shippingLabelUrl?: string;
  }
) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const updatedShipment = await db
      .update(shipments)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
        ...(data.status === "shipped"
          ? { shippedAt: new Date().toISOString() }
          : {}),
        ...(data.status === "delivered"
          ? { deliveredAt: new Date().toISOString() }
          : {}),
      })
      .where(
        and(
          eq(shipments.id, shipmentId),
          eq(shipments.sellerId, session.user.id)
        )
      )
      .returning();

    if (!updatedShipment.length) {
      throw new Error("Shipment not found or unauthorized");
    }

    // Update related order items if status changed
    if (data.status) {
      const shipmentItemsList = await db.query.shipmentItems.findMany({
        where: eq(shipmentItems.shipmentId, shipmentId),
      });

      const itemIds = shipmentItemsList.map((si) => si.orderItemId);

      if (itemIds.length > 0) {
        await db
          .update(orderItems)
          .set({
            status:
              data.status === "shipped"
                ? "shipped"
                : data.status === "delivered"
                  ? "delivered"
                  : "shipping_soon",
            updatedAt: new Date().toISOString(),
            ...(data.status === "shipped"
              ? { shippedAt: new Date().toISOString() }
              : {}),
            ...(data.status === "delivered"
              ? { deliveredAt: new Date().toISOString() }
              : {}),
          })
          .where(
            and(
              eq(orderItems.sellerId, session.user.id),
              sql`${orderItems.id} = ANY(${itemIds})`
            )
          );
      }
    }

    return { success: true, data: updatedShipment[0] };
  } catch (error) {
    console.error("Error updating shipment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function markAsShipped(shipmentId: string) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    return updateShipment(shipmentId, { status: "shipped" });
  } catch (error) {
    console.error("Error marking as shipped:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPendingShipments() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Get order items that need shipping
    const pendingItems = await db.query.orderItems.findMany({
      where: and(
        eq(orderItems.sellerId, session.user.id),
        or(
          eq(orderItems.status, "confirmed"),
          eq(orderItems.status, "payment_processing")
        ),
        eq(orderItems.isRefunded, false)
      ),
      with: {
        order: {
          with: {
            user: {
              columns: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            userAddress_shippingAddressId: true,
          },
        },
        product: {
          columns: {
            title: true,
            sku: true,
            dimensions: true,
          },
        },
      },
      orderBy: [desc(orderItems.createdAt)],
    });

    // Group by order
    const groupedByOrder = pendingItems.reduce(
      (acc, item) => {
        const orderId = item.orderId;
        if (!acc[orderId]) {
          acc[orderId] = {
            order: item.order,
            items: [],
          };
        }
        acc[orderId].items.push(item);
        return acc;
      },
      {} as Record<string, any>
    );

    return {
      success: true,
      data: Object.values(groupedByOrder),
    };
  } catch (error) {
    console.error("Error fetching pending shipments:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getShippingStats() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const stats = await db
      .select({
        status: shipments.status,
        count: sql<number>`count(*)`,
      })
      .from(shipments)
      .where(eq(shipments.sellerId, session.user.id))
      .groupBy(shipments.status);

    const todayShipments = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.sellerId, session.user.id),
          sql`DATE(${shipments.createdAt}) = CURRENT_DATE`
        )
      );

    const averageDeliveryTime = await db
      .select({
        avgDays: sql<number>`AVG(EXTRACT(DAY FROM ${shipments.deliveredAt} - ${shipments.shippedAt}))`,
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.sellerId, session.user.id),
          sql`${shipments.deliveredAt} IS NOT NULL`,
          sql`${shipments.shippedAt} IS NOT NULL`
        )
      );

    return {
      success: true,
      data: {
        byStatus: stats,
        todayCount: todayShipments[0]?.count || 0,
        averageDeliveryDays: averageDeliveryTime[0]?.avgDays || null,
      },
    };
  } catch (error) {
    console.error("Error fetching shipping stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
