/**
 * Admin › WhatsApp (ROADMAP.md F-109, docs/whatsapp.md §6). Settings, usage,
 * failed messages and retry, the code templates with Meta's state, and the
 * calls to the backend (which alone holds the Meta token, D7).
 *
 * Every function re-checks the admin in the database (`assertAdminActor`);
 * the admin app checks `canManageSettings` on the session first. Writes go
 * with an admin_audit_log row in the same transaction. Never cached (rule 8).
 * No money moves here: the seller price must stay 0 (D3).
 */
import { z } from "zod";
import {
  and,
  db,
  desc,
  eq,
  inArray,
  sql,
  whatsappMessages,
  whatsappSettings,
  whatsappTemplates,
} from "@workspace/db";
import { AdminActorError, assertAdminActor, writeAdminAudit, type Queryable } from "../admin/guard.server";
import type { AdminResult } from "../admin/admin.lib";
import { WHATSAPP_EVENTS, WHATSAPP_LOCALES, WHATSAPP_MESSAGE_STATUSES, type WhatsAppLocale } from "./events.lib";
import { maskPhone } from "./phone.lib";
import { TEMPLATE_EXAMPLES, WHATSAPP_TEMPLATE_LIST, renderTemplatePreview } from "./templates.lib";
import {
  EMPTY_USAGE_COUNTS,
  WHATSAPP_FAILED_PAGE_SIZE,
  WHATSAPP_RETRY_MAX,
  WHATSAPP_RETRYABLE_STATUSES,
  checkRetryable,
  isBackendFullyConfigured,
  normalizeMetaRates,
  parseUsageDays,
  parseWhatsAppAdminSettings,
  type WhatsAppAdminSettings,
  type WhatsAppRetryError,
  type WhatsAppSettingsError,
  type WhatsAppUsageCounts,
  type WhatsAppUsageDays,
} from "./admin.lib";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Admin reads are allowed only to a verified, unsuspended admin; throws AdminActorError otherwise. */
async function requireAdmin(actorId: string, q: Queryable = db): Promise<void> {
  await assertAdminActor(q, actorId);
}

// ── Settings ─────────────────────────────────────────────────────────────

export type WhatsAppAdminSettingsView = WhatsAppAdminSettings & { updatedAt: string | null; updatedBy: string | null };

function toSettings(row: typeof whatsappSettings.$inferSelect | undefined): WhatsAppAdminSettingsView {
  const events = new Set(row?.eventsEnabled ?? WHATSAPP_EVENTS);
  return {
    enabled: row?.enabled ?? false,
    storesDefaultOn: row?.storesDefaultOn ?? false,
    sellerPriceUsdCents: row?.sellerPriceUsdCents ?? 0,
    metaRateMicros: normalizeMetaRates(row?.metaRateMicros),
    eventsEnabled: WHATSAPP_EVENTS.filter((event) => events.has(event)),
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedBy ?? null,
  };
}

/** The single settings row (id = 1), or the defaults when it was never saved. */
export async function getWhatsAppAdminSettings(actorId: string, q: Queryable = db): Promise<WhatsAppAdminSettingsView> {
  await requireAdmin(actorId, q);
  const [row] = await q.select().from(whatsappSettings).where(eq(whatsappSettings.id, 1)).limit(1);
  return toSettings(row);
}

