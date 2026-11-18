import { Hono, type Context } from "hono";
import { hasEasykashCallbackFields } from "@workspace/lib/easykash";
import { handleTallabyPayCallback } from "@workspace/lib/tallaby-pay/server";
import { afterGatewayPayment } from "../lib/after-gateway-payment";

const app = new Hono();

/**
 * Tallaby Pay (ROADMAP.md F-100c, design §6.1): the one Callback URL of
 * Tallaby's own EasyKash account, `/api/webhooks/tallaby-pay/easykash`, set
 * once by the owner in EasyKash › Integration Settings. EasyKash checks the
 * URL answers GET, so a GET with no callback fields is a plain 200; a
 * callback may come as a POST (JSON or form) or a GET with the fields in the
 * query. The HMAC (TALLABY_EASYKASH_HMAC_SECRET) is checked in the handler.
 * Bodies are never logged: they carry the buyer's details.
 */
async function callback(c: Context, fields: Record<string, unknown>) {
  try {
    const result = await handleTallabyPayCallback(fields);
    await afterGatewayPayment(result);
    return c.json(result.body, result.status);
  } catch (error) {
    // 500 → EasyKash retries; the transaction rolled back, so nothing moved.
    console.error("Tallaby Pay callback failed", (error as Error)?.name);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
}

app.get("/easykash", async (c) => {
  const query = c.req.query();
  if (!hasEasykashCallbackFields(query)) return c.json({ ok: true }, 200);
  return callback(c, query);
});

app.post("/easykash", async (c) => {
  const type = c.req.header("content-type") ?? "";
  const body: unknown =
    type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")
      ? await c.req.parseBody().catch(() => null)
      : await c.req.json().catch(() => null);
  const fields = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  return callback(c, fields);
});

export default app;
