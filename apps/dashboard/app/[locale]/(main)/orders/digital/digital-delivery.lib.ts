/**
 * Digital delivery on the seller's order screen (ROADMAP.md F-108d). A digital
 * order paid online gets its links from the payment webhook; one paid by a
 * transfer the seller checks (InstaPay, a mobile wallet) waits for the seller
 * to press "Payment received". The seller then sends the one-time link on
 * WhatsApp (a wa.me link, no API) or makes a new one. Pure, safe on the client:
 * the links themselves only ever come from the server, on a click.
 */

import { isManualPaymentMethodValue, parseWalletPartialPaymentMethod } from "@workspace/lib/orders/payment";
import { buildWhatsAppUrl } from "@workspace/ui/lib/contact";

/** How one purchased item's link stands. `pending` = manual delivery, never sent yet. */
export type DigitalLinkStatus = "ready" | "downloaded" | "expired" | "revoked" | "pending";

/**
 * Where the order's digital part is:
 * - `awaiting_payment`: a transfer the seller confirms ("Payment received");
 * - `awaiting_online_payment`: a card or Tallaby Pay payment not in yet;
 * - `missing_links`: paid, but some digital line has no link ("Create links");
 * - `ready`: every digital line has a link;
 * - `closed`: cancelled or refunded, nothing to send.
 */
export type DigitalPanelStage = "awaiting_payment" | "awaiting_online_payment" | "missing_links" | "ready" | "closed";

/** What a line's buttons do; the WhatsApp message covers every ready line at once. */
export type DigitalLinkAction = "copy" | "new_link" | "email_new_link";

export interface DigitalLinkRow {
  fulfillmentStatus: string;
  downloadCount: number | null;
  maxDownloads: number | null;
  expiresAt: string | null;
}

/** Methods paid outside Tallaby that only the seller can confirm (no webhook). */
const SELLER_CONFIRMED_METHODS: readonly string[] = ["bank_transfer"];

export function isSellerConfirmedPaymentMethod(method: string | null | undefined): boolean {
  if (!method) return false;
  return (
    isManualPaymentMethodValue(method) ||
    parseWalletPartialPaymentMethod(method) != null ||
    SELLER_CONFIRMED_METHODS.includes(method)
  );
}

const CLOSED_ORDER_STATUSES: readonly string[] = ["cancelled", "refund_requested", "refunded", "returned"];

export function isPaymentSettled(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === "paid" || paymentStatus === "collected";
}

/**
 * "ready" is the rule of isDigitalLinkUsable (@workspace/lib/digital/access),
 * repeated because that module needs Node's crypto and this one runs in the
 * browser too; digital-delivery.lib.test.ts holds the two equal.
 */
export function digitalLinkStatus(row: DigitalLinkRow, now: Date = new Date()): DigitalLinkStatus {
  const status = row.fulfillmentStatus;
  if (status === "revoked") return "revoked";
  if (status === "pending" || status === "failed") return "pending";
  const max = row.maxDownloads ?? 0;
  const usedUp = max > 0 && (row.downloadCount ?? 0) >= max;
  const expired = Boolean(row.expiresAt) && Date.parse(row.expiresAt!) <= now.getTime();
  if ((status === "delivered" || status === "downloaded") && !usedUp && !expired) return "ready";
  return usedUp ? "downloaded" : "expired";
}

export function resolveDigitalPanelStage(input: {
  orderStatus: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  /** Digital lines that can get a link (the product still has its digital setup). */
  deliverableLines: number;
  /** Of those, the lines that already have a link. */
  linkedLines: number;
}): DigitalPanelStage {
  if (CLOSED_ORDER_STATUSES.includes(input.orderStatus ?? "")) return "closed";
  if (!isPaymentSettled(input.paymentStatus)) {
    if (input.orderStatus === "payment_processing" || !isSellerConfirmedPaymentMethod(input.paymentMethod)) {
      return "awaiting_online_payment";
    }
    return "awaiting_payment";
  }
  return input.linkedLines < input.deliverableLines ? "missing_links" : "ready";
}

/** A line's buttons. A used link can't be sent again: only a new one can. */
export function digitalLinkActions(status: DigitalLinkStatus, options: { hasEmail: boolean }): DigitalLinkAction[] {
  if (status === "revoked") return [];
  const actions: DigitalLinkAction[] = status === "ready" ? ["copy", "new_link"] : ["new_link"];
  if (options.hasEmail) actions.push("email_new_link");
  return actions;
}

export type DigitalMessageLocale = "ar" | "en";

export interface DigitalMessageLink {
  productName: string;
  url: string;
  expiresAt: string | null;
}

/** "27 November 2026" in Cairo time, Western digits in both languages (a WhatsApp message is plain text). */
export function formatLinkDate(iso: string, locale: DigitalMessageLocale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));
}

const MESSAGE = {
  ar: {
    hello: (name: string) => `مرحباً *${name}*`,
    fallbackName: "حضرتك",
    thanks: (store: string, many: boolean) =>
      `شكراً لطلبك من *${store}*. ${many ? "هذه روابط تحميل طلبك:" : "هذا رابط تحميل طلبك:"}`,
    rule: (date: string | null, many: boolean) =>
      many
        ? `كل رابط يعمل مرة واحدة فقط${date ? `، وتنتهي الروابط في ${date}` : ""}.`
        : `الرابط يعمل مرة واحدة فقط${date ? `، وينتهي في ${date}` : ""}.`,
  },
  en: {
    hello: (name: string) => `Hello *${name}*`,
    fallbackName: "there",
    thanks: (store: string, many: boolean) =>
      `Thanks for your order from *${store}*. ${many ? "Here are your download links:" : "Here is your download link:"}`,
    rule: (date: string | null, many: boolean) =>
      many
        ? `Each link works once${date ? ` and expires on ${date}` : ""}.`
        : `The link works once${date ? ` and expires on ${date}` : ""}.`,
  },
} as const;

/**
 * The WhatsApp message with every link, in the customer's language. The date
 * is the earliest expiry, so the message never promises more time than a link has.
 */
export function buildDigitalWhatsAppMessage(input: {
  locale: DigitalMessageLocale;
  customerName: string;
  storeName: string;
  links: readonly DigitalMessageLink[];
}): string {
  const copy = MESSAGE[input.locale];
  const many = input.links.length > 1;
  const earliest = input.links
    .map((link) => link.expiresAt)
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value!)))
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0];
  const items = input.links.map((link) => `*${link.productName.trim()}*\n${link.url}`).join("\n\n");
  return [
    copy.hello(input.customerName.trim() || copy.fallbackName),
    copy.thanks(input.storeName.trim(), many),
    items,
    copy.rule(earliest ? formatLinkDate(earliest, input.locale) : null, many),
  ].join("\n\n");
}

/** The wa.me link (same phone rules as the order's other WhatsApp buttons); null without a usable phone or link. */
export function buildDigitalWhatsAppUrl(
  phone: string | null | undefined,
  input: Parameters<typeof buildDigitalWhatsAppMessage>[0],
): string | null {
  if (input.links.length === 0) return null;
  return buildWhatsAppUrl(phone, buildDigitalWhatsAppMessage(input));
}
