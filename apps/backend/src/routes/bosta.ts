import { Hono } from "hono";
import { handleBostaWebhook } from "@workspace/lib/shipping/bosta-sync";

const app = new Hono();

/**
 * Bosta delivery status webhook, one URL per store integration
 * (docs/superpowers/plans/2026-10-26-bosta-shipping.md §4.5, BS-10). Bosta
 * sends the per-store token we gave it in `webhookCustomHeaders`; the state
 * is then re-read from Bosta with the store's key, never taken from the body.
 * Anything but a bad token answers 200 so Bosta stops retrying.
 */
app.post("/:integrationId", async (c) => {
  let body: unknown = null;
  try {
    body = await c.req.json();
  } catch {
    body = null;
  }

  try {
    const result = await handleBostaWebhook(c.req.param("integrationId"), c.req.header("authorization"), body);
    return c.json(result.body, result.status);
  } catch (error) {
    // Never echo the body: it carries customer data. The sync cron catches up.
    console.error("Bosta webhook: processing failed", (error as Error)?.name);
    return c.json({ ok: true, deferred: true }, 200);
  }
});

export default app;
