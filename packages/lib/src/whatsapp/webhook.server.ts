/**
 * Meta WhatsApp webhook processing (docs/whatsapp.md §4). Backend only; the
 * route checks the signature on the raw body before calling this.
 *
 * - Only `object: "whatsapp_business_account"` bodies, and only `messages`
 *   changes for our own phone number id (`value.metadata.phone_number_id`).
 * - statuses[]: matched by wamid (or our id in biz_opaque_callback_data);
 *   status only moves forward (canAdvanceStatus); pricing → pricing_* and
 *   meta_cost_micros (once).
 * - messages[]: deduped by inbound wamid (whatsapp_inbound PK), so a replay
 *   does nothing. STOP/إيقاف → global opt-out + a confirmation. A signed
 *   button tap, bound to its message's wamid and recipient, confirms or
 *   cancels through the shared order functions, then a short reply and a
 *   seller bell.
 * - message_template_status_update → whatsapp_templates.
 *
 * Logs ids and counts only. Inbound text is data, never instructions.
 */
import { db, eq, orders, sellerNotifications, sql, stores, whatsappContacts, whatsappInbound, whatsappMessages, whatsappTemplates } from "@workspace/db";
import {
  cancelOrderByCustomer,
  confirmOrderByCustomer,
  type CancelByCustomerOptions,
} from "../orders/customer-order-actions.server";
import type { CustomerOrderActionResult } from "../orders/customer-order-actions.lib";
import { canAdvanceStatus, isWhatsAppLocale, replyDedupeKey, type WhatsAppLocale, type WhatsAppMessageStatus } from "./events.lib";
import { dispatchWhatsAppMessages } from "./dispatch.server";
import type { WhatsAppConfig } from "./graph.server";
import { detectOptOut, metaCostMicros, parseWhatsAppWebhook, type InboundMessage, type StatusUpdate, type TemplateStatusUpdate } from "./inbound.lib";
import { whatsAppReplyText, type WhatsAppReplyKind } from "./order-message.lib";
import { verifyQuickReplyPayload } from "./payload.lib";
import { getWhatsAppSettings } from "./settings.server";
import { getWhatsAppTemplate } from "./templates.lib";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEMPLATE_NAME_RE = /^[a-z0-9_]{1,512}$/;
const rowsOf = <T,>(result: unknown): T[] => [...(result as Iterable<T>)];

export interface WebhookSummary {
  ignored: boolean;
  otherNumber: number;
  statuses: number;
  inbound: number;
  duplicates: number;
  templates: number;
}

export interface WebhookHooks {
  /** The cancellation mail after a button cancel (the backend sends it in-process). */
  sendCancelledEmail?: CancelByCustomerOptions["sendCancelledEmail"];
}

// ── Envelope filter ──────────────────────────────────────────────────────

type RawChange = { field?: unknown; value?: { metadata?: { phone_number_id?: unknown }; contacts?: unknown } };

/**
 * Keeps only `messages` changes for our phone number id (template status
 * changes have no number and are kept), and collects the contacts' wa_id ↔
 * user_id pairs for the contact rows.
 */
export function filterWebhookForNumber(
  body: unknown,
  phoneNumberId: string
): { body: unknown; otherNumber: number; contacts: { phone: string; userId: string }[] } | null {
  if (!body || typeof body !== "object" || (body as { object?: unknown }).object !== "whatsapp_business_account") return null;
  const entries = (body as { entry?: unknown }).entry;
  if (!Array.isArray(entries)) return null;
  let otherNumber = 0;
  const contacts: { phone: string; userId: string }[] = [];
  const entry = entries.map((raw) => {
    const changes = (raw as { changes?: unknown } | null)?.changes;
    if (!Array.isArray(changes)) return { changes: [] };
    const kept = (changes as RawChange[]).filter((change) => {
      if (change?.field !== "messages") return true;
      if (String(change.value?.metadata?.phone_number_id ?? "") !== phoneNumberId) {
        otherNumber += 1;
        return false;
      }
      for (const c of Array.isArray(change.value?.contacts) ? (change.value!.contacts as unknown[]) : []) {
        const waId = (c as { wa_id?: unknown })?.wa_id;
        const userId = (c as { user_id?: unknown })?.user_id;
        if (typeof waId === "string" && /^[1-9]\d{7,14}$/.test(waId) && typeof userId === "string" && userId.length >= 1 && userId.length <= 200) {
          contacts.push({ phone: waId, userId });
        }
      }
      return true;
    });
    return { changes: kept };
  });
  return { body: { object: "whatsapp_business_account", entry }, otherNumber, contacts };
}

// ── Statuses ─────────────────────────────────────────────────────────────

