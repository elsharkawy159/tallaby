import { createHash, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { WHATSAPP_EVENTS, verifyMetaSignature } from "@workspace/lib/whatsapp";
import {
  dispatchWhatsAppMessages,
  getWhatsAppConfig,
  getWhatsAppPhoneInfo,
  handleWhatsAppWebhook,
  submitWhatsAppTemplates,
  syncWhatsAppTemplates,
  whatsAppEnvPresence,
} from "@workspace/lib/whatsapp/server";
import { sendOrderCancelled } from "../lib/emails/customer-emails";
import { sendSellerOrderCancelled } from "../lib/emails/seller-emails";
import { queueOrderWhatsApp } from "../lib/whatsapp-order";

/**
 * WhatsApp order notifications (ROADMAP.md F-109, docs/whatsapp.md §4, §6).
 *
 * `internal` is mounted at /api/whatsapp behind the internal API secret (the
 * Next apps queue events and Admin asks for templates and the connection).
 * `webhook` is mounted at /api/webhooks/whatsapp, public, and trusts nothing
 * until Meta's signature over the raw body checks out.
 *
 * With the env missing, every route answers without touching the database:
 * internal routes report `not_configured`, the webhook answers 404 (GET) or
 * 503 (POST).
 */

export const internal = new Hono();

const orderEventSchema = z.object({
  orderId: z.string().uuid(),
  event: z.enum(WHATSAPP_EVENTS),
  byCustomerButton: z.boolean().optional(),
});

/** Queue one order event, then try to send it without making the caller wait for Meta. */
internal.post("/order-event", async (c) => {
  const parsed = orderEventSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Invalid request" }, 400);
  const { orderId, event, byCustomerButton } = parsed.data;
  const result = await queueOrderWhatsApp(orderId, event, { byCustomerButton });
  return c.json(result.queued ? { queued: true } : { queued: false, reason: result.reason });
});

const dispatchSchema = z.object({ limit: z.number().int().min(1).max(50).optional() }).nullish();

/** The cron fallback and Admin's retry nudge: one pass in the background. */
internal.post("/dispatch", async (c) => {
  const parsed = dispatchSchema.safeParse(await c.req.json().catch(() => null));
  const limit = parsed.success ? parsed.data?.limit : undefined;
  if (!getWhatsAppConfig()) return c.json({ accepted: false, reason: "not_configured" });
  void dispatchWhatsAppMessages({ limit });
  return c.json({ accepted: true }, 202);
});

internal.post("/templates/submit", async (c) => {
  const result = await submitWhatsAppTemplates();
  if (!result.ok) return c.json({ error: result.error }, result.error === "not_configured" ? 503 : 502);
  return c.json({ submitted: result.submitted, skipped: result.skipped, failed: result.failed });
});

internal.post("/templates/sync", async (c) => {
  const result = await syncWhatsAppTemplates();
  if (!result.ok) return c.json({ error: result.error }, result.error === "not_configured" ? 503 : 502);
  return c.json({ updated: result.updated, skipped: result.skipped, total: result.total });
});

/** Which env values are set (booleans, never values) and the number's state at Meta. */
internal.get("/connection", async (c) => {
  const env = whatsAppEnvPresence();
  const configured = {
    token: env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    wabaId: env.WHATSAPP_WABA_ID,
    appSecret: env.WHATSAPP_APP_SECRET,
    verifyToken: env.WHATSAPP_VERIFY_TOKEN,
    payloadSecret: env.WHATSAPP_PAYLOAD_SECRET,
  };
  const config = getWhatsAppConfig();
  if (!config) return c.json({ configured, phone: null, error: "not_configured" });
  const info = await getWhatsAppPhoneInfo(config);
  if (!info.ok) return c.json({ configured, phone: null, error: info.error.title?.slice(0, 200) ?? "graph_error" });
  const { displayName, qualityRating, messagingLimit, nameStatus } = info.data;
  return c.json({ configured, phone: { displayName, qualityRating, messagingLimit, nameStatus }, error: null });
});

// ── Meta webhook ─────────────────────────────────────────────────────────

export const webhook = new Hono();

const MAX_BODY_BYTES = 1024 * 1024;

function sameSecret(given: string | undefined, expected: string): boolean {
  if (!given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Meta's subscription check: echo hub.challenge when the verify token matches. */
webhook.get("/", (c) => {
  const config = getWhatsAppConfig();
  if (!config) return c.body(null, 404);
  const mode = c.req.query("hub.mode");
  const challenge = c.req.query("hub.challenge");
  if (mode !== "subscribe" || !challenge || challenge.length > 200 || !sameSecret(c.req.query("hub.verify_token"), config.verifyToken)) {
    return c.body(null, 403);
  }
  return c.text(challenge, 200);
});

webhook.post(
  "/",
  bodyLimit({ maxSize: MAX_BODY_BYTES, onError: (c) => c.json({ error: "Payload too large" }, 413) }),
  async (c) => {
    const config = getWhatsAppConfig();
    if (!config) return c.json({ error: "Not configured" }, 503);
    // The exact bytes Meta signed: checked before any parse.
    const raw = await c.req.text();
    if (!verifyMetaSignature(raw, c.req.header("x-hub-signature-256"), config.appSecret)) {
      return c.json({ error: "Invalid signature" }, 401);
    }
    let body: unknown = null;
    try {
      body = JSON.parse(raw);
    } catch {
      return c.json({ ok: true, ignored: true });
    }
    try {
      const summary = await handleWhatsAppWebhook(body, config, {
        sendCancelledEmail: async (orderId) => {
          await sendOrderCancelled(orderId, "customer");
          await sendSellerOrderCancelled(orderId, "customer");
        },
      });
      return c.json({ ok: true, ignored: summary.ignored });
    } catch (error) {
      // Never echo the body: it carries phones and message text.
      console.error("WhatsApp webhook: processing failed", (error as Error)?.name);
      // 500 so Meta retries (for up to 7 days): status updates replay safely
      // (they only move forward) and inbound messages are deduped by wamid.
      return c.json({ ok: false }, 500);
    }
  },
);
