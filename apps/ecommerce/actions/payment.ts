"use server";

import { getLocale } from "next-intl/server";
import { and, db, eq, orders } from "@workspace/db";
import { getPaymentProvider } from "@workspace/lib/payments";
import { readOrderGateway } from "@workspace/lib/payments/store-gateways";
import { createStoreGatewayCheckout } from "@workspace/lib/payments/store-gateways/server";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { getRequestSiteUrl } from "@/lib/storefront.server";
import { createKashierCheckoutUrl } from "./kashier";
import { createPaymobCheckoutUrl, getPaymobPaymentOrder } from "./paymob";

/**
 * Provider-agnostic entry points for the checkout payment step. The active
 * gateway is chosen by PAYMENT_PROVIDER; callers never name a provider.
 *
 * `presentation` tells the page how to show the returned URL: Paymob's unified
 * checkout is embedded, Kashier's hosted session takes over the browser.
 *
 * A storefront order placed with the seller's own gateway (ROADMAP.md F-39,
 * `orders.metadata.paymentGateway`) is paid on that gateway instead, never on
 * Tallaby's.
 */
export async function getPaymentOrder(orderId: string) {
  // Order loading is identical for every provider.
  return getPaymobPaymentOrder(orderId);
}

export async function createPaymentCheckoutUrl(orderId: string) {
  const userId = await getCurrentUserId();
  if (userId) {
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
      columns: { metadata: true },
    });
    if (order && readOrderGateway(order.metadata)) {
      const result = await createStoreGatewayCheckout({
        orderId,
        userId,
        siteUrl: await getRequestSiteUrl(),
        locale: await getLocale(),
      });
      return result.success
        ? {
            success: true as const,
            error: undefined,
            data: { checkoutUrl: result.data.checkoutUrl, orderId, presentation: "redirect" as const },
          }
        : { success: false as const, error: "Failed to initialize payment" };
    }
  }

  if (getPaymentProvider() === "kashier") {
    const result = await createKashierCheckoutUrl(orderId);
    return result.success
      ? {
          ...result,
          data: { ...result.data, presentation: "redirect" as const },
        }
      : result;
  }

  const result = await createPaymobCheckoutUrl(orderId);
  return result.success
    ? { ...result, data: { ...result.data, presentation: "iframe" as const } }
    : result;
}