/** One audited write of the whole settings form. A price above 0 is refused (D3). */
export async function updateWhatsAppAdminSettings(
  actorId: string,
  input: unknown,
  q: Queryable = db,
): Promise<AdminResult<{ auditId: string }, WhatsAppSettingsError | "backend_not_configured" | "not_admin" | "no_change">> {
  const parsed = parseWhatsAppAdminSettings(input);
  if (!parsed.success) return parsed;
  const next = parsed.data;
  try {
    // Owner, 2026-11-26: WhatsApp stays off until the Meta account and number
    // are ready. Saving with the switch on needs every backend env value set
    // (asked before the row lock, so no lock is held during the HTTP call).
    if (next.enabled) {
      await assertAdminActor(q, actorId);
      const connection = await fetchWhatsAppConnection();
      if (!connection.ok || !isBackendFullyConfigured(connection.data.configured)) {
        return { success: false, error: "backend_not_configured" };
      }
    }
    const auditId = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const [row] = await tx.select().from(whatsappSettings).where(eq(whatsappSettings.id, 1)).for("update");
      const { updatedAt: _a, updatedBy: _b, ...before } = toSettings(row);
      if (JSON.stringify(before) === JSON.stringify(next)) return null;
      await tx
        .insert(whatsappSettings)
        .values({ id: 1, ...next, updatedBy: actorId })
        .onConflictDoUpdate({
          target: whatsappSettings.id,
          set: { ...next, updatedBy: actorId, updatedAt: sql`now()` },
        });
      return writeAdminAudit(tx, {
        actorId,
        sellerId: null,
        targetType: "whatsapp_settings",
        targetId: "whatsapp",
        action: "update_whatsapp_settings",
        before,
        after: next,
        reason: "Admin edit",
      });
    });
    if (!auditId) return { success: false, error: "no_change" };
    return { success: true, data: { auditId } };
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    throw error;
  }
}

// ── Usage ────────────────────────────────────────────────────────────────

export type WhatsAppUsageDay = WhatsAppUsageCounts & { day: string };
export type WhatsAppUsageStore = WhatsAppUsageCounts & { storeId: string; storeName: string | null };
export type WhatsAppUsage = { days: WhatsAppUsageDays; perDay: WhatsAppUsageDay[]; topStores: WhatsAppUsageStore[] };

const TOP_STORES = 20;
const CAIRO_DAY = sql`(date_trunc('day', created_at AT TIME ZONE 'Africa/Cairo'))::date::text`;

type CountRow = Record<string, unknown>;
const int = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
};

function countsOf(row: CountRow | undefined): WhatsAppUsageCounts {
  if (!row) return { ...EMPTY_USAGE_COUNTS };
  return {
    messages: int(row.messages),
    attempted: int(row.attempted),
    delivered: int(row.delivered),
    read: int(row.read),
    failed: int(row.failed),
    costMicros: int(row.cost_micros),
    revenueCents: int(row.revenue_cents),
    confirms: int(row.confirms),
    cancels: int(row.cancels),
  };
}

const rowsOf = (result: unknown): CountRow[] =>
  (Array.isArray(result) ? result : ((result as { rows?: CountRow[] })?.rows ?? [])) as CountRow[];

// Spelled out for both queries: listing every status lets Postgres walk the
// (status, created_at) index instead of the whole table.
const ALL_STATUSES = sql.join(
  WHATSAPP_MESSAGE_STATUSES.map((s) => sql`${s}`),
  sql`, `,
);
const MESSAGE_AGGREGATES = sql`
  count(*)::int AS messages,
  count(*) FILTER (WHERE status IN ('sent', 'delivered', 'read', 'failed', 'unknown'))::int AS attempted,
  count(*) FILTER (WHERE status IN ('delivered', 'read'))::int AS delivered,
  count(*) FILTER (WHERE status = 'read')::int AS read,
  count(*) FILTER (WHERE status = 'failed')::int AS failed,
  coalesce(sum(meta_cost_micros), 0)::bigint AS cost_micros,
  coalesce(sum(price_usd_cents), 0)::bigint AS revenue_cents`;

/**
 * Messages, delivery, Meta cost, revenue and button confirms/cancels for the
 * last 7, 30 or 90 days: per Cairo day, and for the 20 busiest stores. Three
 * grouped queries, run one after another (the serverless pool is small).
 */
