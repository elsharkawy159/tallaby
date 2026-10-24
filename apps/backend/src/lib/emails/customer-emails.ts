import { createElement } from "react";
import { and, cartItems, carts, db, eq, isNull } from "@workspace/db";
import {
  AbandonedCartEmail,
  emailPathPrefix,
  getEmailMessages,
  interpolate,
  OrderCancelledEmail,
  OrderConfirmationEmail,
  OrderDeliveredEmail,
  OrderShippedEmail,
  PLATFORM_BRAND,
  RefundIssuedEmail,
  resolveEmailLocale,
  type CancelledBy,
  type EmailLocale,
  type RefundMethod,
} from "@workspace/emails";
import { formatVariantTitleFromCart, pickProductTitle } from "@workspace/lib/orders";
import { ORDERS_FROM_ADDRESS } from "../resend";
import { EMAIL_TYPES } from "../email-delivery";
import { addDays, formatDate, formatMoney, joinUrl, resolveImageUrl, SITE_URL } from "./format";
import { lineItem, loadOrderEmailContext, type OrderEmailContext } from "./order-context";
import { sendOnce, type SendOnceResult } from "./send-once";
import { loadStoreEmailContext } from "./store-brand";

/** Business-day padding used for the "arrives by" estimate (matches the order page). */
const ESTIMATED_DELIVERY_DAYS = 5;
/** Returns window shown in the delivered email (docs/fulfillment.md). */
const RETURN_WINDOW_DAYS = 14;

const skipped = (reason: string): SendOnceResult => ({ status: "skipped", reason });

/**
 * Sender for customer order mail: a storefront order goes out under the
 * store's name, with replies to the store's support address when it has one.
 */
function customerSender(ctx: OrderEmailContext) {
  return {
    from: ORDERS_FROM_ADDRESS,
    ...(ctx.store ? { fromName: ctx.store.name } : {}),
    replyTo: ctx.store && ctx.brand.supportEmail !== PLATFORM_BRAND.supportEmail ? ctx.brand.supportEmail : ORDERS_FROM_ADDRESS,
  };
}

function customer(ctx: OrderEmailContext) {
  return { name: ctx.customerName || (ctx.locale === "ar" ? "عميلنا" : "there"), email: ctx.recipient! };
}

function estimatedDelivery(ctx: OrderEmailContext): string | null {
  if (ctx.order.isDigitalOnly) return null;
  if (ctx.shipment?.estimatedDeliveryDate) return formatDate(ctx.shipment.estimatedDeliveryDate, ctx.locale);
  return formatDate(addDays(ctx.order.createdAt, ESTIMATED_DELIVERY_DAYS), ctx.locale);
}

/* ------------------------------------------------------------------------ */

export async function buildOrderConfirmation(orderId: string) {
  const ctx = await loadOrderEmailContext(orderId);
  if (!ctx) return { ok: false as const, status: 404 as const, error: "Order not found" };
  if (!ctx.recipient) return { ok: false as const, status: 422 as const, error: "Customer has no email address on file" };

  const discount = Number(ctx.order.discountAmount ?? 0);
  const props = {
    locale: ctx.locale,
    brand: ctx.brand,
    customer: customer(ctx),
    order: {
      orderNumber: ctx.order.orderNumber,
      orderDate: formatDate(ctx.order.createdAt, ctx.locale),
      estimatedDelivery: estimatedDelivery(ctx),
    },
    items: ctx.order.orderItems.map((item) => {
      const line = lineItem(ctx, item);
      return {
        productName: line.name,
        variantName: line.variant ?? null,
        sellerName: line.sellerName ?? null,
        quantity: item.quantity,
        unitPrice: ctx.money(item.price),
        lineTotal: line.price ?? "",
        imageUrl: line.imageUrl ?? null,
      };
    }),
    pricing: {
      subtotal: ctx.money(ctx.order.subtotal),
      shipping: ctx.money(ctx.order.shippingCost),
      discount: discount > 0 ? ctx.money(discount) : null,
      couponCode: ctx.order.couponCode ?? null,
      total: ctx.money(ctx.order.totalAmount),
    },
    paymentMethod: ctx.paymentMethod,
    isCashOnDelivery: ctx.isCashOnDelivery,
    shippingAddress: ctx.order.userAddress_shippingAddressId
      ? {
          fullName: ctx.order.userAddress_shippingAddressId.fullName,
          addressLine1: ctx.order.userAddress_shippingAddressId.addressLine1,
          addressLine2: ctx.order.userAddress_shippingAddressId.addressLine2,
          city: ctx.order.userAddress_shippingAddressId.city,
          state: ctx.order.userAddress_shippingAddressId.state,
          postalCode: ctx.order.userAddress_shippingAddressId.postalCode,
          country: ctx.order.userAddress_shippingAddressId.country,
          phone: ctx.order.userAddress_shippingAddressId.phone,
        }
      : null,
    links: { viewOrder: ctx.orderUrl },
  };
  return {
    ok: true as const,
    ctx,
    recipient: ctx.recipient,
    subject: interpolate(getEmailMessages(ctx.locale).orderConfirmation.subject, { orderNumber: ctx.order.orderNumber }),
    content: createElement(OrderConfirmationEmail, props),
    sender: customerSender(ctx),
  };
}

