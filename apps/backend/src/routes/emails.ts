import { Hono } from "hono";
import { z } from "zod";
import { ORDERS_FROM_ADDRESS, sendEmail } from "../lib/resend";
import {
  WelcomeEmail,
  DigitalDeliveryEmail,
  OrderConfirmationEmail,
  getEmailMessages,
  interpolate,
  resolveEmailLocale,
} from "@workspace/emails";
import { buildOrderConfirmationEmailData } from "../lib/order-confirmation";
import {
  claimEmailDelivery,
  EMAIL_TYPES,
  markEmailSent,
  releaseFailedEmailDelivery,
} from "../lib/email-delivery";

const app = new Hono();

const orderConfirmationSchema = z.object({
  orderId: z.string().uuid(),
  locale: z.string().optional(),
});

app.post("/welcome", async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, preferredLanguage } = body;

    if (!email || typeof email !== "string") {
      return c.json({ error: "Invalid email address" }, 400);
    }

    if (!name || typeof name !== "string") {
      return c.json({ error: "Invalid name" }, 400);
    }

    const locale = resolveEmailLocale(
      typeof preferredLanguage === "string" ? preferredLanguage : null
    );
    const copy = getEmailMessages(locale).welcome;

    await sendEmail({
      to: email,
      subject: copy.subject,
      content: WelcomeEmail({
        customerName: name,
        discountCode: "WELCOME10",
        discountPercent: 10,
        locale,
      }),
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return c.json({ error: "Failed to send welcome email" }, 500);
  }
});

app.post("/digital-delivery", async (c) => {
  try {
    const body = await c.req.json();
    const { email, name, orderNumber, items, preferredLanguage } = body;

    if (!email || typeof email !== "string") {
      return c.json({ error: "Invalid email address" }, 400);
    }

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: "No items to deliver" }, 400);
    }

    const locale = resolveEmailLocale(
      typeof preferredLanguage === "string" ? preferredLanguage : null
    );
    const copy = getEmailMessages(locale).digitalDelivery;

    await sendEmail({
      to: email,
      subject: interpolate(copy.subject, { orderNumber: orderNumber ?? "" }),
      content: DigitalDeliveryEmail({
        customerName: name,
        orderNumber,
        items,
        locale,
      }),
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Error sending digital delivery email:", error);
    return c.json({ error: "Failed to send digital delivery email" }, 500);
  }
});

/**
 * Sends the order-confirmation email for an already-committed order.
 *
 * Callers pass only an order id: the order is re-read here so the email
 * always reflects persisted state, and the send is guarded by an
 * `email_deliveries` claim so retried or duplicated calls are no-ops.
 */
app.post("/order-confirmation", async (c) => {
  let claimedDeliveryId: string | null = null;

  try {
    const parsed = orderConfirmationSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        400
      );
    }

    const { orderId } = parsed.data;
    const built = await buildOrderConfirmationEmailData(orderId);

    if (!built.success) {
      // A customer with no email on file is not an error worth retrying.
      const status = built.status === 422 ? 200 : built.status;
      return c.json({ success: false, skipped: true, reason: built.error }, status);
    }

    const claim = await claimEmailDelivery({
      emailType: EMAIL_TYPES.orderConfirmation,
      referenceId: orderId,
      recipient: built.recipient,
      metadata: { orderNumber: built.data.order.orderNumber },
    });

    if (!claim.claimed) {
      return c.json({
        success: true,
        duplicate: true,
        emailId: claim.existing?.resendEmailId ?? null,
      });
    }

    claimedDeliveryId = claim.delivery.id;

    const { id } = await sendEmail({
      to: built.recipient,
      subject: interpolate(
        getEmailMessages(built.data.locale ?? "en").orderConfirmation.subject,
        { orderNumber: built.data.order.orderNumber }
      ),
      content: OrderConfirmationEmail(built.data),
      from: ORDERS_FROM_ADDRESS,
      replyTo: ORDERS_FROM_ADDRESS,
      // Second layer of protection: even if the claim row were lost, Resend
      // collapses repeated sends carrying the same key.
      idempotencyKey: `order-confirmation:${orderId}`,
    });

    await markEmailSent(claim.delivery.id, id);

    return c.json({ success: true, emailId: id });
  } catch (error) {
    if (claimedDeliveryId) {
      await releaseFailedEmailDelivery(
        claimedDeliveryId,
        error instanceof Error ? error.message : String(error)
      ).catch((releaseError) => {
        console.error(
          "Failed to release order confirmation email claim:",
          releaseError
        );
      });
    }
    console.error("Error sending order confirmation email:", error);
    return c.json({ error: "Failed to send order confirmation email" }, 500);
  }
});

export default app;