export async function getWhatsAppUsage(
  actorId: string,
  options: { days: unknown },
  q: Queryable = db,
): Promise<WhatsAppUsage> {
  await requireAdmin(actorId, q);
  const days = parseUsageDays(options.days);
  const since = sql`(date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') - make_interval(days => ${days - 1}::int)) AT TIME ZONE 'Africa/Cairo'`;

  const perDayMessages = rowsOf(
    await q.execute(sql`
      SELECT ${CAIRO_DAY} AS day, ${MESSAGE_AGGREGATES}
      FROM whatsapp_messages
      WHERE status IN (${ALL_STATUSES}) AND created_at >= ${since}
      GROUP BY 1`),
  );
  const perDayButtons = rowsOf(
    await q.execute(sql`
      SELECT ${CAIRO_DAY} AS day,
        count(*) FILTER (WHERE result = 'confirmed')::int AS confirms,
        count(*) FILTER (WHERE result = 'cancelled')::int AS cancels
      FROM whatsapp_inbound
      WHERE created_at >= ${since} AND result IN ('confirmed', 'cancelled')
      GROUP BY 1`),
  );
  const stores = rowsOf(
    await q.execute(sql`
      WITH m AS (
        SELECT store_id, ${MESSAGE_AGGREGATES}
        FROM whatsapp_messages
        WHERE status IN (${ALL_STATUSES}) AND created_at >= ${since} AND store_id IS NOT NULL
        GROUP BY store_id
        ORDER BY messages DESC
        LIMIT ${TOP_STORES}
      ), b AS (
        SELECT o.store_id,
          count(*) FILTER (WHERE i.result = 'confirmed')::int AS confirms,
          count(*) FILTER (WHERE i.result = 'cancelled')::int AS cancels
        FROM whatsapp_inbound i
        JOIN orders o ON o.id = i.order_id
        WHERE i.created_at >= ${since} AND i.result IN ('confirmed', 'cancelled')
          AND o.store_id IN (SELECT store_id FROM m)
        GROUP BY o.store_id
      )
      SELECT m.*, s.name AS store_name, coalesce(b.confirms, 0) AS confirms, coalesce(b.cancels, 0) AS cancels
      FROM m
      LEFT JOIN stores s ON s.id = m.store_id
      LEFT JOIN b ON b.store_id = m.store_id
      ORDER BY m.messages DESC`),
  );

  const byDay = new Map<string, WhatsAppUsageDay>();
  for (const row of perDayMessages) byDay.set(String(row.day), { day: String(row.day), ...countsOf(row) });
  for (const row of perDayButtons) {
    const key = String(row.day);
    const day = byDay.get(key) ?? { day: key, ...EMPTY_USAGE_COUNTS };
    day.confirms = int(row.confirms);
    day.cancels = int(row.cancels);
    byDay.set(key, day);
  }
  return {
    days,
    perDay: [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1)),
    topStores: stores.map((row) => ({
      storeId: String(row.store_id),
      storeName: row.store_name == null ? null : String(row.store_name),
      ...countsOf(row),
    })),
  };
}

// ── Failed messages and retry ────────────────────────────────────────────

export type WhatsAppFailedMessage = {
  id: string;
  status: "failed" | "unknown";
  event: string;
  storeId: string | null;
  storeName: string | null;
  orderId: string | null;
  maskedPhone: string;
  errorCode: number | null;
  errorTitle: string | null;
  attempts: number;
  createdAt: string;
  failedAt: string | null;
};

export type WhatsAppFailedList = {
  rows: WhatsAppFailedMessage[];
  total: number;
  page: number;
  pageSize: number;
  /** Error codes among failed and unknown messages, most common first (the filter). */
  codes: { code: number | null; count: number }[];
};

