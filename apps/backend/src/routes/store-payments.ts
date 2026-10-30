import { Hono } from "hono";
import { handleStoreGatewayWebhook } from "@workspace/lib/payments/store-gateways/server";
import { fulfillDigitalOrderItems } from "@workspace/lib/digital";
import { sendSellerLowStock, sendSellerNewOrders } from "../lib/emails/seller-emails";

const app = new Hono();

/**
 * The seller's own Paymob / Kashier gateway (ROADMAP.md F-39), one URL per
 * store integration; we pass it to the gateway with every checkout. The
 * signature is checked with that store's keys inside the handler, and only
 * that store's orders can change. Paymob sends `?hmac=`, Kashier
 * `x-kashier-signature`; 200/409 are acks, 401 for a forged call.
 */
app.post("/:integrationId", async (c) => {
  const body = await c.req.json().catch(() => null);
  try {
    const result = await handleStoreGatewayWebhook(c.req.param("integrationId"), {
      body,
      query: { hmac: c.req.query("hmac") },
      headers: { "x-kashier-signature": c.req.header("x-kashier-signature") },
    });

    if (result.paidOrderId) {
      const orderId = result.paidOrderId;
      await fulfillDigitalOrderItems(orderId).catch((error) =>
        console.error("Digital fulfillment after store gateway payment failed:", error),
      );
      // The order left payment_processing: now the seller hears about it.
      await sendSellerNewOrders(orderId)
        .then(() => sendSellerLowStock(orderId))
        .catch((error) => console.error("Seller emails after store gateway payment failed:", error));
    }

    return c.json(result.body, result.status);
  } catch (error) {
    // Never echo the body: it carries customer and card data. 500 → the gateway retries.
    console.error("Store gateway webhook failed", (error as Error)?.name);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

export default app;
