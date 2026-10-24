import { createElement } from "react";
import { and, db, eq, isNull, sellers, sellerWalletTopUps, stores, users } from "@workspace/db";
import {
  getEmailMessages,
  interpolate,
  resolveEmailLocale,
  SellerLowStockEmail,
  SellerNewOrderEmail,
  SellerOrderCancelledEmail,
  SellerStoreCreatedEmail,
  SellerWalletTopUpEmail,
  type CancelledBy,
  type EmailLocale,
  type TopUpMethod,
} from "@workspace/emails";
import { storeHostname, storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { EMAIL_TYPES } from "../email-delivery";
import { addDays, DASHBOARD_URL, formatDate, formatDateTime, formatMoney, joinUrl, SITE_URL } from "./format";
import { itemsBySeller, lineItem, loadOrderEmailContext, type OrderEmailContext } from "./order-context";
import { sendOnce, type SendOnceResult } from "./send-once";

/**
 * Low-stock line (PLAN.md has no per-product threshold yet): the same fixed
 * threshold the dashboard "needs attention" card uses.
 */
export const LOW_STOCK_THRESHOLD = 10;
/** Ship-by promise shown on a new order: 48 hours. */
const SHIP_WITHIN_DAYS = 2;
const ESTIMATED_DELIVERY_DAYS = 5;

const SETTINGS_URL = joinUrl(DASHBOARD_URL, "/settings");

interface SellerRecipient {
  email: string;
  locale: EmailLocale;
  storeName: string;
}

/** The seller's login email (sellers.id = users.id), else the support address. */
async function loadSeller(sellerId: string, storeId?: string | null): Promise<SellerRecipient | null> {
  const [row] = await db
    .select({
      email: users.email,
      preferredLanguage: users.preferredLanguage,
      supportEmail: sellers.supportEmail,
      displayName: sellers.displayName,
    })
    .from(sellers)
    .innerJoin(users, eq(users.id, sellers.id))
    .where(eq(sellers.id, sellerId))
    .limit(1);
  if (!row) return null;
  const email = row.email?.trim() || row.supportEmail?.trim();
  if (!email) return null;

  // The store the email is about: the order's store, else the seller's primary one.
  const [store] = await db
    .select({ name: stores.name })
    .from(stores)
    .where(
      storeId
        ? and(eq(stores.id, storeId), eq(stores.sellerId, sellerId))
        : and(eq(stores.sellerId, sellerId), eq(stores.isPrimary, true), isNull(stores.deletedAt)),
    )
    .limit(1);

  return {
    email,
    locale: resolveEmailLocale(row.preferredLanguage),
    storeName: store?.name ?? row.displayName ?? "Tallaby",
  };
}

function orderLink(orderId: string): string {
  return joinUrl(DASHBOARD_URL, `/orders?order=${orderId}`);
}

type Sent = Record<string, SendOnceResult>;

/* ------------------------------------------------------------------------ */

/**
 * "New order" to every seller in the order, once per (order, seller). Orders
 * still waiting for an online payment are skipped: the payment webhook calls
 * this again once the order is confirmed.
 */
export async function sendSellerNewOrders(orderId: string): Promise<Sent> {
  const ctx = await loadOrderEmailContext(orderId);
  if (!ctx) return {};
  if (ctx.order.status === "payment_processing" || ctx.order.status === "cancelled") return {};

  const results: Sent = {};
  for (const [sellerId, items] of itemsBySeller(ctx)) {
    const seller = await loadSeller(sellerId, ctx.order.storeId);
    if (!seller) {
      results[sellerId] = { status: "skipped", reason: "no_email" };
      continue;
    }
    const money = (value: string | number | null | undefined) => formatMoney(value, seller.locale, ctx.currency);
    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0);
    const shipping = items.reduce((sum, item) => sum + Number(item.shippingCost ?? 0), 0);
    // A single-seller order carries the whole shipping charge on the order.
    const shippingTotal = itemsBySeller(ctx).size === 1 ? Number(ctx.order.shippingCost ?? 0) : shipping;
    const total = money(subtotal + shippingTotal);
    const copy = getEmailMessages(seller.locale).sellerNewOrder;
    const paymentLabel = sellerPaymentLabel(ctx, seller.locale);

    results[sellerId] = await sendOnce({
      emailType: EMAIL_TYPES.sellerNewOrder,
      referenceId: items[0]!.id,
      recipient: seller.email,
      subject: interpolate(copy.subject, { orderNumber: ctx.order.orderNumber, total }),
      content: createElement(SellerNewOrderEmail, {
        locale: seller.locale,
        storeName: seller.storeName,
        settingsUrl: SETTINGS_URL,
        customerName: ctx.customerName || "—",
        orderNumber: ctx.order.orderNumber,
        placedAt: formatDateTime(ctx.order.createdAt, seller.locale),
        total,
        subtotal: money(subtotal),
        shipping: money(shippingTotal),
        paymentMethod: paymentLabel,
        isCashOnDelivery: ctx.isCashOnDelivery,
        shipBy: ctx.order.isDigitalOnly ? null : formatDate(addDays(ctx.order.createdAt, SHIP_WITHIN_DAYS), seller.locale),
        promisedBy: ctx.order.isDigitalOnly ? null : formatDate(addDays(ctx.order.createdAt, ESTIMATED_DELIVERY_DAYS), seller.locale),
        items: items.map((item) => ({ ...lineItem(ctx, item), price: money(item.subtotal) })),
        shippingAddress: ctx.address,
        links: { order: orderLink(orderId) },
      }),
      metadata: { orderId, sellerId },
    });
  }
  return results;
}