/** Failed and unknown messages, newest first, 50 a page, optionally of one Graph error code. */
export async function listFailedWhatsAppMessages(
  actorId: string,
  options: { page?: unknown; code?: unknown } = {},
  q: Queryable = db,
): Promise<WhatsAppFailedList> {
  await requireAdmin(actorId, q);
  const pageNumber = Math.max(1, Math.min(1000, Math.trunc(Number(options.page) || 1)));
  const codeRaw = options.code == null || options.code === "" ? null : Number(options.code);
  const code = codeRaw !== null && Number.isInteger(codeRaw) && codeRaw >= 0 && codeRaw <= 2_147_483_647 ? codeRaw : null;

  const where = and(
    inArray(whatsappMessages.status, [...WHATSAPP_RETRYABLE_STATUSES]),
    code === null ? undefined : eq(whatsappMessages.errorCode, code),
  );
  const rows = rowsOf(
    await q.execute(sql`
      SELECT m.id, m.status, m.event, m.store_id, s.name AS store_name, m.order_id, m.to_phone,
        m.error_code, m.error_title, m.attempts, m.created_at, m.failed_at
      FROM whatsapp_messages m
      LEFT JOIN stores s ON s.id = m.store_id
      WHERE m.status IN ('failed', 'unknown') ${code === null ? sql`` : sql`AND m.error_code = ${code}`}
      ORDER BY m.created_at DESC
      LIMIT ${WHATSAPP_FAILED_PAGE_SIZE} OFFSET ${(pageNumber - 1) * WHATSAPP_FAILED_PAGE_SIZE}`),
  );
  const [totalRow] = await q.select({ total: sql<number>`count(*)::int` }).from(whatsappMessages).where(where);
  const codes = await q
    .select({ code: whatsappMessages.errorCode, count: sql<number>`count(*)::int` })
    .from(whatsappMessages)
    .where(inArray(whatsappMessages.status, [...WHATSAPP_RETRYABLE_STATUSES]))
    .groupBy(whatsappMessages.errorCode)
    .orderBy(desc(sql`count(*)`))
    .limit(30);

  const iso = (v: unknown): string | null => (v == null ? null : v instanceof Date ? v.toISOString() : String(v));
  return {
    rows: rows.map((r) => ({
      id: String(r.id),
      status: r.status === "unknown" ? "unknown" : "failed",
      event: String(r.event),
      storeId: r.store_id == null ? null : String(r.store_id),
      storeName: r.store_name == null ? null : String(r.store_name),
      orderId: r.order_id == null ? null : String(r.order_id),
      maskedPhone: maskPhone(r.to_phone == null ? null : String(r.to_phone)),
      errorCode: r.error_code == null ? null : int(r.error_code),
      errorTitle: r.error_title == null ? null : String(r.error_title),
      attempts: int(r.attempts),
      createdAt: iso(r.created_at) ?? "",
      failedAt: iso(r.failed_at),
    })),
    total: int(totalRow?.total),
    page: pageNumber,
    pageSize: WHATSAPP_FAILED_PAGE_SIZE,
    codes: codes.map((c) => ({ code: c.code, count: int(c.count) })),
  };
}

const retryInputSchema = z.object({
  ids: z.array(z.string().regex(UUID_RE)).min(1).max(WHATSAPP_RETRY_MAX),
  confirmUnknown: z.boolean().default(false),
});

/**
 * Re-queues failed or unknown messages (attempts 0, due now, error cleared);
 * the dispatcher re-checks every gate before sending. An unknown row needs
 * `confirmUnknown` (it may already have been delivered). All or nothing,
 * audited, then a best-effort nudge to the backend dispatcher.
 */
export async function retryWhatsAppMessages(
  actorId: string,
  ids: unknown,
  options: { confirmUnknown?: unknown } = {},
  q: Queryable = db,
): Promise<AdminResult<{ count: number; auditId: string; dispatched: boolean }, WhatsAppRetryError | "not_admin">> {
  const parsed = retryInputSchema.safeParse({ ids, confirmUnknown: options.confirmUnknown === true });
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const unique = [...new Set(parsed.data.ids.map((id) => id.toLowerCase()))];
  let result: { auditId: string } | { error: WhatsAppRetryError };
  try {
    result = await q.transaction(async (tx) => {
      await assertAdminActor(tx, actorId);
      const rows = await tx
        .select({ id: whatsappMessages.id, status: whatsappMessages.status, errorCode: whatsappMessages.errorCode })
        .from(whatsappMessages)
        .where(inArray(whatsappMessages.id, unique))
        .for("update");
      if (rows.length !== unique.length) return { error: "not_found" as const };
      const check = checkRetryable(
        rows.map((r) => r.status),
        parsed.data.confirmUnknown,
      );
      if (!check.ok) return { error: check.error };
      await tx
        .update(whatsappMessages)
        .set({
          status: "queued",
          attempts: 0,
          nextAttemptAt: sql`now()`,
          claimedAt: null,
          wamid: null,
          errorCode: null,
          errorTitle: null,
          errorDetail: null,
          sentAt: null,
          failedAt: null,
        })
        .where(and(inArray(whatsappMessages.id, unique), inArray(whatsappMessages.status, [...WHATSAPP_RETRYABLE_STATUSES])));
      const auditId = await writeAdminAudit(tx, {
        actorId,
        sellerId: null,
        targetType: "whatsapp_messages",
        targetId: unique.length === 1 ? unique[0]! : `bulk:${unique.length}`,
        action: "retry_whatsapp_messages",
        before: { messages: rows.map((r) => ({ id: r.id, status: r.status, errorCode: r.errorCode })) },
        after: { status: "queued", attempts: 0, confirmUnknown: parsed.data.confirmUnknown },
        reason: "Admin retry",
      });
      return { auditId };
    });
  } catch (error) {
    if (error instanceof AdminActorError) return { success: false, error: "not_admin" };
    throw error;
  }
  if ("error" in result) return { success: false, error: result.error };
  // Best effort: the backend worker picks queued rows up anyway.
  const dispatch = await callWhatsAppBackend("POST", "/api/whatsapp/dispatch", {}, 5_000);
  return { success: true, data: { count: unique.length, auditId: result.auditId, dispatched: dispatch.ok } };
}

