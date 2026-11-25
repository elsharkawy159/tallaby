/**
 * Meta WhatsApp webhook bodies (docs/whatsapp.md §4). Pure.
 *
 * Call only after verifyMetaSignature passed. The body is parsed leniently:
 * a malformed change or item is dropped, the rest is kept, unknown fields are
 * ignored. Inbound text is data, never instructions, and is capped.
 */
import { z } from "zod";
import { isWhatsAppPhone } from "./phone.lib";
import type { WhatsAppWebhookStatus } from "./events.lib";

export const INBOUND_BODY_MAX = 1000;

export interface StatusUpdate {
  wamid: string;
  status: WhatsAppWebhookStatus;
  /** Unix seconds from Meta, as a Date. */
  at: Date | null;
  recipientPhone: string | null;
  recipientUserId: string | null;
  /** Our whatsapp_messages id (biz_opaque_callback_data). */
  callbackData: string | null;
  pricing: { billable: boolean | null; category: string | null; type: string | null; model: string | null } | null;
  error: { code: number | null; title: string | null; detail: string | null } | null;
}

export interface InboundMessage {
  wamid: string;
  /** The sender's phone (E.164 digits), when Meta sends it. */
  fromPhone: string | null;
  /** The sender's business-scoped user id (BSUID), when Meta sends it. */
  waUserId: string | null;
  type: string;
  at: Date | null;
  /** The wamid of the message this one replies to (a tapped template button). */
  contextWamid: string | null;
  /** Typed text, capped at INBOUND_BODY_MAX. */
  text: string | null;
  /** A template quick-reply tap. */
  button: { payload: string | null; text: string | null } | null;
  profileName: string | null;
}

export type TemplateStatus = "pending" | "approved" | "rejected" | "paused" | "disabled";

export interface TemplateStatusUpdate {
  metaTemplateId: string | null;
  name: string;
  language: string;
  status: TemplateStatus;
  reason: string | null;
}

export interface ParsedWebhook {
  statuses: StatusUpdate[];
  messages: InboundMessage[];
  templateUpdates: TemplateStatusUpdate[];
}

const str = z.string().max(4096);
const optStr = str.nullish();
const idish = z.union([z.string().max(200), z.number()]).transform(String).nullish();

const statusSchema = z.object({
  id: z.string().min(1).max(200),
  status: z.string(),
  timestamp: idish,
  recipient_id: optStr,
  recipient_user_id: optStr,
  biz_opaque_callback_data: optStr,
  pricing: z
    .object({ billable: z.boolean().nullish(), category: optStr, type: optStr, pricing_model: optStr })
    .nullish(),
  errors: z
    .array(
      z.object({
        code: z.number().int().nullish(),
        title: optStr,
        message: optStr,
        error_data: z.object({ details: optStr }).nullish(),
      })
    )
    .nullish(),
});

const messageSchema = z.object({
  id: z.string().min(1).max(200),
  from: optStr,
  from_user_id: optStr,
  type: z.string().min(1).max(50),
  timestamp: idish,
  context: z.object({ id: optStr }).nullish(),
  text: z.object({ body: z.string() }).nullish(),
  button: z.object({ payload: optStr, text: optStr }).nullish(),
});

const contactSchema = z.object({
  wa_id: optStr,
  user_id: optStr,
  profile: z.object({ name: optStr }).nullish(),
});

const messagesValueSchema = z.object({
  contacts: z.array(z.unknown()).nullish(),
  messages: z.array(z.unknown()).nullish(),
  statuses: z.array(z.unknown()).nullish(),
});

const templateValueSchema = z.object({
  event: z.string(),
  message_template_id: idish,
  message_template_name: z.string().min(1).max(512),
  message_template_language: z.string().min(1).max(20),
  reason: optStr,
});

const envelopeSchema = z.object({
  object: z.string().optional(),
  entry: z.array(z.object({ changes: z.array(z.object({ field: z.string(), value: z.unknown() })).nullish() })),
});

const WEBHOOK_STATUSES = new Set<string>(["sent", "delivered", "read", "failed"]);
const TEMPLATE_EVENTS: Record<string, TemplateStatus> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAUSED: "paused",
  DISABLED: "disabled",
};

function toDate(seconds: string | null | undefined): Date | null {
  if (!seconds || !/^\d{1,12}$/.test(seconds)) return null;
  return new Date(Number(seconds) * 1000);
}

function phoneOrNull(value: string | null | undefined): string | null {
  const digits = value?.replace(/^\+/, "") ?? "";
  return isWhatsAppPhone(digits) ? digits : null;
}

function nonEmpty(value: string | null | undefined, max = 200): string | null {
  const clean = value?.trim();
  return clean ? clean.slice(0, max) : null;
}

function capText(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  return value.slice(0, INBOUND_BODY_MAX);
}

