/**
 * Confirm an order by WhatsApp, no API (ROADMAP.md F-02g). The seller opens
 * wa.me with a prefilled message, the customer answers, and the seller presses
 * the existing "Confirm order" action. The store may save its own template in
 * `stores.settings.orderConfirm.template`; otherwise the default in the
 * store's language is used. Pure, safe on the client.
 */

export const ORDER_CONFIRM_PLACEHOLDERS = ["name", "number", "items", "total", "address", "store"] as const;
export const ORDER_CONFIRM_TEMPLATE_MAX = 1000;
/** A new order not confirmed for this long is highlighted on /orders. */
export const UNCONFIRMED_AFTER_HOURS = 24;

export const ORDER_CONFIRM_DEFAULTS = {
  ar: "أهلًا {name} 👋\nمعاك {store}. وصلنا طلبك رقم #{number}:\n{items}\nالإجمالي: {total}\nالعنوان: {address}\n\nممكن تأكد الطلب بالرد بكلمة \"تأكيد\"؟ شكرًا لك 🙏",
  en: "Hi {name} 👋\nThis is {store}. We received your order #{number}:\n{items}\nTotal: {total}\nAddress: {address}\n\nCould you confirm the order by replying \"Confirm\"? Thank you 🙏",
} as const;

export type OrderConfirmLocale = keyof typeof ORDER_CONFIRM_DEFAULTS;

export interface OrderConfirmSource {
  customerName: string;
  orderNumber: string;
  totalAmount: string;
  lines: { productName: string; variantName: string | null; quantity: number }[];
  address: { line: string; area: string } | null;
}

function money(amount: string, locale: OrderConfirmLocale): string {
  const value = Number(amount);
  const fixed = Number.isFinite(value) ? value.toFixed(2) : amount;
  return locale === "ar" ? `${fixed} ج.م` : `EGP ${fixed}`;
}

/** Fills the template (or the default); unknown `{keys}` stay as typed. */
export function renderOrderConfirmMessage(
  template: string | null,
  input: { order: OrderConfirmSource; storeName: string; locale: OrderConfirmLocale },
): string {
  const { order, storeName, locale } = input;
  const ar = locale === "ar";
  const values: Record<(typeof ORDER_CONFIRM_PLACEHOLDERS)[number], string> = {
    name: order.customerName.trim() || (ar ? "حضرتك" : "there"),
    number: order.orderNumber,
    items: order.lines
      .map((line) => `• ${line.productName}${line.variantName ? ` (${line.variantName})` : ""} × ${line.quantity}`)
      .join("\n"),
    total: money(order.totalAmount, locale),
    address: order.address
      ? [order.address.line, order.address.area].filter(Boolean).join(ar ? "، " : ", ") || "—"
      : "—",
    store: storeName,
  };
  return (template ?? ORDER_CONFIRM_DEFAULTS[locale]).replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key as keyof typeof values] : match,
  );
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