// ── Templates ────────────────────────────────────────────────────────────

export type WhatsAppTemplateRow = {
  name: string;
  language: WhatsAppLocale;
  category: string;
  buttons: string;
  status: string;
  rejectedReason: string | null;
  quality: string | null;
  metaTemplateId: string | null;
  syncedAt: string | null;
  preview: string;
};

/** Every code template × language with Meta's last known state and a preview with sample values. */
export async function listWhatsAppTemplates(actorId: string, q: Queryable = db): Promise<WhatsAppTemplateRow[]> {
  await requireAdmin(actorId, q);
  const stored = await q.select().from(whatsappTemplates);
  const byKey = new Map(stored.map((row) => [`${row.name}:${row.language}`, row]));
  return WHATSAPP_TEMPLATE_LIST.flatMap((template) =>
    WHATSAPP_LOCALES.map((language) => {
      const row = byKey.get(`${template.name}:${language}`);
      return {
        name: template.name,
        language,
        category: row?.category ?? template.category,
        buttons: template.buttons,
        status: row?.status ?? "not_submitted",
        rejectedReason: row?.rejectedReason ?? null,
        quality: row?.quality ?? null,
        metaTemplateId: row?.metaTemplateId ?? null,
        syncedAt: row?.syncedAt ?? null,
        preview: renderTemplatePreview(template, language, TEMPLATE_EXAMPLES[language]),
      };
    }),
  );
}

// ── Backend (internal API; it alone holds the Meta token) ────────────────

export type BackendCallResult =
  | { ok: true; data: unknown }
  | { ok: false; error: "not_configured" | "not_ready" | "failed" | "timeout"; status?: number };

/**
 * One call to the backend's internal WhatsApp API (Bearer INTERNAL_API_SECRET),
 * like the order emails, but returning the parsed JSON body. Never throws: a
 * missing env, 404 (endpoint not deployed yet), error or timeout is a result.
 */
