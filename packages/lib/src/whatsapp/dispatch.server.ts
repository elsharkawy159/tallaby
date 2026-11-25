/**
 * The WhatsApp outbox dispatcher (docs/whatsapp.md §4). Backend only: the
 * 15 s worker, the cron fallback and the immediate send after an enqueue all
 * call `dispatchWhatsAppMessages`.
 *
 * 1. Rows stuck in `sending` for 10 minutes become `unknown`: the process died
 *    mid-send and Meta has no idempotency key, so they are never re-sent
 *    automatically (Admin may retry one by hand).
 * 2. Claim: `queued` rows due now → `sending` (attempts + 1), FOR UPDATE SKIP
 *    LOCKED, so two dispatchers never take the same row. A phone that got a
 *    message in the last 10 s, or has one in flight, waits.
 * 3. The gates are checked again; an opted-out phone (or a store or event
 *    switched off since) makes the row `skipped`.
 * 4. Send with concurrency 10; the result is written with a `status =
 *    'sending'` guard, by sendErrorOutcome (errors.lib.ts) on failure.
 *
 * Nothing runs (no claim, no sweep) while the env is missing or Admin's
 * switch is off.
 */
import { db, eq, orders, sql, whatsappContacts } from "@workspace/db";
import { sendErrorOutcome } from "./errors.lib";
import { isWhatsAppEvent, isWhatsAppLocale } from "./events.lib";
import { getWhatsAppConfig, sendWhatsAppMessage, type GraphError, type GraphMessageBody, type WhatsAppConfig } from "./graph.server";
import { isWhatsAppOptedOut, readWhatsAppConsent, type WhatsAppGlobalSettings } from "./order-message.lib";
import { signQuickReplyPayload } from "./payload.lib";
import { getStoreWhatsAppSettings, getWhatsAppSettings } from "./settings.server";
import { buildTemplateSendComponents, getWhatsAppTemplate, type TemplateParams } from "./templates.lib";
import { signWhatsAppTrackingToken } from "./tracking.server";

export const DISPATCH_CONCURRENCY = 10;
export const DISPATCH_MAX_BATCH = 50;
export const STALE_SENDING_MINUTES = 10;
export const RECIPIENT_SPACING_SECONDS = 10;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface DispatchSummary {
  idle: boolean;
  staleToUnknown: number;
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
  unknown: number;
  skipped: number;
}

export interface ClaimedMessage {
  id: string;
  seller_id: string | null;
  store_id: string | null;
  order_id: string | null;
  event: string;
  to_phone: string;
  locale: string;
  kind: string;
  template_name: string | null;
  template_language: string | null;
  payload: Record<string, unknown> | null;
  attempts: number;
}

const rowsOf = <T,>(result: unknown): T[] => [...(result as Iterable<T>)];

/** Rows left in `sending` by a crashed send → `unknown` (never re-sent automatically). */
export async function sweepStaleWhatsAppSends(): Promise<number> {
  const rows = rowsOf<{ id: string }>(
    await db.execute(sql`
      UPDATE whatsapp_messages
         SET status = 'unknown', error_title = coalesce(error_title, 'stale_sending')
       WHERE status = 'sending' AND claimed_at < now() - make_interval(mins => ${STALE_SENDING_MINUTES})
      RETURNING id
    `)
  );
  return rows.length;
}

