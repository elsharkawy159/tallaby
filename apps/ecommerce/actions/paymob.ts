"use server";

import { getCurrentUserId } from "@/lib/get-current-user-id";
import { db, orders, eq, and } from "@workspace/db";
import {
  amountToCents,
  buildBillingData,
  buildPaymobCheckoutUrl,
  createPaymobIntention,
  getPaymobConfig,
  isPaymobConfigured,
} from "@workspace/lib/paymob";

export async function getPaymobPaymentOrder(orderId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false as const, error: "Unauthorized" };
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
      with: {
        orderItems: true,
      },
    });

    if (!order) {
      return { success: false as const, error: "Order not found" };
    }

    return { success: true as const, data: order };
  } catch (error) {
    console.error("getPaymobPaymentOrder error:", error);
    return { success: false as const, error: "Failed to load order" };
  }
}

export async function createPaymobCheckoutUrl(orderId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false as const, error: "Unauthorized" };
    }

    if (!isPaymobConfigured()) {
      return { success: false as const, error: "Paymob is not configured" };
    }

    const config = getPaymobConfig();
    if (!config) {
      return { success: false as const, error: "Paymob is not configured" };
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
      with: {
        orderItems: true,
        userAddress_shippingAddressId: true,
        userAddress_billingAddressId: true,
        user: true,
      },
    });

    if (!order) {
      return { success: false as const, error: "Order not found" };
    }

    if (order.paymentMethod !== "online_payment") {
      return { success: false as const, error: "Order is not payable online" };
    }

    if (!["pending", "failed"].includes(order.paymentStatus ?? "pending")) {
      return { success: false as const, error: "Order payment is not payable" };
    }

    const address =
      order.userAddress_shippingAddressId || order.userAddress_billingAddressId;
    const user = order.user;

    const billingData = buildBillingData({
      fullName: address?.fullName || user?.fullName || "Customer",
      phone: address?.phone || user?.phone || "+201000000000",
      email: user?.email || "customer@tallaby.com",
      addressLine1: address?.addressLine1 || "NA",
      addressLine2: address?.addressLine2,
      city: address?.city || "Cairo",
      state: address?.state || "Cairo",
      country: address?.country,
      postalCode: address?.postalCode,
    });

    const totalCents = amountToCents(order.totalAmount);
    const items =
      order.orderItems.length > 0
        ? order.orderItems.map((item) => ({
            name: item.productName,
            amount: amountToCents(item.total),
            description: item.productName,
            quantity: item.quantity,
          }))
        : [
            {
              name: `Order ${order.orderNumber}`,
              amount: totalCents,
              description: `Order ${order.orderNumber}`,
              quantity: 1,
            },
          ];

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";

    const intention = await createPaymobIntention({
      amount: totalCents,
      currency: order.currency || "EGP",
      paymentMethods: [config.cardIntegrationId],
      items,
      billingData,
      specialReference: order.id,
      notificationUrl: config.webhookUrl,
      redirectionUrl: `${siteUrl}/orders/${order.id}`,
    });

    const checkoutUrl = buildPaymobCheckoutUrl(
      config.publicKey,
      intention.client_secret
    );

    return {
      success: true as const,
      data: { checkoutUrl, orderId: order.id },
    };
  } catch (error) {
    console.error("createPaymobCheckoutUrl error:", error);
    return { success: false as const, error: "Failed to initialize payment" };
  }
}
