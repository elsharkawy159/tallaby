/**
 * Missed orders (0120, ROADMAP.md F-03): pure helpers shared by the
 * storefront capture, the dashboard list and their tests. The server side is
 * checkout-leads.server.ts.
 */
import { normalizeEgyptianPhone } from "../referrals/referrals.lib";

const EG_MOBILE_RE = /^01[0125][0-9]{8}$/;

/** Leads are deleted this many days after they were created. */
export const LEAD_RETENTION_DAYS = 30;
/** The editable WhatsApp message, in characters. */
export const LEAD_TEMPLATE_MAX = 1000;
/** Product names listed in the message before "+N more". */
const MESSAGE_PRODUCTS_MAX = 3;

/** `+20 101 234 5678` → `01012345678`, or null when it is not an Egyptian mobile. */
export function normalizeLeadPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const phone = normalizeEgyptianPhone(input);
  return EG_MOBILE_RE.test(phone) ? phone : null;
}

/** One line of the cart snapshot stored on the lead. */
export type CheckoutLeadItem = {
  productId: string;
  title: string;
  quantity: number;
  /** Unit price, 2 dp decimal string. */
  price: string;
  image: string | null;
};

export const LEAD_PLACEHOLDERS = ["{name}", "{products}", "{total}", "{store}", "{link}"] as const;

export const DEFAULT_LEAD_TEMPLATES: Record<"ar" | "en", string> = {
  ar: "أهلاً {name} 👋\nلاحظنا إنك كنت بتطلب {products} من {store} وما كملتش الطلب. لو محتاج مساعدة أو عندك سؤال إحنا موجودين.\nتقدر تكمل طلبك من هنا: {link}",
  en: "Hi {name} 👋\nWe noticed you were ordering {products} from {store} but didn't finish. If you need help or have a question, we're here.\nYou can complete your order here: {link}",
};

/** The store's saved template, or null for the default (`stores.settings.missedOrders`). */
export function parseLeadTemplate(settings: unknown): string | null {
  const section = (settings as Record<string, unknown> | null | undefined)?.missedOrders;
  const value = (section as Record<string, unknown> | null | undefined)?.whatsappTemplate;
  return typeof value === "string" && value.trim() ? value.slice(0, LEAD_TEMPLATE_MAX) : null;
}

/** "Lamp, Mug and 2 more" style list for the message (localised joiners). */
export function leadProductsText(items: Pick<CheckoutLeadItem, "title">[], locale: "ar" | "en"): string {
  const titles = items.map((i) => i.title.trim()).filter(Boolean);
  const shown = titles.slice(0, MESSAGE_PRODUCTS_MAX);
  const rest = titles.length - shown.length;
  const joined = shown.join(locale === "ar" ? "، " : ", ");
  if (rest <= 0) return joined;
  return locale === "ar" ? `${joined} و${rest} منتجات أخرى` : `${joined} and ${rest} more`;
}

/** Fills the placeholders. Unknown placeholders are left as typed. */
export function renderLeadMessage(
  template: string,
  values: { name: string; products: string; total: string; store: string; link: string },
): string {
  const map: Record<string, string> = {
    "{name}": values.name,
    "{products}": values.products,
    "{total}": values.total,
    "{store}": values.store,
    "{link}": values.link,
  };
  // A function replacer: values may contain "$" and must be inserted as typed.
  return template.replace(/\{(name|products|total|store|link)\}/g, (match) => map[match] ?? match);
}

/** wa.me link for an Egyptian mobile (`010…` → `2010…`) with the message. */
export function leadWhatsAppUrl(phone: string, message: string): string {
  const international = `20${phone.replace(/^0/, "")}`;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}

export const LEAD_RANGES = ["today", "7d", "30d"] as const;
export type LeadRange = (typeof LEAD_RANGES)[number];
export const LEAD_STATUSES = ["all", "open", "contacted"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function parseLeadRange(value: unknown): LeadRange {
  return (LEAD_RANGES as readonly unknown[]).includes(value) ? (value as LeadRange) : "30d";
}

export function parseLeadStatus(value: unknown): LeadStatus {
  return (LEAD_STATUSES as readonly unknown[]).includes(value) ? (value as LeadStatus) : "all";
}