function sellerPaymentLabel(ctx: OrderEmailContext, locale: EmailLocale): string {
  const labels = getEmailMessages(locale).paymentMethods;
  const key = (ctx.order.paymentMethod ?? "").toLowerCase();
  return labels[key] ?? ctx.order.paymentMethod ?? "—";
}

/** "Order cancelled" to the sellers of a cancelled order. A seller who cancelled it themselves is not told. */
export async function sendSellerOrderCancelled(orderId: string, cancelledBy: CancelledBy): Promise<Sent> {
  if (cancelledBy === "seller") return {};
  const ctx = await loadOrderEmailContext(orderId);
  if (!ctx || ctx.order.status !== "cancelled") return {};

  const results: Sent = {};
  for (const [sellerId, items] of itemsBySeller(ctx)) {
    const seller = await loadSeller(sellerId, ctx.order.storeId);
    if (!seller) continue;
    const money = (value: string | number | null | undefined) => formatMoney(value, seller.locale, ctx.currency);
    const value = items.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0);
    results[sellerId] = await sendOnce({
      emailType: EMAIL_TYPES.sellerOrderCancelled,
      referenceId: items[0]!.id,
      recipient: seller.email,
      subject: interpolate(getEmailMessages(seller.locale).sellerOrderCancelled.subject, { orderNumber: ctx.order.orderNumber }),
      content: createElement(SellerOrderCancelledEmail, {
        locale: seller.locale,
        storeName: seller.storeName,
        settingsUrl: SETTINGS_URL,
        orderNumber: ctx.order.orderNumber,
        cancelledAt: formatDateTime(ctx.order.cancelledAt ?? new Date().toISOString(), seller.locale),
        byCustomer: cancelledBy === "customer",
        reason: cancelledBy === "customer" ? ctx.order.notes?.trim() || null : null,
        value: money(value),
        // Every cancel path puts the stock back (ecommerce cancelOrder, shipment status, admin).
        stockRestored: true,
        items: items.map((item) => ({ ...lineItem(ctx, item), price: money(item.subtotal) })),
        links: { order: orderLink(orderId) },
      }),
      metadata: { orderId, sellerId, cancelledBy },
    });
  }
  return results;
}

/**
 * Low-stock alert after an order: lists the seller's items in this order whose
 * stock fell to the threshold or below BECAUSE of this order (it was above
 * before), so a product that stays low doesn't alert on every sale.
 */