function parseStatus(raw: unknown): StatusUpdate | null {
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success || !WEBHOOK_STATUSES.has(parsed.data.status)) return null;
  const s = parsed.data;
  const err = s.errors?.[0];
  return {
    wamid: s.id,
    status: s.status as WhatsAppWebhookStatus,
    at: toDate(s.timestamp),
    recipientPhone: phoneOrNull(s.recipient_id),
    recipientUserId: nonEmpty(s.recipient_user_id),
    callbackData: nonEmpty(s.biz_opaque_callback_data, 512),
    pricing: s.pricing
      ? {
          billable: s.pricing.billable ?? null,
          category: nonEmpty(s.pricing.category, 50)?.toLowerCase() ?? null,
          type: nonEmpty(s.pricing.type, 50)?.toLowerCase() ?? null,
          model: nonEmpty(s.pricing.pricing_model, 50),
        }
      : null,
    error: err
      ? { code: err.code ?? null, title: nonEmpty(err.title, 500), detail: nonEmpty(err.error_data?.details ?? err.message, 2000) }
      : null,
  };
}

function parseMessage(raw: unknown, profiles: Map<string, string>): InboundMessage | null {
  const parsed = messageSchema.safeParse(raw);
  if (!parsed.success) return null;
  const m = parsed.data;
  const fromPhone = phoneOrNull(m.from);
  const waUserId = nonEmpty(m.from_user_id);
  if (!fromPhone && !waUserId) return null;
  return {
    wamid: m.id,
    fromPhone,
    waUserId,
    type: m.type,
    at: toDate(m.timestamp),
    contextWamid: nonEmpty(m.context?.id),
    text: m.type === "text" ? capText(m.text?.body) : null,
    button:
      m.type === "button" && m.button
        ? { payload: nonEmpty(m.button.payload, 1000), text: capText(m.button.text ?? null) }
        : null,
    profileName: (fromPhone && profiles.get(fromPhone)) || (waUserId && profiles.get(waUserId)) || null,
  };
}

/** The status updates, inbound messages and template status changes in a webhook body; null when it isn't one. */
export function parseWhatsAppWebhook(body: unknown): ParsedWebhook | null {
  const envelope = envelopeSchema.safeParse(body);
  if (!envelope.success) return null;
  if (envelope.data.object !== undefined && envelope.data.object !== "whatsapp_business_account") return null;
  const out: ParsedWebhook = { statuses: [], messages: [], templateUpdates: [] };
  for (const entry of envelope.data.entry) {
    for (const change of entry.changes ?? []) {
      if (change.field === "messages") {
        const value = messagesValueSchema.safeParse(change.value);
        if (!value.success) continue;
        const profiles = new Map<string, string>();
        for (const rawContact of value.data.contacts ?? []) {
          const contact = contactSchema.safeParse(rawContact);
          const name = contact.success ? nonEmpty(contact.data.profile?.name, 200) : null;
          if (!contact.success || !name) continue;
          const phone = phoneOrNull(contact.data.wa_id);
          if (phone) profiles.set(phone, name);
          const userId = nonEmpty(contact.data.user_id);
          if (userId) profiles.set(userId, name);
        }
        for (const raw of value.data.statuses ?? []) {
          const status = parseStatus(raw);
          if (status) out.statuses.push(status);
        }
        for (const raw of value.data.messages ?? []) {
          const message = parseMessage(raw, profiles);
          if (message) out.messages.push(message);
        }
      } else if (change.field === "message_template_status_update") {
        const value = templateValueSchema.safeParse(change.value);
        const status = value.success ? TEMPLATE_EVENTS[value.data.event.toUpperCase()] : undefined;
        if (!value.success || !status) continue;
        out.templateUpdates.push({
          metaTemplateId: value.data.message_template_id ?? null,
          name: value.data.message_template_name,
          language: value.data.message_template_language,
          status,
          reason: nonEmpty(value.data.reason, 500),
        });
      }
    }
  }
  return out;
}

/** Arabic letter forms that vary in typing: alef with hamza or madda → bare alef; tatweel and diacritics dropped. */
function normalizeArabic(text: string): string {
  return text
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ـ/g, "")
    .replace(/[ً-ْٰ]/g, "");
}

const OPT_OUT_WORDS = new Set(
  ["stop", "unsubscribe", "إيقاف", "ايقاف", "الغاء الاشتراك", "إلغاء الاشتراك"].map((word) => normalizeArabic(word))
);

/** Whether a whole inbound message (trimmed, any case) is an opt-out request: STOP, إيقاف, إلغاء الاشتراك, unsubscribe. */
export function detectOptOut(text: string | null | undefined): boolean {
  if (typeof text !== "string" || text.length > 100) return false;
  const normalized = normalizeArabic(text.trim().replace(/\s+/g, " ").toLowerCase());
  return OPT_OUT_WORDS.has(normalized);
}

/**
 * Meta's cost of a message in micro-USD from a status webhook's pricing, or
 * null when it isn't paid (a free type, or `billable: false`). `rates` is
 * `whatsapp_settings.meta_rate_micros`.
 */
export function metaCostMicros(
  pricing: StatusUpdate["pricing"],
  rates: Readonly<Record<string, number>>
): number | null {
  if (!pricing?.category) return null;
  const paid = pricing.type ? pricing.type === "regular" : pricing.billable === true;
  if (!paid) return null;
  const rate = rates[pricing.category];
  return typeof rate === "number" && Number.isInteger(rate) && rate >= 0 ? rate : null;
}
