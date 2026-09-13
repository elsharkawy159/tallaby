"use server";

import { db } from "@workspace/db";
import { orders, orderItems, users, products, sellers } from "@workspace/db";
import { eq, and, desc, sql, gte, lte, like, or } from "drizzle-orm";
import { fulfillDigitalOrderItems } from "@workspace/lib/digital";
import {
  scheduleAffiliateCommissionRelease,
  reverseAffiliateCommission,
  cancelPendingAffiliateCommission,
} from "@workspace/db/affiliates";
import { formatDecimal, type OrderDiscountLine } from "@workspace/lib/orders";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "./auth";
import { isAdminEditablePaymentMethod } from "@/app/(dashboard)/orders/orders.lib";
import { orderPricingSchema } from "@/app/(dashboard)/orders/[id]/edit/order-edit.schema";

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
            fullName: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          with: {
            product: {
              columns: {
                sku: true,
                images: true,
              },
              with: {
                productTranslations: {
                  columns: {
                    title: true,
                    locale: true,
                  },
                },
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
    | "payment_processing"
    | "confirmed"
    | "shipping_soon"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "refund_requested"
    | "refunded"
    | "returned"
) {
  try {
    await getAdminUser(); // Verify admin access

    // Wrapped in a transaction so the order row and the affiliate-commission
    // side effect (earn/reverse/cancel) commit or roll back together — this
    // is the same status field the shipping app's applyShipmentStatus writes,
    // so it gets the same affiliate hooks, keeping "admin changes" from being
    // a path that can silently skip or duplicate a commission.
    const updatedOrder = await db.transaction(async (tx) => {
      const [row] = await tx
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
          ...(status === "shipped"
            ? { shippedAt: new Date().toISOString() }
            : {}),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!row) {
        throw new Error("Order not found");
      }

      if (status === "delivered") {
        await scheduleAffiliateCommissionRelease(tx, orderId);
      } else if (status === "returned" || status === "refunded") {
        await reverseAffiliateCommission(tx, orderId);
        await cancelPendingAffiliateCommission(tx, orderId);
      } else if (status === "cancelled") {
        await cancelPendingAffiliateCommission(tx, orderId);
      }

      return row;
    });

    return { success: true, data: updatedOrder };
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
    | "authorized"
    | "paid"
    | "failed"
    | "refunded"
    | "partially_refunded"
) {
  try {
    const adminUser = await getAdminUser(); // Verify admin access

    const previousOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { paymentStatus: true, paymentMethod: true },
    });

    if (!previousOrder) {
      throw new Error("Order not found");
    }

    if (!isAdminEditablePaymentMethod(previousOrder.paymentMethod)) {
      return {
        success: false,
        error:
          "Payment status can only be changed for online / transfer payments",
      };
    }

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

    // Grant digital access the moment payment is confirmed. Idempotent, so a
    // re-save of an already-paid order never double-fulfills.
    if (paymentStatus === "paid" && previousOrder.paymentStatus !== "paid") {
      const fulfillment = await fulfillDigitalOrderItems(orderId, {
        actorUserId: adminUser.user?.id,
      });
      if (!fulfillment.success) {
        console.error(
          "updateOrderPaymentStatus: digital fulfillment failed:",
          fulfillment.error
        );
      }
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

/**
 * Rewrites the money on an existing order: per-item unit prices, shipping, tax,
 * discount and — when the admin insists on a figure of their own — the final
 * total.
 *
 * Quantities are deliberately NOT editable here: they are tied to the stock
 * already decremented at checkout, so changing them would need an inventory
 * movement this action does not perform. Recorded payment rows are likewise
 * left alone; adjusting an order that has already been collected is a
 * bookkeeping decision the admin makes outside this screen.
 */
export async function updateOrderPricing(orderId: string, input: unknown) {
  try {
    const adminUser = await getAdminUser(); // Verify admin access

    const parsed = orderPricingSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid pricing data",
      };
    }

    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { orderItems: true },
    });

    if (!existing) {
      return { success: false, error: "Order not found" };
    }

    const priceByItemId = new Map(
      parsed.data.items.map((item) => [item.id, item.price])
    );

    const unknownItem = parsed.data.items.find(
      (item) => !existing.orderItems.some((row) => row.id === item.id)
    );
    if (unknownItem) {
      return { success: false, error: "Order item does not belong to this order" };
    }

    const itemUpdates = existing.orderItems.map((item) => {
      const price = priceByItemId.get(item.id) ?? Number(item.price);
      const lineSubtotal = price * item.quantity;
      const commissionRate = Number(item.commissionRate ?? 0.1);

      return {
        id: item.id,
        price: formatDecimal(price),
        subtotal: formatDecimal(lineSubtotal),
        total: formatDecimal(lineSubtotal),
        commissionAmount: formatDecimal(lineSubtotal * commissionRate),
        sellerEarning: formatDecimal(lineSubtotal * (1 - commissionRate)),
      };
    });

    const subtotal = itemUpdates.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    );
    const { shippingCost, tax, discountAmount } = parsed.data;

    // Coupon lines set a floor the admin cannot discount below, so the stored
    // discount is what the rebuilt lines actually add up to.
    const { lines: discounts, total: effectiveDiscount } = rebuildDiscountLines(
      existing.discounts,
      discountAmount
    );

    const computedTotal = subtotal + shippingCost + tax - effectiveDiscount;
    const totalAmount = parsed.data.totalAmount ?? computedTotal;

    if (totalAmount < 0) {
      return { success: false, error: "Order total cannot be negative" };
    }

    const now = new Date().toISOString();
    const previousMetadata =
      existing.metadata && typeof existing.metadata === "object"
        ? (existing.metadata as Record<string, unknown>)
        : {};
    const previousEdits = Array.isArray(previousMetadata.priceEdits)
      ? (previousMetadata.priceEdits as unknown[])
      : [];

    const updated = await db.transaction(async (tx) => {
      for (const item of itemUpdates) {
        await tx
          .update(orderItems)
          .set({
            price: item.price,
            subtotal: item.subtotal,
            total: item.total,
            commissionAmount: item.commissionAmount,
            sellerEarning: item.sellerEarning,
            updatedAt: now,
          })
          .where(eq(orderItems.id, item.id));
      }

      const [row] = await tx
        .update(orders)
        .set({
          subtotal: formatDecimal(subtotal),
          shippingCost: formatDecimal(shippingCost),
          tax: formatDecimal(tax),
          discountAmount: formatDecimal(effectiveDiscount),
          discounts,
          totalAmount: formatDecimal(totalAmount),
          ...(parsed.data.notes !== undefined
            ? { notes: parsed.data.notes || null }
            : {}),
          metadata: {
            ...previousMetadata,
            priceEdits: [
              ...previousEdits,
              {
                at: now,
                by: adminUser.user?.id ?? null,
                previousTotal: existing.totalAmount,
                newTotal: formatDecimal(totalAmount),
                manualTotal: parsed.data.totalAmount != null,
              },
            ],
          },
          updatedAt: now,
        })
        .where(eq(orders.id, orderId))
        .returning();

      return row;
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath(`/orders/${orderId}/edit`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating order pricing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Keeps coupon-attributed discount lines (coupon_usage and affiliate records
 * point at them) and carries any difference on a single manual line, so the
 * stored invariant "sum of discounts.amount == discount_amount" survives an
 * admin typing a total of their own.
 */
function rebuildDiscountLines(
  existing: unknown,
  discountAmount: number
): { lines: OrderDiscountLine[]; total: number } {
  const lines = Array.isArray(existing)
    ? (existing as OrderDiscountLine[])
    : [];

  const couponLines = lines.filter(
    (line) => line.type === "coupon" || line.type === "free_shipping_coupon"
  );
  const couponTotal = couponLines.reduce(
    (sum, line) => sum + Number(line.amount),
    0
  );

  const manualAmount = discountAmount - couponTotal;
  if (manualAmount <= 0.004) {
    return { lines: couponLines, total: couponTotal };
  }

  return {
    lines: [
      ...couponLines,
      {
        type: "manual_adjustment",
        label: "Discount (set by admin)",
        amount: formatDecimal(manualAmount),
      },
    ],
    total: couponTotal + manualAmount,
  };
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
            fullName: true,
            email: true,
          },
        },
        orderItems: {
          with: {
            product: {
              columns: {
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
      "Customer Name": order.user?.fullName || "",
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
