/**
 * WhatsApp order messages: the pure rules the enqueue, dispatch and webhook
 * steps share (docs/whatsapp.md §2, §4). Pure, no I/O.
 *
 * - consent: `orders.metadata.whatsapp` (written by checkout)
 * - the message locale, the total in the order currency, the carrier label
 * - the send gates (§4 Gates), as one function returning the first that fails
 * - the opt-out rule (global per phone; a later checkout tick opts back in)
 * - the short free-form replies sent after a button tap or STOP
 */
import { WHATSAPP_EVENTS, isWhatsAppLocale, type WhatsAppEvent, type WhatsAppLocale } from "./events.lib";

// ── Consent and locale ───────────────────────────────────────────────────

export interface WhatsAppConsent {
  optIn: boolean;
  locale: WhatsAppLocale | null;
  /** When the shopper ticked the box, as an ISO string. */
  at: string | null;
}

/** `orders.metadata.whatsapp`: `{ optIn: true, locale, consentVersion, at }`. Anything else means no consent. */
export function readWhatsAppConsent(metadata: unknown): WhatsAppConsent {
  const wa =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>).whatsapp
      : null;
  if (!wa || typeof wa !== "object" || Array.isArray(wa)) return { optIn: false, locale: null, at: null };
  const w = wa as Record<string, unknown>;
  const at = typeof w.at === "string" && !Number.isNaN(Date.parse(w.at)) ? w.at : null;
  return { optIn: w.optIn === true, locale: isWhatsAppLocale(w.locale) ? w.locale : null, at };
}

/** The shopper's checkout locale, else the store's default language, else Arabic. */
export function resolveWhatsAppLocale(consentLocale: unknown, storeDefaultLocale: unknown): WhatsAppLocale {
  if (isWhatsAppLocale(consentLocale)) return consentLocale;
  if (isWhatsAppLocale(storeDefaultLocale)) return storeDefaultLocale;
  return "ar";
}

// ── Template values ──────────────────────────────────────────────────────