async function applyStatus(update: StatusUpdate, rates: Readonly<Record<string, number>>): Promise<boolean> {
  const byId = update.callbackData && UUID_RE.test(update.callbackData) ? update.callbackData : null;
  return db.transaction(async (tx) => {
    const [row] = rowsOf<{ id: string; status: WhatsAppMessageStatus }>(
      await tx.execute(sql`
        SELECT id, status FROM whatsapp_messages
         WHERE wamid = ${update.wamid}
            ${byId ? sql`OR (wamid IS NULL AND id = ${byId}::uuid)` : sql``}
         LIMIT 1
         FOR UPDATE
      `)
    );
    if (!row) return false;
    const advance = canAdvanceStatus(row.status, update.status);
    const at = (update.at ?? new Date()).toISOString();
    const cost = metaCostMicros(update.pricing, rates);
    const to = update.status;
    await tx.execute(sql`
      UPDATE whatsapp_messages SET
        wamid = coalesce(wamid, ${update.wamid}),
        status = ${advance ? to : row.status},
        sent_at = CASE WHEN ${advance && to !== "failed"} THEN coalesce(sent_at, ${at}::timestamptz) ELSE sent_at END,
        delivered_at = CASE WHEN ${advance && (to === "delivered" || to === "read")} THEN coalesce(delivered_at, ${at}::timestamptz) ELSE delivered_at END,
        read_at = CASE WHEN ${advance && to === "read"} THEN coalesce(read_at, ${at}::timestamptz) ELSE read_at END,
        failed_at = CASE WHEN ${advance && to === "failed"} THEN ${at}::timestamptz ELSE failed_at END,
        error_code = CASE WHEN ${advance && to === "failed"} THEN ${update.error?.code ?? null}::int ELSE error_code END,
        error_title = CASE WHEN ${advance && to === "failed"} THEN ${update.error?.title ?? null} ELSE error_title END,
        error_detail = CASE WHEN ${advance && to === "failed"} THEN ${update.error?.detail ?? null} ELSE error_detail END,
        pricing_category = coalesce(pricing_category, ${update.pricing?.category ?? null}),
        pricing_type = coalesce(pricing_type, ${update.pricing?.type ?? null}),
        meta_cost_micros = coalesce(meta_cost_micros, ${cost}::int)
      WHERE id = ${row.id}::uuid
    `);
    return true;
  });
}

// ── Inbound ──────────────────────────────────────────────────────────────

async function lastLocaleFor(phone: string): Promise<WhatsAppLocale> {
  const [row] = await db
    .select({ locale: whatsappMessages.locale })
    .from(whatsappMessages)
    .where(eq(whatsappMessages.toPhone, phone))
    .orderBy(sql`${whatsappMessages.createdAt} DESC`)
    .limit(1);
  return isWhatsAppLocale(row?.locale) ? row.locale : "ar";
}

/** Queues a free-form reply to an inbound message (one per inbound wamid). Returns its id. */
async function queueReply(
  inbound: InboundMessage,
  phone: string,
  locale: WhatsAppLocale,
  text: string,
  ref: { sellerId?: string | null; storeId?: string | null; orderId?: string | null } = {}
): Promise<string | null> {
  const [row] = await db
    .insert(whatsappMessages)
    .values({
      sellerId: ref.sellerId ?? null,
      storeId: ref.storeId ?? null,
      orderId: ref.orderId ?? null,
      event: "reply",
      dedupeKey: replyDedupeKey(inbound.wamid),
      toPhone: phone,
      locale,
      kind: "text",
      payload: { text, contextWamid: inbound.wamid },
      priceUsdCents: 0,
    })
    .onConflictDoNothing({ target: whatsappMessages.dedupeKey })
    .returning({ id: whatsappMessages.id });
  return row?.id ?? null;
}

async function touchContact(inbound: InboundMessage, pairs: Map<string, string>): Promise<string | null> {
  const at = (inbound.at ?? new Date()).toISOString();
  if (inbound.fromPhone) {
    const userId = inbound.waUserId ?? pairs.get(inbound.fromPhone) ?? null;
    await db
      .insert(whatsappContacts)
      .values({ phone: inbound.fromPhone, waUserId: userId, lastInboundAt: at })
      .onConflictDoUpdate({
        target: whatsappContacts.phone,
        set: {
          lastInboundAt: sql`greatest(${whatsappContacts.lastInboundAt}, excluded.last_inbound_at)`,
          waUserId: sql`coalesce(excluded.wa_user_id, ${whatsappContacts.waUserId})`,
          updatedAt: sql`now()`,
        },
      });
    return inbound.fromPhone;
  }
  if (!inbound.waUserId) return null;
  const [row] = await db
    .update(whatsappContacts)
    .set({ lastInboundAt: at, updatedAt: sql`now()` })
    .where(eq(whatsappContacts.waUserId, inbound.waUserId))
    .returning({ phone: whatsappContacts.phone });
  return row?.phone ?? null;
}

