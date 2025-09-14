// apps/ecommerce/actions/order.ts
"use server";

import { db } from "@workspace/db";
import {
  orders,
  orderItems,
  userAddresses,
  couponUsage,
  coupons,
  carts,
  cartItems,
  products,
  returns,
  returnItems,
  reviews,
  deliveries,
  eq,
  and,
  desc,
  sql,
} from "@workspace/db";
import { getUser } from "./auth";
import { customAlphabet } from "nanoid";

export async function createOrder(data: {
  cartId: string;
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
  isGift?: boolean;
  giftMessage?: string;
  variantId?: string;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Get cart items
    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.id, data.cartId), eq(carts.userId, user.user.id)),
      with: {
        cartItems: {
          where: eq(cartItems.savedForLater, false),
          with: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // Verify addresses belong to user
    const shippingAddress = await db.query.userAddresses.findFirst({
      where: and(
        eq(userAddresses.id, data.shippingAddressId),
        eq(userAddresses.userId, user.user.id)
      ),
    });

    if (!shippingAddress) {
      return { success: false, error: "Shipping address not found" };
    }

    // Calculate totals
    let subtotal = 0;
    let tax = 0;
    let shippingCost = 0;

    const orderItemsData = cart.cartItems.map((item) => {
      const itemSubtotal = Number(item.price) * item.quantity;
      const itemTax = itemSubtotal * 0.14; // 14% tax
      const itemShipping = 25; // Flat rate per item for now
      const itemTotal = itemSubtotal + itemTax + itemShipping;

      subtotal += itemSubtotal;
      tax += itemTax;
      shippingCost += itemShipping;

      return {
        productId: item.productId,
        variantId: (item.variant as any)?.id || null,
        sellerId: item.sellerId,
        sku: item.product.sku,
        productName: item.product.title,
        variantName: (item.variant as any)?.title || null,
        quantity: item.quantity,
        price: item.price,
        subtotal: itemSubtotal.toString(),
        tax: itemTax.toString(),
        shippingCost: itemShipping.toString(),
        total: itemTotal.toString(),
        discountAmount: "0",
        commissionRate: 0.15, // 15% commission
        commissionAmount: (itemSubtotal * 0.15).toString(),
        sellerEarning: (itemSubtotal * 0.85).toString(),
        currency: cart.currency || "EGP",
        condition: item.product.condition,
        fulfillmentType: item.product.fulfillmentType,
        status: "pending",
      };
    });

    // Apply coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;

    if (data.couponCode) {
      const coupon = await db.query.coupons.findFirst({
        where: and(
          eq(coupons.code, data.couponCode),
          eq(coupons.isActive, true),
          sql`${coupons.startsAt} <= NOW()`,
          sql`${coupons.expiresAt} >= NOW()`
        ),
      });

      if (coupon) {
        // Check usage limit
        if (
          coupon.usageLimit &&
          coupon.usageCount &&
          coupon.usageCount >= coupon.usageLimit
        ) {
          return { success: false, error: "Coupon usage limit reached" };
        }

        // Check minimum purchase
        if (
          coupon.minimumPurchase &&
          subtotal < Number(coupon.minimumPurchase)
        ) {
          return {
            success: false,
            error: `Minimum purchase of ${coupon.minimumPurchase} required`,
          };
        }

        // Calculate discount
        if (coupon.discountType === "percentage") {
          discountAmount = subtotal * (Number(coupon.discountValue) / 100);
        } else if (coupon.discountType === "fixed_amount") {
          discountAmount = Number(coupon.discountValue);
        }

        // Apply maximum discount if set
        if (
          coupon.maximumDiscount &&
          discountAmount > Number(coupon.maximumDiscount)
        ) {
          discountAmount = Number(coupon.maximumDiscount);
        }

        appliedCoupon = coupon;
      }
    }

    const totalAmount = subtotal + tax + shippingCost - discountAmount;
    // Generate a 10-character order number (e.g., ORD + 7 random alphanumeric chars)
    // Generate a more unique order number using nanoid
    const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);
    const orderNumber = `ORD${nanoid()}`;

    // Create order
    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: user.user.id,
        cartId: data.cartId,
        subtotal: subtotal.toString(),
        shippingCost: shippingCost.toString(),
        tax: tax.toString(),
        discountAmount: discountAmount.toString(),
        totalAmount: totalAmount.toString(),
        currency: cart.currency || "EGP",
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: data.paymentMethod,
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId || data.shippingAddressId,
        isGift: data.isGift || false,
        giftMessage: data.giftMessage,
        couponCode: data.couponCode,
        notes: data.notes,
      })
      .returning();

    // Create order items
    const createdOrderItems = await db
      .insert(orderItems)
      .values(
        orderItemsData.map((item) => ({
          ...item,
          orderId: newOrder?.id as string,
        })) as any
      )
      .returning();

    // Record coupon usage
    if (appliedCoupon) {
      await db.insert(couponUsage).values({
        couponId: appliedCoupon.id,
        userId: user.user.id,
        orderId: newOrder?.id as string,
        discountAmount: discountAmount.toString(),
      });

      // Update coupon usage count
      await db
        .update(coupons)
        .set({
          usageCount: appliedCoupon.usageCount
            ? appliedCoupon.usageCount + 1
            : 1,
        })
        .where(eq(coupons.id, appliedCoupon.id));
    }

    // Update product quantities
    for (const item of cart.cartItems) {
      await db
        .update(products)
        .set({
          quantity: sql`${products.quantity} - ${item.quantity}`,
        })
        .where(eq(products.id, item.productId));
    }

    // Clear cart
    await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.cartId, data.cartId),
          eq(cartItems.savedForLater, false)
        )
      );

    // Update cart status
    await db
      .update(carts)
      .set({
        status: "completed",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(carts.id, data.cartId));

    return {
      success: true,
      data: {
        order: newOrder,
        orderItems: createdOrderItems,
      },
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error: "Failed to create order" };
  }
}