/* ------------------------------------------------------------------------ */

export async function sendOrderShipped(orderId: string): Promise<SendOnceResult> {
  const ctx = await loadOrderEmailContext(orderId);
  if (!ctx) return skipped("not_found");
  if (!ctx.recipient) return skipped("no_email");
  if (ctx.order.status === "cancelled") return skipped("cancelled");

  return sendOnce({
    emailType: EMAIL_TYPES.orderShipped,
    referenceId: orderId,
    recipient: ctx.recipient,
    subject: interpolate(getEmailMessages(ctx.locale).orderShipped.subject, { orderNumber: ctx.order.orderNumber }),
    content: createElement(OrderShippedEmail, {
      locale: ctx.locale,
      brand: ctx.brand,
      customer: customer(ctx),
      orderNumber: ctx.order.orderNumber,
      carrier: ctx.shipment?.carrier && ctx.shipment.carrier !== "seller" ? ctx.shipment.carrier : null,
      trackingNumber: ctx.shipment?.trackingNumber ?? null,
      estimatedDelivery: estimatedDelivery(ctx),
      items: ctx.order.orderItems.map((item) => lineItem(ctx, item)),
      shippingAddress: ctx.address,
      paymentMethod: ctx.paymentMethod,
      amountDue: ctx.isCashOnDelivery ? ctx.money(ctx.order.totalAmount) : null,
      links: { trackOrder: ctx.orderUrl },
    }),
    ...customerSender(ctx),
  });
}

export async function sendOrderDelivered(orderId: string): Promise<SendOnceResult> {
  const ctx = await loadOrderEmailContext(orderId);
  if (!ctx) return skipped("not_found");
  if (!ctx.recipient) return skipped("no_email");
  if (ctx.order.status !== "delivered") return skipped("not_delivered");

  const deliveredAt = ctx.order.deliveredAt ?? ctx.shipment?.deliveredAt ?? new Date().toISOString();
  return sendOnce({
    emailType: EMAIL_TYPES.orderDelivered,
    referenceId: orderId,
    recipient: ctx.recipient,
    subject: interpolate(getEmailMessages(ctx.locale).orderDelivered.subject, { orderNumber: ctx.order.orderNumber }),
    content: createElement(OrderDeliveredEmail, {
      locale: ctx.locale,
      brand: ctx.brand,
      customer: customer(ctx),
      orderNumber: ctx.order.orderNumber,
      deliveredDate: formatDate(deliveredAt, ctx.locale),
      items: ctx.order.orderItems.map((item) => {
        const line = lineItem(ctx, item);
        return {
          name: line.name,
          imageUrl: line.imageUrl,
          sellerName: ctx.store ? null : line.sellerName,
          // The order page opens this item's review form (`?review=`); the stars add `&rating=`.
          reviewUrl: item.isReviewed ? null : `${ctx.orderUrl}&review=${item.id}#review-item-${item.id}`,
        };
      }),
      returnWindowDays: RETURN_WINDOW_DAYS,
      links: {
        order: ctx.orderUrl,
        returns: joinUrl(ctx.siteUrl, `${emailPathPrefix(ctx.locale)}/returns`),
      },
    }),
    ...customerSender(ctx),
  });
}

export async function sendOrderCancelled(orderId: string, cancelledBy: CancelledBy): Promise<SendOnceResult> {
  const ctx = await loadOrderEmailContext(orderId);
  if (!ctx) return skipped("not_found");
  if (!ctx.recipient) return skipped("no_email");
  if (ctx.order.status !== "cancelled") return skipped("not_cancelled");

  const paid = ctx.order.paymentStatus === "paid" || ctx.order.paymentStatus === "refunded" || Boolean(ctx.order.paidAt);
  return sendOnce({
    emailType: EMAIL_TYPES.orderCancelled,
    referenceId: orderId,
    recipient: ctx.recipient,
    subject: interpolate(getEmailMessages(ctx.locale).orderCancelled.subject, { orderNumber: ctx.order.orderNumber }),
    content: createElement(OrderCancelledEmail, {
      locale: ctx.locale,
      brand: ctx.brand,
      customer: customer(ctx),
      orderNumber: ctx.order.orderNumber,
      cancelledDate: formatDate(ctx.order.cancelledAt ?? new Date().toISOString(), ctx.locale),
      cancelledBy,
      // The customer cancel action stores the customer's reason in `notes`.
      reason: cancelledBy === "customer" ? ctx.order.notes?.trim() || null : null,
      payment: paid
        ? { kind: "refund" as const, amount: ctx.money(ctx.order.totalAmount) }
        : ctx.isCashOnDelivery
          ? { kind: "cod" as const }
          : null,
      items: ctx.order.orderItems.map((item) => lineItem(ctx, item)),
      links: { shop: ctx.store?.url ?? SITE_URL },
    }),
    ...customerSender(ctx),
  });
}