export async function sendSellerLowStock(orderId: string): Promise<Sent> {
  const ctx = await loadOrderEmailContext(orderId);
  if (!ctx) return {};

  const results: Sent = {};
  for (const [sellerId, items] of itemsBySeller(ctx)) {
    const low = items
      .map((item) => {
        const tracked = item.variantId ? item.productVariant?.stock : item.product?.quantity;
        if (tracked === null || tracked === undefined) return null;
        const remaining = Number(tracked);
        if (!Number.isFinite(remaining)) return null;
        const crossed = remaining <= LOW_STOCK_THRESHOLD && remaining + item.quantity > LOW_STOCK_THRESHOLD;
        return crossed ? { item, remaining } : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    if (low.length === 0) continue;

    const seller = await loadSeller(sellerId, ctx.order.storeId);
    if (!seller) continue;
    const copy = getEmailMessages(seller.locale).sellerLowStock;
    results[sellerId] = await sendOnce({
      emailType: EMAIL_TYPES.sellerLowStock,
      referenceId: items[0]!.id,
      recipient: seller.email,
      subject: low.length === 1 ? copy.subjectOne : interpolate(copy.subject, { count: low.length }),
      content: createElement(SellerLowStockEmail, {
        locale: seller.locale,
        storeName: seller.storeName,
        settingsUrl: SETTINGS_URL,
        items: low.map(({ item, remaining }) => {
          const line = lineItem(ctx, item);
          return { name: line.name, variant: line.variant, sku: line.sku, imageUrl: line.imageUrl, remaining };
        }),
        links: { products: joinUrl(DASHBOARD_URL, "/products") },
      }),
      metadata: { orderId, sellerId, products: low.map(({ item }) => item.productId) },
    });
  }
  return results;
}

/* ------------------------------------------------------------------------ */

const TOP_UP_METHODS: Record<string, TopUpMethod> = {
  kashier: "card",
  vodafone_cash: "wallet",
  instapay: "instapay",
  bank_transfer: "bank_transfer",
  manual: "manual",
};

/** Store-wallet top-up credited (Kashier card or an approved manual transfer). */
export async function sendSellerWalletTopUp(topUpId: string, balanceAfter?: string | number | null): Promise<SendOnceResult> {
  const [topUp] = await db.select().from(sellerWalletTopUps).where(eq(sellerWalletTopUps.id, topUpId)).limit(1);
  if (!topUp) return { status: "skipped", reason: "not_found" };
  if (topUp.status !== "succeeded") return { status: "skipped", reason: "not_succeeded" };

  const seller = await loadSeller(topUp.sellerId);
  if (!seller) return { status: "skipped", reason: "no_email" };

  let balance = balanceAfter;
  if (balance === undefined || balance === null) {
    const [row] = await db.select({ balance: sellers.walletBalance }).from(sellers).where(eq(sellers.id, topUp.sellerId)).limit(1);
    balance = row?.balance ?? null;
  }
  const money = (value: string | number | null | undefined) => formatMoney(value, seller.locale, topUp.currency);
  const amount = money(topUp.amount);
  const copy = getEmailMessages(seller.locale).sellerWalletTopUp;
  const balanceLabel = balance === null ? amount : money(balance);
  const previous = balance === null ? null : money(Number(balance) - Number(topUp.amount));

  return sendOnce({
    emailType: EMAIL_TYPES.sellerWalletTopUp,
    referenceId: topUp.id,
    recipient: seller.email,
    subject: interpolate(copy.subject, { amount }),
    content: createElement(SellerWalletTopUpEmail, {
      locale: seller.locale,
      storeName: seller.storeName,
      settingsUrl: SETTINGS_URL,
      amount,
      balance: balanceLabel,
      previousBalance: previous,
      reference: (topUp.providerTransactionId ?? topUp.id.slice(0, 8)).toUpperCase(),
      method: TOP_UP_METHODS[topUp.provider] ?? "manual",
      date: formatDate(topUp.updatedAt, seller.locale),
      links: { wallet: joinUrl(DASHBOARD_URL, "/wallet"), topUp: joinUrl(DASHBOARD_URL, "/wallet/top-up") },
    }),
    metadata: { amount: topUp.amount, provider: topUp.provider },
  });
}

/** Onboarding email for a newly created store (signup's primary store or an extra one). */
export async function sendSellerStoreCreated(storeId: string): Promise<SendOnceResult> {
  const [store] = await db
    .select({ id: stores.id, sellerId: stores.sellerId, name: stores.name, subdomain: stores.subdomain })
    .from(stores)
    .where(and(eq(stores.id, storeId), isNull(stores.deletedAt)))
    .limit(1);
  if (!store) return { status: "skipped", reason: "not_found" };

  const seller = await loadSeller(store.sellerId, store.id);
  if (!seller) return { status: "skipped", reason: "no_email" };
  const customDomain = await findActiveCustomDomainForSubdomain(store.subdomain).catch(() => null);

  return sendOnce({
    emailType: EMAIL_TYPES.sellerStoreCreated,
    referenceId: store.id,
    recipient: seller.email,
    subject: getEmailMessages(seller.locale).sellerStoreCreated.subject,
    content: createElement(SellerStoreCreatedEmail, {
      locale: seller.locale,
      storeName: store.name,
      settingsUrl: SETTINGS_URL,
      storeUrl: storeUrl(store.subdomain, customDomain),
      storeHost: storeHostname(store.subdomain, customDomain),
      links: {
        addProduct: joinUrl(DASHBOARD_URL, "/products/add"),
        design: joinUrl(DASHBOARD_URL, `/stores/${store.id}/website/design`),
        help: joinUrl(SITE_URL, "/faq"),
      },
    }),
  });
}