/** Claims due queued rows (all, or only `ids`); one row per phone per batch. */
export async function claimWhatsAppMessages({ ids, limit }: { ids?: readonly string[]; limit: number }): Promise<ClaimedMessage[]> {
  const n = Math.max(1, Math.min(DISPATCH_MAX_BATCH, Math.floor(limit)));
  const only = ids?.filter((id) => UUID_RE.test(id)) ?? null;
  if (only && only.length === 0) return [];
  const onlyClause = only ? sql`AND x.id IN (${sql.join(only.map((id) => sql`${id}::uuid`), sql`, `)})` : sql``;
  const claimed = rowsOf<ClaimedMessage>(
    await db.execute(sql`
      UPDATE whatsapp_messages m
         SET status = 'sending', claimed_at = now(), attempts = m.attempts + 1
       WHERE m.id IN (
         SELECT x.id
           FROM whatsapp_messages x
          WHERE x.status = 'queued'
            AND x.next_attempt_at <= now()
            ${onlyClause}
            AND NOT EXISTS (
              SELECT 1 FROM whatsapp_messages p
               WHERE p.to_phone = x.to_phone AND p.id <> x.id
                 AND (p.status = 'sending' OR p.sent_at > now() - make_interval(secs => ${RECIPIENT_SPACING_SECONDS}))
            )
          ORDER BY x.next_attempt_at
          LIMIT ${n}
          FOR UPDATE OF x SKIP LOCKED
       )
      RETURNING m.id, m.seller_id, m.store_id, m.order_id, m.event, m.to_phone, m.locale, m.kind,
                m.template_name, m.template_language, m.payload, m.attempts
    `)
  );
  // Two rows for one phone in the same batch: the later ones wait for the spacing.
  const seen = new Set<string>();
  const keep: ClaimedMessage[] = [];
  const release: string[] = [];
  for (const row of claimed) {
    if (seen.has(row.to_phone)) release.push(row.id);
    else {
      seen.add(row.to_phone);
      keep.push(row);
    }
  }
  if (release.length > 0) {
    await db.execute(sql`
      UPDATE whatsapp_messages
         SET status = 'queued', claimed_at = NULL, attempts = greatest(attempts - 1, 0),
             next_attempt_at = now() + make_interval(secs => ${RECIPIENT_SPACING_SECONDS})
       WHERE id IN (${sql.join(release.map((id) => sql`${id}::uuid`), sql`, `)}) AND status = 'sending'
    `);
  }
  return keep;
}

/** The Graph body of a claimed row; throws when it can't be built (the row then fails). */
export function buildWhatsAppSendBody(row: ClaimedMessage, config: WhatsAppConfig): GraphMessageBody {
  const payload = row.payload ?? {};
  if (row.kind === "text") {
    const text = typeof payload.text === "string" ? payload.text.slice(0, 4096) : "";
    if (!text) throw new Error("whatsapp: empty text");
    const contextWamid = typeof payload.contextWamid === "string" ? payload.contextWamid : null;
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: row.to_phone,
      type: "text",
      text: { body: text, preview_url: false },
      ...(contextWamid ? { context: { message_id: contextWamid } } : {}),
      biz_opaque_callback_data: row.id,
    };
  }
  const template = row.template_name ? getWhatsAppTemplate(row.template_name) : null;
  const language = row.template_language;
  if (!template || !isWhatsAppLocale(language)) throw new Error("whatsapp: unknown template");
  const params = (payload.params && typeof payload.params === "object" ? payload.params : {}) as TemplateParams;
  const components = buildTemplateSendComponents({
    template,
    params,
    quickReplyPayloads:
      template.buttons === "confirm_cancel"
        ? {
            confirm: signQuickReplyPayload("confirm", row.id, config.payloadSecret),
            cancel: signQuickReplyPayload("cancel", row.id, config.payloadSecret),
          }
        : undefined,
    trackingToken: template.buttons === "track" && row.order_id ? signWhatsAppTrackingToken(row.order_id) : undefined,
  });
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: row.to_phone,
    type: "template",
    template: { name: template.name, language: { code: language }, components },
    biz_opaque_callback_data: row.id,
  };
}

/** The send gates again, at send time (§4 Gates). Null = send. */
async function sendTimeSkip(row: ClaimedMessage, settings: WhatsAppGlobalSettings): Promise<string | null> {
  if (row.kind !== "template") return null;
  if (!isWhatsAppEvent(row.event) || !settings.eventsEnabled.includes(row.event)) return "event_disabled";
  if (!row.store_id || !row.order_id) return "no_store";
  const store = await getStoreWhatsAppSettings(row.store_id, settings);
  if (!store?.enabled) return "store_disabled";
  if (!store.events.includes(row.event)) return "store_event_disabled";
  const [[contact], [order]] = await Promise.all([
    db
      .select({ optedInAt: whatsappContacts.optedInAt, optedOutAt: whatsappContacts.optedOutAt })
      .from(whatsappContacts)
      .where(eq(whatsappContacts.phone, row.to_phone))
      .limit(1),
    db.select({ metadata: orders.metadata }).from(orders).where(eq(orders.id, row.order_id)).limit(1),
  ]);
  if (isWhatsAppOptedOut(contact ?? null, readWhatsAppConsent(order?.metadata).at)) return "opted_out";
  return null;
}

function errorColumns(error: GraphError) {
  return sql`error_code = ${error.code ?? null}, error_title = ${error.title?.slice(0, 500) ?? null}, error_detail = ${error.detail?.slice(0, 2000) ?? null}`;
}

