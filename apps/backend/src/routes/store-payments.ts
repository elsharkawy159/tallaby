import { Hono, type Context } from "hono";
import { hasEasykashCallbackFields } from "@workspace/lib/easykash";
import {
  handleEasykashCallback,
  handleStoreGatewayWebhook,
  type GatewayWebhookResult,
} from "@workspace/lib/payments/store-gateways/server";
import { fulfillDigitalOrderItems } from "@workspace/lib/digital";
import { sendSellerLowStock, sendSellerNewOrders } from "../lib/emails/seller-emails";

const app = new Hono();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The order left payment_processing: digital items, then the seller hears about it. */
async function afterGatewayPayment(result: GatewayWebhookResult) {
  if (!result.paidOrderId) return;
  const orderId = result.paidOrderId;
  await fulfillDigitalOrderItems(orderId).catch((error) =>
    console.error("Digital fulfillment after store gateway payment failed:", error),
  );
  await sendSellerNewOrders(orderId)
    .then(() => sendSellerLowStock(orderId))
    .catch((error) => console.error("Seller emails after store gateway payment failed:", error));
}

/**
 * The seller's own EasyKash account (ROADMAP.md F-98, docs/easykash.md §4.3).
 * One Callback URL per seller, pasted once in EasyKash › Integration
 * Settings. EasyKash checks the URL answers GET, so a GET with no callback
 * fields is a plain 200; a callback may come as a POST (JSON or form) or a GET
 * with the fields in the query. Registered before `/:integrationId`. Bodies
 * are never logged: they carry the buyer's details.
 */
async function easykashCallback(c: Context, fields: Record<string, unknown>) {
  try {
    const result = await handleEasykashCallback(c.req.param("sellerId")!, fields);
    await afterGatewayPayment(result);
    return c.json(result.body, result.status);
  } catch (error) {
    console.error("EasyKash callback failed", (error as Error)?.name);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
}

app.get("/easykash/:sellerId", async (c) => {
  if (!UUID.test(c.req.param("sellerId"))) return c.json({ error: "Not found" }, 404);
  const query = c.req.query();
  if (!hasEasykashCallbackFields(query)) return c.json({ ok: true }, 200);
  return easykashCallback(c, query);
});

app.post("/easykash/:sellerId", async (c) => {
  if (!UUID.test(c.req.param("sellerId"))) return c.json({ error: "Not found" }, 404);
  const type = c.req.header("content-type") ?? "";
  const body: unknown =
    type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")
      ? await c.req.parseBody().catch(() => null)
      : await c.req.json().catch(() => null);
  const fields = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  return easykashCallback(c, fields);
});

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
    await afterGatewayPayment(result);
    return c.json(result.body, result.status);
  } catch (error) {
    // Never echo the body: it carries customer and card data. 500 → the gateway retries.
    console.error("Store gateway webhook failed", (error as Error)?.name);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

export default app;