export async function sendRefundIssued(
  orderId: string,
  refund: { method: RefundMethod; amount?: string | number | null },
): Promise<SendOnceResult> {
  const ctx = await loadOrderEmailContext(orderId);
  if (!ctx) return skipped("not_found");
  if (!ctx.recipient) return skipped("no_email");

  const amount = ctx.money(refund.amount ?? ctx.order.totalAmount);
  return sendOnce({
    emailType: EMAIL_TYPES.refundIssued,
    referenceId: orderId,
    recipient: ctx.recipient,
    subject: interpolate(getEmailMessages(ctx.locale).refundIssued.subject, { amount, orderNumber: ctx.order.orderNumber }),
    content: createElement(RefundIssuedEmail, {
      locale: ctx.locale,
      brand: ctx.brand,
      customer: customer(ctx),
      orderNumber: ctx.order.orderNumber,
      amount,
      method: refund.method,
      date: formatDate(new Date(), ctx.locale),
      items: ctx.order.orderItems.map((item) => {
        const line = lineItem(ctx, item);
        return { name: line.name, imageUrl: line.imageUrl, amount: line.price };
      }),
      links: {
        wallet: refund.method === "wallet" ? joinUrl(ctx.siteUrl, `${emailPathPrefix(ctx.locale)}/profile/wallet`) : null,
        order: ctx.orderUrl,
      },
    }),
    metadata: { method: refund.method, amount: refund.amount ?? null },
    ...customerSender(ctx),
  });
}

/* ------------------------------------------------------------------------ */

/**
 * Reminder for a cart left with items. Skips customers who opted out of
 * marketing mail, guests and empty carts; marks the cart reminded
 * (`reminder_sent_at`) so the admin pending-carts view shows it.
 */
export async function sendAbandonedCart(cartId: string): Promise<SendOnceResult> {
  const cart = await db.query.carts.findFirst({
    where: and(eq(carts.id, cartId), eq(carts.status, "active"), isNull(carts.reminderSentAt)),
    with: {
      user: { columns: { email: true, preferredLanguage: true, receiveMarketingEmails: true, isGuest: true } },
      cartItems: {
        where: eq(cartItems.savedForLater, false),
        with: {
          product: {
            columns: { images: true, sku: true },
            with: { productTranslations: { columns: { locale: true, title: true } } },
          },
        },
      },
    },
  });
  if (!cart) return skipped("not_found");
  const recipient = cart.user?.email?.trim();
  if (!recipient || cart.user?.isGuest) return skipped("no_email");
  if (cart.user?.receiveMarketingEmails === false) return skipped("opted_out");
  if (cart.cartItems.length === 0) return skipped("empty");

  let locale: EmailLocale = resolveEmailLocale(cart.user?.preferredLanguage);
  let store = cart.storeId ? await loadStoreEmailContext(cart.storeId, locale) : null;
  if (!cart.user?.preferredLanguage && store?.defaultLocale && store.defaultLocale !== locale) {
    locale = store.defaultLocale;
    store = await loadStoreEmailContext(store.storeId, locale);
  }
  const currency = cart.currency || "EGP";
  const subtotal = cart.cartItems.reduce((sum, item) => sum + Number(item.price ?? 0) * item.quantity, 0);
  const siteUrl = store?.url ?? SITE_URL;

  const result = await sendOnce({
    emailType: EMAIL_TYPES.abandonedCart,
    referenceId: cartId,
    recipient,
    subject: getEmailMessages(locale).abandonedCart.subject,
    content: createElement(AbandonedCartEmail, {
      locale,
      brand: store?.brand ?? PLATFORM_BRAND,
      items: cart.cartItems.map((item) => {
        const variant = item.variant as { title?: string | null; option1?: string | null; option2?: string | null; option3?: string | null; image?: string | null } | null;
        return {
          name: pickProductTitle(item.product?.productTranslations, locale, item.product?.sku, item.productId),
          variant: formatVariantTitleFromCart(variant),
          quantity: item.quantity,
          price: formatMoney(Number(item.price ?? 0) * item.quantity, locale, currency),
          imageUrl: resolveImageUrl(variant?.image) ?? resolveImageUrl(item.product?.images),
        };
      }),
      subtotal: formatMoney(subtotal, locale, currency),
      links: { cart: joinUrl(siteUrl, `${emailPathPrefix(locale)}/cart`) },
    }),
    from: ORDERS_FROM_ADDRESS,
    ...(store ? { fromName: store.name } : {}),
  });

  if (result.status === "sent") {
    await db.update(carts).set({ reminderSentAt: new Date().toISOString() }).where(eq(carts.id, cartId));
  }
  return result;
}