async function recordInbound(wamid: string, patch: { action: string; result: string; orderId?: string | null }): Promise<void> {
  await db
    .update(whatsappInbound)
    .set({ action: patch.action, result: patch.result, orderId: patch.orderId ?? null })
    .where(eq(whatsappInbound.wamid, wamid));
}

const BELL_TYPE = { confirmed: "whatsapp_order_confirmed", cancelled: "whatsapp_order_cancelled" } as const;

async function bell(kind: "confirmed" | "cancelled", ref: { sellerId: string; storeId: string; orderId: string; orderNumber: string | null }) {
  const type = BELL_TYPE[kind];
  try {
    await db
      .insert(sellerNotifications)
      .values({
        sellerId: ref.sellerId,
        storeId: ref.storeId,
        type,
        data: { orderId: ref.orderId, orderNumber: ref.orderNumber },
        dedupeKey: `${type}:${ref.orderId}`,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error("[whatsapp] bell failed", ref.orderId, (error as Error)?.name);
  }
}

function replyKindFor(action: "confirm" | "cancel", result: CustomerOrderActionResult): WhatsAppReplyKind {
  switch (result) {
    case "confirmed":
      return "confirmed";
    case "cancelled":
      return "cancelled";
    case "already":
      return action === "confirm" ? "already_confirmed" : "already_cancelled";
    default:
      return "refused";
  }
}

async function handleButton(
  inbound: InboundMessage,
  senderPhone: string | null,
  config: WhatsAppConfig,
  hooks: WebhookHooks
): Promise<string | null> {
  const tap = verifyQuickReplyPayload(inbound.button?.payload, config.payloadSecret);
  if (!tap) {
    await recordInbound(inbound.wamid, { action: "other", result: "ignored" });
    return null;
  }
  const [message] = await db
    .select({
      id: whatsappMessages.id,
      wamid: whatsappMessages.wamid,
      toPhone: whatsappMessages.toPhone,
      orderId: whatsappMessages.orderId,
      storeId: whatsappMessages.storeId,
      sellerId: whatsappMessages.sellerId,
      locale: whatsappMessages.locale,
      templateName: whatsappMessages.templateName,
      kind: whatsappMessages.kind,
    })
    .from(whatsappMessages)
    .where(eq(whatsappMessages.id, tap.messageId))
    .limit(1);
  const template = message?.templateName ? getWhatsAppTemplate(message.templateName) : null;
  // Bound to the message: its wamid (when Meta sends the context) and its recipient.
  let senderMatches = Boolean(message && senderPhone && senderPhone === message.toPhone);
  if (message && !senderMatches && inbound.waUserId) {
    const [contact] = await db
      .select({ waUserId: whatsappContacts.waUserId })
      .from(whatsappContacts)
      .where(eq(whatsappContacts.phone, message.toPhone))
      .limit(1);
    senderMatches = contact?.waUserId === inbound.waUserId;
  }
  const contextOk = !inbound.contextWamid || !message?.wamid || inbound.contextWamid === message.wamid;
  if (
    !message ||
    message.kind !== "template" ||
    template?.buttons !== "confirm_cancel" ||
    !message.orderId ||
    !message.storeId ||
    !message.sellerId ||
    !contextOk ||
    !senderMatches
  ) {
    await recordInbound(inbound.wamid, { action: tap.action, result: "ignored" });
    return null;
  }

  const ref = { orderId: message.orderId, storeId: message.storeId, sellerId: message.sellerId };
  const result =
    tap.action === "confirm"
      ? await confirmOrderByCustomer(ref)
      : await cancelOrderByCustomer(ref, hooks.sendCancelledEmail ? { sendCancelledEmail: hooks.sendCancelledEmail } : {});
  await recordInbound(inbound.wamid, { action: tap.action, result, orderId: message.orderId });

  const [order] = await db
    .select({ orderNumber: orders.orderNumber, storeName: stores.name })
    .from(orders)
    .innerJoin(stores, eq(stores.id, orders.storeId))
    .where(eq(orders.id, message.orderId))
    .limit(1);
  if (result === "confirmed" || result === "cancelled") {
    await bell(result, { ...ref, orderNumber: order?.orderNumber ?? null });
  }
  if (result === "not_found") return null;
  const locale: WhatsAppLocale = isWhatsAppLocale(message.locale) ? message.locale : "ar";
  const text = whatsAppReplyText(replyKindFor(tap.action, result), locale, {
    orderNumber: order?.orderNumber,
    storeName: order?.storeName,
  });
  return queueReply(inbound, message.toPhone, locale, text, ref);
}

async function handleInbound(
  inbound: InboundMessage,
  config: WhatsAppConfig,
  pairs: Map<string, string>,
  hooks: WebhookHooks
): Promise<{ duplicate: boolean; replyId: string | null }> {
  const [inserted] = await db
    .insert(whatsappInbound)
    .values({
      wamid: inbound.wamid,
      fromPhone: inbound.fromPhone,
      waUserId: inbound.waUserId,
      type: inbound.type.slice(0, 50),
      contextWamid: inbound.contextWamid,
      body: (inbound.text ?? inbound.button?.text ?? null)?.slice(0, 1000) ?? null,
    })
    .onConflictDoNothing({ target: whatsappInbound.wamid })
    .returning({ wamid: whatsappInbound.wamid });
  if (!inserted) return { duplicate: true, replyId: null };

  const senderPhone = await touchContact(inbound, pairs);

  if (inbound.type === "text" && detectOptOut(inbound.text)) {
    if (!senderPhone) {
      await recordInbound(inbound.wamid, { action: "stop", result: "not_found" });
      return { duplicate: false, replyId: null };
    }
    await db
      .update(whatsappContacts)
      .set({ optedOutAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(whatsappContacts.phone, senderPhone));
    await recordInbound(inbound.wamid, { action: "stop", result: "opted_out" });
    const locale = await lastLocaleFor(senderPhone);
    return { duplicate: false, replyId: await queueReply(inbound, senderPhone, locale, whatsAppReplyText("opted_out", locale)) };
  }

  if (inbound.type === "button" && inbound.button?.payload) {
    return { duplicate: false, replyId: await handleButton(inbound, senderPhone, config, hooks) };
  }

  await recordInbound(inbound.wamid, { action: "other", result: "ignored" });
  return { duplicate: false, replyId: null };
}

// ── Templates ────────────────────────────────────────────────────────────

async function applyTemplateUpdate(update: TemplateStatusUpdate): Promise<boolean> {
  if (!TEMPLATE_NAME_RE.test(update.name) || !isWhatsAppLocale(update.language)) return false;
  await db
    .insert(whatsappTemplates)
    .values({
      name: update.name,
      language: update.language,
      metaTemplateId: update.metaTemplateId,
      status: update.status,
      rejectedReason: update.reason,
      syncedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: [whatsappTemplates.name, whatsappTemplates.language],
      set: {
        status: update.status,
        metaTemplateId: sql`coalesce(excluded.meta_template_id, ${whatsappTemplates.metaTemplateId})`,
        rejectedReason: update.reason,
        syncedAt: sql`now()`,
      },
    });
  return true;
}

// ── Entry point ──────────────────────────────────────────────────────────

/** Processes a verified webhook body. Never throws; a failed item is logged by id and skipped. */
export async function handleWhatsAppWebhook(
  body: unknown,
  config: WhatsAppConfig,
  hooks: WebhookHooks = {}
): Promise<WebhookSummary> {
  const summary: WebhookSummary = { ignored: false, otherNumber: 0, statuses: 0, inbound: 0, duplicates: 0, templates: 0 };
  const filtered = filterWebhookForNumber(body, config.phoneNumberId);
  if (!filtered) return { ...summary, ignored: true };
  summary.otherNumber = filtered.otherNumber;
  if (filtered.otherNumber > 0) console.warn("[whatsapp] webhook changes for another number skipped:", filtered.otherNumber);
  const parsed = parseWhatsAppWebhook(filtered.body);
  if (!parsed) return { ...summary, ignored: true };

  const settings = parsed.statuses.length > 0 ? await getWhatsAppSettings() : null;
  for (const update of parsed.statuses) {
    try {
      if (await applyStatus(update, settings?.metaRateMicros ?? {})) summary.statuses += 1;
    } catch (error) {
      console.error("[whatsapp] status update failed", update.wamid.slice(0, 80), (error as Error)?.name);
    }
  }

  const pairs = new Map(filtered.contacts.map((c) => [c.phone, c.userId]));
  const replies: string[] = [];
  for (const inbound of parsed.messages) {
    try {
      const outcome = await handleInbound(inbound, config, pairs, hooks);
      if (outcome.duplicate) summary.duplicates += 1;
      else summary.inbound += 1;
      if (outcome.replyId) replies.push(outcome.replyId);
    } catch (error) {
      console.error("[whatsapp] inbound failed", inbound.wamid.slice(0, 80), (error as Error)?.name);
    }
  }

  for (const update of parsed.templateUpdates) {
    try {
      if (await applyTemplateUpdate(update)) summary.templates += 1;
    } catch (error) {
      console.error("[whatsapp] template update failed", update.name.slice(0, 80), (error as Error)?.name);
    }
  }

  if (replies.length > 0) await dispatchWhatsAppMessages({ ids: replies });
  return summary;
}