async function callWhatsAppBackend(
  method: "GET" | "POST",
  path: string,
  body: Record<string, unknown> | undefined,
  timeoutMs: number,
): Promise<BackendCallResult> {
  const backendUrl = process.env.BACKEND_API_URL;
  const apiSecret = process.env.INTERNAL_API_SECRET;
  if (!backendUrl || !apiSecret) return { ok: false, error: "not_configured" };
  try {
    const res = await fetch(`${backendUrl.replace(/\/+$/, "")}${path}`, {
      method,
      headers: {
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${apiSecret}`,
      },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 404 || res.status === 405) return { ok: false, error: "not_ready", status: res.status };
    if (res.status === 503) return { ok: false, error: "not_configured", status: res.status };
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      console.error(`whatsapp admin ${path}: backend returned ${res.status}`);
      return { ok: false, error: "failed", status: res.status };
    }
    return { ok: true, data };
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "TimeoutError" || name === "AbortError") return { ok: false, error: "timeout" };
    console.error(`whatsapp admin ${path}: failed to reach backend`);
    return { ok: false, error: "failed" };
  }
}

const shortText = z.string().max(200).nullish();

const connectionSchema = z.object({
  configured: z
    .object({
      token: z.boolean(),
      phoneNumberId: z.boolean(),
      wabaId: z.boolean(),
      appSecret: z.boolean(),
      verifyToken: z.boolean(),
      payloadSecret: z.boolean(),
    })
    .partial(),
  phone: z
    .object({ displayName: shortText, qualityRating: shortText, messagingLimit: shortText, nameStatus: shortText })
    .nullish(),
  error: shortText,
});

export type WhatsAppConnection = {
  configured: { token: boolean; phoneNumberId: boolean; wabaId: boolean; appSecret: boolean; verifyToken: boolean; payloadSecret: boolean };
  phone: { displayName: string | null; qualityRating: string | null; messagingLimit: string | null; nameStatus: string | null } | null;
  error: string | null;
};

/**
 * Whether the backend has the WhatsApp env (booleans only, never values) and
 * the number's display name, quality and limit from Graph. Only whitelisted
 * fields pass through, so nothing else the backend returns reaches the page.
 */
export async function getWhatsAppConnection(
  actorId: string,
): Promise<{ ok: true; data: WhatsAppConnection } | { ok: false; error: Exclude<BackendCallResult, { ok: true }>["error"] }> {
  await requireAdmin(actorId);
  return fetchWhatsAppConnection();
}

/** The connection read without the admin check; callers check first. */
async function fetchWhatsAppConnection(): Promise<
  { ok: true; data: WhatsAppConnection } | { ok: false; error: Exclude<BackendCallResult, { ok: true }>["error"] }
> {
  const result = await callWhatsAppBackend("GET", "/api/whatsapp/connection", undefined, 8_000);
  if (!result.ok) return { ok: false, error: result.error };
  const parsed = connectionSchema.safeParse(result.data);
  if (!parsed.success) return { ok: false, error: "not_ready" };
  const c = parsed.data.configured;
  const p = parsed.data.phone;
  return {
    ok: true,
    data: {
      configured: {
        token: c.token === true,
        phoneNumberId: c.phoneNumberId === true,
        wabaId: c.wabaId === true,
        appSecret: c.appSecret === true,
        verifyToken: c.verifyToken === true,
        payloadSecret: c.payloadSecret === true,
      },
      phone: p
        ? {
            displayName: p.displayName ?? null,
            qualityRating: p.qualityRating ?? null,
            messagingLimit: p.messagingLimit ?? null,
            nameStatus: p.nameStatus ?? null,
          }
        : null,
      error: parsed.data.error ?? null,
    },
  };
}

/** Numbers the backend may report after submit or sync; anything else is dropped. */
function summaryOf(data: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!data || typeof data !== "object") return out;
  for (const key of ["submitted", "skipped", "failed", "updated", "total"]) {
    const v = (data as Record<string, unknown>)[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = Math.trunc(v);
    else if (Array.isArray(v)) out[key] = v.length;
  }
  return out;
}

export type TemplateActionResult =
  | { ok: true; summary: Record<string, number> }
  | { ok: false; error: Exclude<BackendCallResult, { ok: true }>["error"] };

/** Asks the backend to submit every code template not yet at Meta (`POST /{WABA_ID}/message_templates`). Audited. */
export async function submitWhatsAppTemplates(actorId: string): Promise<TemplateActionResult> {
  await requireAdmin(actorId);
  const result = await callWhatsAppBackend("POST", "/api/whatsapp/templates/submit", {}, 30_000);
  if (!result.ok) return { ok: false, error: result.error };
  const summary = summaryOf(result.data);
  await writeAdminAudit(db, {
    actorId,
    sellerId: null,
    targetType: "whatsapp_templates",
    targetId: "whatsapp",
    action: "submit_whatsapp_templates",
    before: {},
    after: summary,
    reason: "Admin submit",
  });
  return { ok: true, summary };
}

/** Asks the backend to read every template's status from Meta into whatsapp_templates. */
export async function syncWhatsAppTemplates(actorId: string): Promise<TemplateActionResult> {
  await requireAdmin(actorId);
  const result = await callWhatsAppBackend("POST", "/api/whatsapp/templates/sync", {}, 30_000);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, summary: summaryOf(result.data) };
}

