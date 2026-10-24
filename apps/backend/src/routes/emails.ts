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
import {
  buildOrderConfirmation,
  sendAbandonedCart,
  sendOrderCancelled,
  sendOrderDelivered,
  sendOrderShipped,
  sendRefundIssued,
} from "../lib/emails/customer-emails";
import {
  sendSellerLowStock,
  sendSellerNewOrders,
  sendSellerOrderCancelled,
  sendSellerStoreCreated,
  sendSellerWalletTopUp,
} from "../lib/emails/seller-emails";
import { sendFeeTrialReminder } from "../lib/fee-trial-reminder";
import {
  claimEmailDelivery,
  EMAIL_TYPES,
  markEmailSent,
  releaseFailedEmailDelivery,
} from "../lib/email-delivery";

const app = new Hono();

const feeTrialReminderSchema = z.object({
  sellerId: z.string().uuid(),
  stage: z.enum(["t7", "t1"]),
});

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
    const built = await buildOrderConfirmation(orderId);

    if (!built.ok) {
      // A customer with no email on file is not an error worth retrying.
      const status = built.status === 422 ? 200 : built.status;
      return c.json({ success: false, skipped: true, reason: built.error }, status);
    }

    const claim = await claimEmailDelivery({
      emailType: EMAIL_TYPES.orderConfirmation,
      referenceId: orderId,
      recipient: built.recipient,
      metadata: { orderNumber: built.ctx.order.orderNumber },
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
      subject: built.subject,
      content: built.content,
      // A storefront order is sent under the store's name (replies go to its support address).
      ...built.sender,
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

/**
 * Seller fee trial reminder, 7 days and 1 day before the trial ends (PLAN.md
 * §13.5, P6-07). Called by the daily ecommerce cron. Each stage is sent once
 * per seller (email_deliveries claim) and only when it is actually due.
 */
app.post("/fee-trial-reminder", async (c) => {
  const parsed = feeTrialReminderSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }

  try {
    const result = await sendFeeTrialReminder(parsed.data.sellerId, parsed.data.stage);
    return c.json({ success: true, ...result });
  } catch (error) {
    console.error("Error sending fee trial reminder:", error);
    return c.json({ error: "Failed to send fee trial reminder" }, 500);
  }
});

/*
 * Lifecycle mail (Claude Design email library). Callers post an id after
 * their transaction commits; everything is re-read here and each email goes
 * out once (email_deliveries claim + Resend idempotency key), so retries and
 * duplicate calls are harmless.
 */

const orderEventSchema = z.object({
  orderId: z.string().uuid(),
  event: z.enum(["placed", "shipped", "delivered", "cancelled"]),
  cancelledBy: z.enum(["customer", "seller", "system"]).optional(),
});

/**
 * One order lifecycle step. `placed` covers the seller "new order" and
 * low-stock mail; call it again when an online payment confirms the order
 * (orders still in `payment_processing` are skipped until then).
 */
app.post("/order-event", async (c) => {
  const parsed = orderEventSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }
  const { orderId, event, cancelledBy = "system" } = parsed.data;
  try {
    switch (event) {
      case "placed": {
        const sellers = await sendSellerNewOrders(orderId);
        const lowStock = await sendSellerLowStock(orderId);
        return c.json({ success: true, sellers, lowStock });
      }
      case "shipped":
        return c.json({ success: true, customer: await sendOrderShipped(orderId) });
      case "delivered":
        return c.json({ success: true, customer: await sendOrderDelivered(orderId) });
      case "cancelled": {
        const customer = await sendOrderCancelled(orderId, cancelledBy);
        const sellers = await sendSellerOrderCancelled(orderId, cancelledBy);
        return c.json({ success: true, customer, sellers });
      }
    }
  } catch (error) {
    console.error(`Error sending order ${event} email:`, error);
    return c.json({ error: `Failed to send order ${event} email` }, 500);
  }
});

const refundSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(["wallet", "original", "manual"]),
  amount: z.union([z.string(), z.number()]).optional(),
});

app.post("/refund-issued", async (c) => {
  const parsed = refundSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }
  try {
    const result = await sendRefundIssued(parsed.data.orderId, {
      method: parsed.data.method,
      amount: parsed.data.amount ?? null,
    });
    return c.json({ success: true, result });
  } catch (error) {
    console.error("Error sending refund email:", error);
    return c.json({ error: "Failed to send refund email" }, 500);
  }
});

const topUpSchema = z.object({
  topUpId: z.string().uuid(),
  balanceAfter: z.union([z.string(), z.number()]).optional(),
});

app.post("/store-wallet-top-up", async (c) => {
  const parsed = topUpSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }
  try {
    const result = await sendSellerWalletTopUp(parsed.data.topUpId, parsed.data.balanceAfter ?? null);
    return c.json({ success: true, result });
  } catch (error) {
    console.error("Error sending wallet top-up email:", error);
    return c.json({ error: "Failed to send wallet top-up email" }, 500);
  }
});

const storeSchema = z.object({ storeId: z.string().uuid() });

app.post("/store-created", async (c) => {
  const parsed = storeSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }
  try {
    return c.json({ success: true, result: await sendSellerStoreCreated(parsed.data.storeId) });
  } catch (error) {
    console.error("Error sending store created email:", error);
    return c.json({ error: "Failed to send store created email" }, 500);
  }
});

const cartSchema = z.object({ cartId: z.string().uuid() });

app.post("/abandoned-cart", async (c) => {
  const parsed = cartSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
  }
  try {
    return c.json({ success: true, result: await sendAbandonedCart(parsed.data.cartId) });
  } catch (error) {
    console.error("Error sending abandoned cart email:", error);
    return c.json({ error: "Failed to send abandoned cart email" }, 500);
  }
});

export default app;