/** The order total in its currency, the way order emails write it (`ar-EG` / `en-EG`, up to 2 decimals). */
export function formatWhatsAppTotal(
  amount: string | number | null | undefined,
  currency: string | null | undefined,
  locale: WhatsAppLocale
): string {
  const value = Number(amount ?? 0);
  const code = typeof currency === "string" && /^[A-Z]{3}$/.test(currency) ? currency : "EGP";
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${code} ${Number.isFinite(value) ? value : 0}`;
  }
}

const CARRIER_LABELS: Record<string, string> = { bosta: "Bosta" };

/** The shipment's carrier for the shipped template; the seller's own delivery reads "the store". */
export function whatsAppCarrierLabel(carrier: string | null | undefined, locale: WhatsAppLocale): string {
  const key = (carrier ?? "").trim().toLowerCase();
  if (!key || key === "seller") return locale === "ar" ? "المتجر" : "The store";
  return CARRIER_LABELS[key] ?? carrier!.trim();
}

// ── Gates ────────────────────────────────────────────────────────────────

export interface WhatsAppGlobalSettings {
  enabled: boolean;
  storesDefaultOn: boolean;
  eventsEnabled: readonly string[];
  metaRateMicros: Readonly<Record<string, number>>;
  sellerPriceUsdCents: number;
}

export interface StoreWhatsAppRow {
  enabled: boolean;
  events: readonly string[];
}

/** A store's effective WhatsApp settings: its own row, else the admin default (on/off, every event). */
export function effectiveStoreWhatsApp(
  row: StoreWhatsAppRow | null | undefined,
  settings: Pick<WhatsAppGlobalSettings, "storesDefaultOn">
): StoreWhatsAppRow {
  if (row) return { enabled: row.enabled, events: row.events };
  return { enabled: settings.storesDefaultOn, events: [...WHATSAPP_EVENTS] };
}

export interface WhatsAppContactState {
  optedInAt: string | null;
  optedOutAt: string | null;
}

/**
 * Whether the phone is opted out. Opt-out is global; it is lifted only by a
 * later opt-in (the contact's `opted_in_at`, or this order's checkout tick).
 */
export function isWhatsAppOptedOut(contact: WhatsAppContactState | null | undefined, consentAt?: string | null): boolean {
  if (!contact?.optedOutAt) return false;
  const out = Date.parse(contact.optedOutAt);
  if (Number.isNaN(out)) return false;
  const ins = [contact.optedInAt, consentAt ?? null].map((v) => (v ? Date.parse(v) : NaN)).filter((v) => !Number.isNaN(v));
  return !ins.some((v) => v > out);
}

export type WhatsAppSkipReason =
  | "not_configured"
  | "disabled"
  | "event_disabled"
  | "order_not_found"
  | "no_store"
  | "test_order"
  | "awaiting_payment"
  | "store_disabled"
  | "store_event_disabled"
  | "no_consent"
  | "invalid_phone"
  | "opted_out"
  | "by_customer";

export interface WhatsAppGateInput {
  configured: boolean;
  settings: WhatsAppGlobalSettings | null;
  event: WhatsAppEvent;
  order: { storeId: string | null; isTest: boolean; status: string | null } | null;
  store: StoreWhatsAppRow | null;
  consent: WhatsAppConsent;
  phone: string | null;
  contact: WhatsAppContactState | null;
  /** The shopper confirmed or cancelled by button: they get a free reply instead (§2). */
  byCustomerButton?: boolean;
}

/** The first gate (docs/whatsapp.md §4) that fails, or null when the message may be queued. */
export function whatsAppGateFailure(input: WhatsAppGateInput): WhatsAppSkipReason | null {
  if (!input.configured) return "not_configured";
  if (!input.settings?.enabled) return "disabled";
  if (!input.settings.eventsEnabled.includes(input.event)) return "event_disabled";
  if (input.byCustomerButton && (input.event === "order_confirmed" || input.event === "order_cancelled")) return "by_customer";
  if (!input.order) return "order_not_found";
  if (!input.order.storeId) return "no_store";
  if (input.order.isTest) return "test_order";
  if (input.event === "order_placed" && input.order.status === "payment_processing") return "awaiting_payment";
  if (!input.store?.enabled) return "store_disabled";
  if (!input.store.events.includes(input.event)) return "store_event_disabled";
  if (!input.consent.optIn) return "no_consent";
  if (!input.phone) return "invalid_phone";
  if (isWhatsAppOptedOut(input.contact, input.consent.at)) return "opted_out";
  return null;
}

// ── Replies (free-form, inside the 24 h window a tap opens) ──────────────

export type WhatsAppReplyKind =
  | "confirmed"
  | "cancelled"
  | "already_confirmed"
  | "already_cancelled"
  | "refused"
  | "opted_out";

function oneLine(value: string | null | undefined, max: number): string {
  const clean = (value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/** The reply text for an outcome, in the message's language. */
export function whatsAppReplyText(
  kind: WhatsAppReplyKind,
  locale: WhatsAppLocale,
  vars: { orderNumber?: string | null; storeName?: string | null } = {}
): string {
  const n = oneLine(vars.orderNumber, 30) || "-";
  const store = oneLine(vars.storeName, 60) || (locale === "ar" ? "المتجر" : "the store");
  if (locale === "ar") {
    switch (kind) {
      case "confirmed":
        return `تم تأكيد طلبك رقم ${n} من متجر ${store}. سيبدأ المتجر في تجهيزه، وسنرسل لك رسالة عند شحنه.`;
      case "cancelled":
        return `تم إلغاء طلبك رقم ${n} من متجر ${store}.`;
      case "already_confirmed":
        return `طلبك رقم ${n} من متجر ${store} مؤكد بالفعل.`;
      case "already_cancelled":
        return `طلبك رقم ${n} من متجر ${store} ملغي بالفعل.`;
      case "refused":
        return `لا يمكن تغيير طلبك رقم ${n} من هنا الآن، لأن حالته تغيّرت. من فضلك تواصل مع متجر ${store} مباشرة.`;
      case "opted_out":
        return "تم إيقاف رسائل طلبي على هذا الرقم. لن نرسل لك تحديثات الطلبات بعد الآن، ويمكنك تفعيلها مرة أخرى عند طلبك القادم.";
    }
  }
  switch (kind) {
    case "confirmed":
      return `Your order ${n} from ${store} is confirmed. The store will start preparing it, and we will message you when it ships.`;
    case "cancelled":
      return `Your order ${n} from ${store} has been cancelled.`;
    case "already_confirmed":
      return `Your order ${n} from ${store} is already confirmed.`;
    case "already_cancelled":
      return `Your order ${n} from ${store} is already cancelled.`;
    case "refused":
      return `Your order ${n} can't be changed from here now, because its status has changed. Please contact ${store} directly.`;
    case "opted_out":
      return "You won't get Tallaby order updates on this number anymore. You can turn them on again with your next order.";
  }
}
