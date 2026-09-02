import { Hono } from "hono";
import { Resend } from "resend";
import { db, emailEvents, eq } from "@workspace/db";
import { applyDeliveryStatus } from "../lib/email-delivery";

const app = new Hono();

/** Resend event -> the delivery status we persist for it. */
const EVENT_STATUS: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.failed": "failed",
  "email.complained": "complained",
};

interface ResendWebhookEvent {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    subject?: string;
    bounce?: { message?: string; type?: string; subType?: string };
    failed?: { reason?: string };
  };
}

function extractErrorMessage(event: ResendWebhookEvent): string | null {
  return event.data?.bounce?.message ?? event.data?.failed?.reason ?? null;
}

/**
 * Resend delivery-event receiver.
 *
 * Signature verification runs against the raw request body via the official
 * `resend.webhooks.verify` helper (Svix under the hood) — the parsed JSON is
 * never trusted on its own. Events are stored by their Svix message id, which
 * is unique, so Resend's retries are absorbed idempotently.
 */
app.post("/resend", async (c) => {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Resend webhook: RESEND_WEBHOOK_SECRET is not configured");
    return c.json({ error: "Webhook secret not configured" }, 500);
  }

  const svixId = c.req.header("svix-id");
  const svixTimestamp = c.req.header("svix-timestamp");
  const svixSignature = c.req.header("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: "Missing webhook signature headers" }, 400);
  }

  // Must be the exact bytes Resend signed — do not re-serialize.
  const rawBody = await c.req.text();

  let event: ResendWebhookEvent;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret,
    }) as unknown as ResendWebhookEvent;
  } catch (error) {
    console.error("Resend webhook: signature verification failed", error);
    return c.json({ error: "Invalid webhook signature" }, 401);
  }

  try {
    const resendEmailId = event.data?.email_id ?? null;
    const occurredAt = event.created_at
      ? new Date(event.created_at).toISOString()
      : new Date().toISOString();

    const [stored] = await db
      .insert(emailEvents)
      .values({
        eventId: svixId,
        resendEmailId,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
        occurredAt,
      })
      .onConflictDoNothing({ target: emailEvents.eventId })
      .returning();

    if (!stored) {
      // Resend retried a message we already processed.
      return c.json({ received: true, duplicate: true });
    }

    const status = EVENT_STATUS[event.type];
    if (status && resendEmailId) {
      const delivery = await applyDeliveryStatus({
        resendEmailId,
        status,
        occurredAt,
        errorMessage: extractErrorMessage(event),
      });

      if (delivery) {
        await db
          .update(emailEvents)
          .set({ emailDeliveryId: delivery.id })
          .where(eq(emailEvents.id, stored.id));
      }

      if (status === "bounced" || status === "failed" || status === "complained") {
        console.error(
          `Resend webhook: ${event.type} for email ${resendEmailId}`,
          extractErrorMessage(event) ?? ""
        );
      }
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("Resend webhook: processing failed", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

export default app;