type RowOutcome = "sent" | "retried" | "failed" | "unknown" | "skipped";

async function sendOne(row: ClaimedMessage, config: WhatsAppConfig, settings: WhatsAppGlobalSettings): Promise<RowOutcome> {
  const skip = await sendTimeSkip(row, settings);
  if (skip) {
    await db.execute(sql`
      UPDATE whatsapp_messages SET status = 'skipped', error_title = ${skip}
       WHERE id = ${row.id}::uuid AND status = 'sending'
    `);
    return "skipped";
  }

  let body: GraphMessageBody;
  try {
    body = buildWhatsAppSendBody(row, config);
  } catch (error) {
    await db.execute(sql`
      UPDATE whatsapp_messages
         SET status = 'failed', failed_at = now(), error_title = 'build_failed',
             error_detail = ${((error as Error)?.message ?? "").slice(0, 500)}
       WHERE id = ${row.id}::uuid AND status = 'sending'
    `);
    return "failed";
  }

  const result = await sendWhatsAppMessage(config, body);
  if (result.ok) {
    // A status webhook may already have moved the row on (it matches by our id): keep its status.
    await db.execute(sql`
      UPDATE whatsapp_messages
         SET wamid = ${result.wamid}, sent_at = coalesce(sent_at, now()),
             status = CASE WHEN status IN ('sending', 'unknown') THEN 'sent' ELSE status END,
             error_code = NULL, error_title = NULL, error_detail = NULL
       WHERE id = ${row.id}::uuid
    `);
    return "sent";
  }

  const outcome = sendErrorOutcome(result.error, row.attempts);
  if (outcome.status === "queued") {
    await db.execute(sql`
      UPDATE whatsapp_messages
         SET status = 'queued', claimed_at = NULL,
             next_attempt_at = now() + make_interval(secs => ${Math.ceil(outcome.delayMs / 1000)}),
             ${errorColumns(result.error)}
       WHERE id = ${row.id}::uuid AND status = 'sending'
    `);
    return "retried";
  }
  if (outcome.status === "unknown") {
    await db.execute(sql`
      UPDATE whatsapp_messages SET status = 'unknown', ${errorColumns(result.error)}
       WHERE id = ${row.id}::uuid AND status = 'sending'
    `);
    return "unknown";
  }
  if (outcome.auth) {
    // One ops line, no secrets: the token expired or was revoked.
    console.error("[whatsapp] Graph auth error (code 190 / 401): check WHATSAPP_ACCESS_TOKEN");
  }
  await db.execute(sql`
    UPDATE whatsapp_messages SET status = 'failed', failed_at = now(), ${errorColumns(result.error)}
     WHERE id = ${row.id}::uuid AND status = 'sending'
  `);
  return "failed";
}

async function inPool<T, R>(items: readonly T[], size: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      out[index] = await run(items[index]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

const EMPTY: DispatchSummary = { idle: true, staleToUnknown: 0, claimed: 0, sent: 0, retried: 0, failed: 0, unknown: 0, skipped: 0 };

/** One dispatch pass. Never throws; does nothing while WhatsApp is off. */
export async function dispatchWhatsAppMessages({
  ids,
  limit = DISPATCH_MAX_BATCH,
}: { ids?: readonly string[]; limit?: number } = {}): Promise<DispatchSummary> {
  const config = getWhatsAppConfig();
  if (!config) return EMPTY;
  try {
    const settings = await getWhatsAppSettings();
    if (!settings?.enabled) return EMPTY;
    const summary: DispatchSummary = { ...EMPTY, idle: false };
    summary.staleToUnknown = await sweepStaleWhatsAppSends();
    const rows = await claimWhatsAppMessages({ ids, limit });
    summary.claimed = rows.length;
    const outcomes = await inPool(rows, DISPATCH_CONCURRENCY, async (row) => {
      try {
        return await sendOne(row, config, settings);
      } catch (error) {
        // A database error after the claim: the row stays `sending` and the sweep marks it unknown.
        console.error("[whatsapp] dispatch row failed", row.id, (error as Error)?.name);
        return "unknown" as const;
      }
    });
    for (const outcome of outcomes) summary[outcome] += 1;
    return summary;
  } catch (error) {
    console.error("[whatsapp] dispatch failed", (error as Error)?.name);
    return EMPTY;
  }
}
