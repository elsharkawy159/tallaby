import type { GatewayWebhookResult } from "@workspace/lib/payments/store-gateways/server";
import { fulfillDigitalOrderItems } from "@workspace/lib/digital";
import { sendSellerLowStock, sendSellerNewOrders } from "./emails/seller-emails";

/**
 * A store gateway payment (the seller's own gateway or Tallaby Pay) moved the
 * order out of payment_processing: digital items, then the seller hears about
 * it. Runs after the commit; failures are logged, never rethrown.
 */
export async function afterGatewayPayment(result: GatewayWebhookResult) {
  if (!result.paidOrderId) return;
  const orderId = result.paidOrderId;
  await fulfillDigitalOrderItems(orderId).catch((error) =>
    console.error("Digital fulfillment after store gateway payment failed:", error),
  );
  await sendSellerNewOrders(orderId)
    .then(() => sendSellerLowStock(orderId))
    .catch((error) => console.error("Seller emails after store gateway payment failed:", error));
}
