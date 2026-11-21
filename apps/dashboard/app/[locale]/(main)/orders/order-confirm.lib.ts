/**
 * Confirm an order by WhatsApp, no API (ROADMAP.md F-02g). The seller opens
 * wa.me with a prefilled message, the customer answers, and the seller presses
 * the existing "Confirm order" action. The store may save its own template in
 * `stores.settings.orderConfirm.template`; otherwise the default in the
 * store's language is used. An order past "new" gets the same details without
 * the "please confirm" line (`renderOrderDetailsMessage`). Pure, safe on the client.
 */

import { DEFAULT_CURRENCY } from "@workspace/lib";

export const ORDER_CONFIRM_PLACEHOLDERS = [
  "name",
  "number",
  "items",
  "subtotal",
  "shipping",
  "discount_line",
  "total",
  "address",
  "store",
] as const;
export const ORDER_CONFIRM_TEMPLATE_MAX = 1000;
/** A new order not confirmed for this long is highlighted on /orders. */
export const UNCONFIRMED_AFTER_HOURS = 24;

/**
 * The order's details (WhatsApp `*bold*`), sent as is for an order that no
 * longer needs confirming. `{discount_line}` is a whole line, or nothing.
 */
export const ORDER_DETAILS_DEFAULTS = {
  ar: "*{store}*\n\nمرحباً *{name}*\n\nتفاصيل طلبك رقم #{number}\n\nالمنتجات المطلوبة:\n{items}\n\n*ملخص الفاتورة:*\nالمجموع الفرعي: {subtotal}\nرسوم التوصيل: {shipping}\n{discount_line}الإجمالي: *{total}*\n\n*عنوان التوصيل:*\n{address}",
  en: "*{store}*\n\nHello *{name}*\n\nYour order #{number} details\n\nItems:\n{items}\n\n*Invoice summary:*\nSubtotal: {subtotal}\nDelivery fee: {shipping}\n{discount_line}Total: *{total}*\n\n*Delivery address:*\n{address}",
} as const;

const ORDER_CONFIRM_REQUEST = {
  ar: "من فضلك أكد الطلب بالرد بكلمة *نعم*",
  en: "Please confirm the order by replying *Yes*",
} as const;

/** The details plus the "please confirm" line: the default for a new order. */
export const ORDER_CONFIRM_DEFAULTS: Record<keyof typeof ORDER_DETAILS_DEFAULTS, string> = {
  ar: `${ORDER_DETAILS_DEFAULTS.ar}\n\n${ORDER_CONFIRM_REQUEST.ar}`,
  en: `${ORDER_DETAILS_DEFAULTS.en}\n\n${ORDER_CONFIRM_REQUEST.en}`,
};

export type OrderConfirmLocale = keyof typeof ORDER_DETAILS_DEFAULTS;

export interface OrderConfirmSource {
  customerName: string;
  orderNumber: string;
  subtotal: string;
  shippingCost: string;
  discountAmount: string;
  totalAmount: string;
  /** The order's currency; missing means EGP. */
  currency?: string | null;
  lines: { productName: string; variantName: string | null; quantity: number }[];
  address: { line: string; area: string } | null;
}

/** A WhatsApp message is plain text: the amount, then the ISO code ("1750.00 EGP"). */
function money(amount: string, currency?: string | null): string {
  const value = Number(amount);
  const fixed = Number.isFinite(value) ? value.toFixed(2) : amount;
  return `${fixed} ${(currency || DEFAULT_CURRENCY).toUpperCase()}`;
}

/** Fills the template (or the default); unknown `{keys}` stay as typed. */
export function renderOrderConfirmMessage(
  template: string | null,
  input: { order: OrderConfirmSource; storeName: string; locale: OrderConfirmLocale },
): string {
  const { order, storeName, locale } = input;
  const ar = locale === "ar";
  const discount = Number(order.discountAmount);
  const values: Record<(typeof ORDER_CONFIRM_PLACEHOLDERS)[number], string> = {
    name: order.customerName.trim() || (ar ? "حضرتك" : "there"),
    number: order.orderNumber,
    items: order.lines
      .map((line) => `- ${line.productName}${line.variantName ? ` - ${line.variantName}` : ""} x${line.quantity}`)
      .join("\n"),
    subtotal: money(order.subtotal, order.currency),
    shipping: money(order.shippingCost, order.currency),
    discount_line:
      Number.isFinite(discount) && discount > 0
        ? `${ar ? "الخصم" : "Discount"}: -${money(order.discountAmount, order.currency)}\n`
        : "",
    total: money(order.totalAmount, order.currency),
    address: order.address ? [order.address.line, order.address.area].filter(Boolean).join(" , ") || "—" : "—",
    store: storeName,
  };
  return (template ?? ORDER_CONFIRM_DEFAULTS[locale]).replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key as keyof typeof values] : match,
  );
}

/** The default details message without the "please confirm" line, for an order past "new". */
export function renderOrderDetailsMessage(input: {
  order: OrderConfirmSource;
  storeName: string;
  locale: OrderConfirmLocale;
}): string {
  return renderOrderConfirmMessage(ORDER_DETAILS_DEFAULTS[input.locale], input);
}

/** The template saved in `stores.settings`, or null for the default. */
export function parseOrderConfirmTemplate(settings: unknown): string | null {
  const block = (settings as { orderConfirm?: unknown } | null)?.orderConfirm;
  const template = (block as { template?: unknown } | null | undefined)?.template;
  if (typeof template !== "string") return null;
  const trimmed = template.trim();
  return trimmed ? trimmed.slice(0, ORDER_CONFIRM_TEMPLATE_MAX) : null;
}

/** Whole hours a "new" order has waited, once past the limit; else null. */
export function unconfirmedHours(stage: string, createdAt: string, now: number = Date.now()): number | null {
  if (stage !== "new") return null;
  const hours = Math.floor((now - Date.parse(createdAt)) / 3_600_000);
  return Number.isFinite(hours) && hours >= UNCONFIRMED_AFTER_HOURS ? hours : null;
}
