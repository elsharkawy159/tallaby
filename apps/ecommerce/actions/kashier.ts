"use server";

import { getLocale } from "next-intl/server";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { db, orders, eq, and } from "@workspace/db";
import {
  buildKashierOrderReference,
  createKashierSession,
  getKashierConfig,
} from "@workspace/lib/kashier";

export async function createKashierCheckoutUrl(orderId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false as const, error: "Unauthorized" };
    }

    const config = getKashierConfig();
    if (!config) {
      return { success: false as const, error: "Kashier is not configured" };
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
      with: { user: true },
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

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";
    const locale = await getLocale();

    const session = await createKashierSession(config, {
      orderReference: buildKashierOrderReference(order.id),
      amount: order.totalAmount,
      currency: order.currency || "EGP",
      customerEmail: order.user?.email,
      customerReference: order.userId,
      merchantRedirect: `${siteUrl}/api/kashier/redirect`,
      display: locale === "ar" ? "ar" : "en",
      description: `Order ${order.orderNumber}`,
      metaData: { orderId: order.id, orderNumber: String(order.orderNumber) },
    });

    return {
      success: true as const,
      data: { checkoutUrl: session.sessionUrl, orderId: order.id },
    };
  } catch (error) {
    console.error("createKashierCheckoutUrl error:", error);
    return { success: false as const, error: "Failed to initialize payment" };
  }
}