export async function getOrders(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const conditions = [eq(orders.userId, user.user.id)];

    if (params?.status) {
      conditions.push(eq(orders.status, params.status as any));
    }

    const userOrders = await db.query.orders.findMany({
      where: and(...conditions),
      with: {
        orderItems: {
          with: {
            product: {
              columns: {
                title: true,
                slug: true,
                images: true,
              },
            },
          },
        },
        userAddress_shippingAddressId: true,
      },
      orderBy: [desc(orders.createdAt)],
      limit: params?.limit || 20,
      offset: params?.offset || 0,
    });

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(and(...conditions));

    return {
      success: true,
      data: userOrders,
      totalCount: Number(totalCount[0]?.count),
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

export async function getOrder(orderId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, user.user.id)),
      with: {
        orderItems: {
          with: {
            product: true,
            seller: {
              columns: {
                displayName: true,
                slug: true,
              },
            },
            reviews: {
              where: eq(reviews.userId, user.user.id),
            },
          },
        },
        userAddress_shippingAddressId: true,
        userAddress_billingAddressId: true,
        payments: true,
        shipments: {
          with: {
            deliveries: {
              orderBy: [desc(deliveries.createdAt)],
              limit: 1,
            },
          },
        },
        returns: {
          with: {
            returnItems: true,
            refunds: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    return { success: true, data: order };
  } catch (error) {
    console.error("Error fetching order:", error);
    return { success: false, error: "Failed to fetch order" };
  }
}

export async function cancelOrder(orderId: string, reason?: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Check if order can be cancelled
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, user.user.id)),
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (
      !["pending", "payment_processing", "confirmed"].includes(
        order.status as string
      )
    ) {
      return {
        success: false,
        error: "Order cannot be cancelled at this stage",
      };
    }

    // Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: reason || order.notes,
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Update order items status
    await db
      .update(orderItems)
      .set({
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orderItems.orderId, orderId));

    // Restore product quantities
    const items = await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
    });

    for (const item of items) {
      await db
        .update(products)
        .set({
          quantity: sql`${products.quantity} + ${item.quantity}`,
        })
        .where(eq(products.id, item.productId));
    }

    return { success: true, data: updatedOrder };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return { success: false, error: "Failed to cancel order" };
  }
}

export async function initiateReturn(data: {
  orderId: string;
  items: Array<{
    orderItemId: string;
    quantity: number;
    reason: string;
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

    // Verify order belongs to user
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, data.orderId), eq(orders.userId, user.user.id)),
      with: {
        orderItems: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Check if order is eligible for return (delivered within 30 days)
    if (order.status !== "delivered") {
      return {
        success: false,
        error: "Order must be delivered to initiate return",
      };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (order.deliveredAt && new Date(order.deliveredAt) < thirtyDaysAgo) {
      return { success: false, error: "Return period has expired" };
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
        returnReason: data.items[0]?.reason as any, // Use first item's reason as primary
        returnType: data.returnType || "refund",
        additionalDetails: data.additionalDetails,
        totalAmount: totalAmount.toString(),
      })
      .returning();

    // Create return items
    const returnItemsData = data.items.map((item) => ({
      returnId: newReturn?.id as string,
      orderItemId: item.orderItemId,
      quantity: item.quantity,
      reason: item.reason,
      condition: item.condition,
      details: item.details,
      status: "pending",
    }));

    await db.insert(returnItems).values(returnItemsData as any);

    // Update order items status
    for (const item of data.items) {
      await db
        .update(orderItems)
        .set({
          isReturned: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orderItems.id, item.orderItemId));
    }

    return {
      success: true,
      data: {
        return: newReturn,
        rmaNumber,
      },
    };
  } catch (error) {
    console.error("Error initiating return:", error);
    return { success: false, error: "Failed to initiate return" };
  }
}

export async function trackOrder(orderNumber: string) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumber),
      columns: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        shippedAt: true,
        deliveredAt: true,
      },
      with: {
        shipments: {
          columns: {
            trackingNumber: true,
            carrier: true,
            status: true,
            estimatedDeliveryDate: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    return { success: true, data: order };
  } catch (error) {
    console.error("Error tracking order:", error);
    return { success: false, error: "Failed to track order" };
  }
}

export async function reorderItems(orderId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, user.user.id)),
      with: {
        orderItems: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Import cart action to add items
    const { addToCart } = await import("./cart");

    let addedCount = 0;
    for (const item of order.orderItems) {
      const result = await addToCart({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId || undefined,
      });

      if (result.success) {
        addedCount++;
      }
    }

    return {
      success: true,
      message: `${addedCount} items added to cart`,
    };
  } catch (error) {
    console.error("Error reordering items:", error);
    return { success: false, error: "Failed to reorder items" };
  }
}
