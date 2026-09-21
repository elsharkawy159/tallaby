"use server";

import { getPaymentProvider } from "@workspace/lib/payments";
import { createKashierCheckoutUrl } from "./kashier";
import { createPaymobCheckoutUrl, getPaymobPaymentOrder } from "./paymob";

/**
 * Provider-agnostic entry points for the checkout payment step. The active
 * gateway is chosen by PAYMENT_PROVIDER; callers never name a provider.
 *
 * `presentation` tells the page how to show the returned URL: Paymob's unified
 * checkout is embedded, Kashier's hosted session takes over the browser.
 */
export async function getPaymentOrder(orderId: string) {
  // Order loading is identical for every provider.
  return getPaymobPaymentOrder(orderId);
}

export async function createPaymentCheckoutUrl(orderId: string) {
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
