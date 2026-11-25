/**
 * A tiny Meta Graph API client for WhatsApp Cloud (docs/whatsapp.md §4, §6,
 * §7). Backend only: the token lives in `apps/backend`'s env (D7).
 *
 * Never logs the token, a request body (it holds the shopper's phone) or a
 * full response. Every call has a 15 s timeout. A failure is returned as a
 * `GraphSendError` (errors.lib.ts) that tells a network error before the
 * request left (safe to retry) from one after it may have reached Meta.
 */
import type { GraphSendError } from "./errors.lib";
import type { MetaTemplateDefinition } from "./templates.lib";

export const GRAPH_TIMEOUT_MS = 15_000;
const DEFAULT_GRAPH_VERSION = "v27.0";
const GRAPH_BASE = "https://graph.facebook.com";

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  appSecret: string;
  verifyToken: string;
  payloadSecret: string;
  graphVersion: string;
}

const ID_RE = /^\d{5,30}$/;
const VERSION_RE = /^v\d{1,3}\.\d{1,3}$/;
const MIN_PAYLOAD_SECRET = 32;

/** Which env variables are set (booleans only, for Admin › Connection). */
export function whatsAppEnvPresence(env: NodeJS.ProcessEnv = process.env): Record<string, boolean> {
  return {
    WHATSAPP_ACCESS_TOKEN: Boolean(env.WHATSAPP_ACCESS_TOKEN),
    WHATSAPP_PHONE_NUMBER_ID: Boolean(env.WHATSAPP_PHONE_NUMBER_ID),
    WHATSAPP_WABA_ID: Boolean(env.WHATSAPP_WABA_ID),
    WHATSAPP_APP_SECRET: Boolean(env.WHATSAPP_APP_SECRET),
    WHATSAPP_VERIFY_TOKEN: Boolean(env.WHATSAPP_VERIFY_TOKEN),
    WHATSAPP_PAYLOAD_SECRET: Boolean(env.WHATSAPP_PAYLOAD_SECRET),
    WHATSAPP_GRAPH_VERSION: Boolean(env.WHATSAPP_GRAPH_VERSION),
    WHATSAPP_WORKER: env.WHATSAPP_WORKER === "1",
  };
}

/** The WhatsApp env, or null when any required value is missing or malformed (then nothing sends). */
export function getWhatsAppConfig(env: NodeJS.ProcessEnv = process.env): WhatsAppConfig | null {
  const accessToken = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const wabaId = env.WHATSAPP_WABA_ID?.trim();
  const appSecret = env.WHATSAPP_APP_SECRET?.trim();
  const verifyToken = env.WHATSAPP_VERIFY_TOKEN?.trim();
  const payloadSecret = env.WHATSAPP_PAYLOAD_SECRET?.trim();
  const graphVersion = env.WHATSAPP_GRAPH_VERSION?.trim() || DEFAULT_GRAPH_VERSION;
  if (!accessToken || !appSecret || !verifyToken) return null;
  if (!phoneNumberId || !ID_RE.test(phoneNumberId) || !wabaId || !ID_RE.test(wabaId)) return null;
  if (!payloadSecret || payloadSecret.length < MIN_PAYLOAD_SECRET) return null;
  if (!VERSION_RE.test(graphVersion)) return null;
  return { accessToken, phoneNumberId, wabaId, appSecret, verifyToken, payloadSecret, graphVersion };
}

export interface GraphError extends GraphSendError {
  title: string | null;
  detail: string | null;
}

export type GraphResult<T> = { ok: true; data: T } | { ok: false; error: GraphError };

/** Connection errors raised before any byte of the request reached Meta. */
const BEFORE_SEND_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET_CONNECT",
  "CERT_HAS_EXPIRED",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
]);

function networkStage(error: unknown): "before_send" | "after_send" {
  const err = error as { name?: string; code?: string; cause?: { code?: string; name?: string } } | null;
  // A timeout: the request may already be at Meta.
  if (err?.name === "AbortError" || err?.name === "TimeoutError") return "after_send";
  const code = err?.cause?.code ?? err?.code;
  return code && BEFORE_SEND_CODES.has(code) ? "before_send" : "after_send";
}

function cap(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean ? clean.slice(0, max) : null;
}

type GraphErrorBody = {
  error?: { code?: unknown; message?: unknown; error_user_title?: unknown; error_user_msg?: unknown; error_data?: { details?: unknown } };
};

async function graphRequest<T>(
  config: WhatsAppConfig,
  method: "GET" | "POST",
  path: string,
  { body, query }: { body?: unknown; query?: Record<string, string> } = {}
): Promise<GraphResult<T>> {
  const url = new URL(`${GRAPH_BASE}/${config.graphVersion}/${path}`);
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GRAPH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    clearTimeout(timer);
    return {
      ok: false,
      error: { network: networkStage(error), httpStatus: null, code: null, title: "network_error", detail: null },
    };
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  } finally {
    clearTimeout(timer);
  }
  if (res.ok) return { ok: true, data: json as T };
  const err = (json as GraphErrorBody | null)?.error;
  const code = typeof err?.code === "number" && Number.isInteger(err.code) ? err.code : null;
  return {
    ok: false,
    error: {
      code,
      httpStatus: res.status,
      network: null,
      title: cap(err?.error_user_title ?? err?.message, 500) ?? `http_${res.status}`,
      detail: cap(err?.error_data?.details ?? err?.error_user_msg, 2000),
    },
  };
}

// ── Messages ─────────────────────────────────────────────────────────────

export type GraphMessageBody =
  | {
      messaging_product: "whatsapp";
      recipient_type: "individual";
      to: string;
      type: "template";
      template: { name: string; language: { code: string }; components: unknown[] };
      biz_opaque_callback_data?: string;
    }
  | {
      messaging_product: "whatsapp";
      recipient_type: "individual";
      to: string;
      type: "text";
      text: { body: string; preview_url: false };
      context?: { message_id: string };
      biz_opaque_callback_data?: string;
    };

/** `POST /{PHONE_NUMBER_ID}/messages`; the wamid on success. */
export async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  body: GraphMessageBody
): Promise<{ ok: true; wamid: string } | { ok: false; error: GraphError }> {
  const result = await graphRequest<{ messages?: { id?: unknown }[] }>(config, "POST", `${config.phoneNumberId}/messages`, { body });
  if (!result.ok) return result;
  const wamid = result.data?.messages?.[0]?.id;
  if (typeof wamid !== "string" || !wamid || wamid.length > 200) {
    // A 2xx without a message id: Meta took the request, so the outcome is unknown.
    return { ok: false, error: { network: "after_send", httpStatus: null, code: null, title: "no_message_id", detail: null } };
  }
  return { ok: true, wamid };
}

// ── Templates ────────────────────────────────────────────────────────────

/** `POST /{WABA_ID}/message_templates`. */
export async function createMetaTemplate(
  config: WhatsAppConfig,
  definition: MetaTemplateDefinition
): Promise<GraphResult<{ id: string | null; status: string | null; category: string | null }>> {
  const result = await graphRequest<{ id?: unknown; status?: unknown; category?: unknown }>(
    config,
    "POST",
    `${config.wabaId}/message_templates`,
    { body: definition }
  );
  if (!result.ok) return result;
  return {
    ok: true,
    data: {
      id: cap(result.data?.id, 100),
      status: cap(result.data?.status, 30),
      category: cap(result.data?.category, 30),
    },
  };
}

export interface MetaTemplateInfo {
  id: string | null;
  name: string;
  language: string;
  status: string | null;
  category: string | null;
  rejectedReason: string | null;
  quality: string | null;
}

const TEMPLATE_FIELDS = "id,name,language,status,category,rejected_reason,quality_score";
const MAX_TEMPLATE_PAGES = 20;

/** Every template of the WABA (`GET /{WABA_ID}/message_templates`, cursor paging). */
export async function listMetaTemplates(config: WhatsAppConfig): Promise<GraphResult<MetaTemplateInfo[]>> {
  const out: MetaTemplateInfo[] = [];
  let after: string | null = null;
  for (let page = 0; page < MAX_TEMPLATE_PAGES; page += 1) {
    const query: Record<string, string> = { fields: TEMPLATE_FIELDS, limit: "100" };
    if (after) query.after = after;
    const result = await graphRequest<{
      data?: Record<string, unknown>[];
      paging?: { cursors?: { after?: unknown }; next?: unknown };
    }>(config, "GET", `${config.wabaId}/message_templates`, { query });
    if (!result.ok) return result;
    for (const row of result.data?.data ?? []) {
      const name = cap(row.name, 512);
      const language = cap(row.language, 20);
      if (!name || !language) continue;
      const quality = row.quality_score as { score?: unknown } | undefined;
      out.push({
        id: cap(row.id, 100),
        name,
        language,
        status: cap(row.status, 30)?.toLowerCase() ?? null,
        category: cap(row.category, 30),
        rejectedReason: cap(row.rejected_reason, 500),
        quality: cap(quality?.score, 30),
      });
    }
    const next = result.data?.paging?.next;
    const cursor = cap(result.data?.paging?.cursors?.after, 500);
    if (!next || !cursor) break;
    after = cursor;
  }
  return { ok: true, data: out };
}

// ── Phone number ─────────────────────────────────────────────────────────

export interface WhatsAppPhoneInfo {
  displayName: string | null;
  displayPhoneNumber: string | null;
  qualityRating: string | null;
  messagingLimit: string | null;
  nameStatus: string | null;
}

/** `GET /{PHONE_NUMBER_ID}`: the Tallaby number's name, quality rating and messaging limit. */
export async function getWhatsAppPhoneInfo(config: WhatsAppConfig): Promise<GraphResult<WhatsAppPhoneInfo>> {
  const result = await graphRequest<Record<string, unknown>>(config, "GET", config.phoneNumberId, {
    query: { fields: "verified_name,display_phone_number,quality_rating,messaging_limit_tier,name_status" },
  });
  if (!result.ok) return result;
  const d = result.data ?? {};
  return {
    ok: true,
    data: {
      displayName: cap(d.verified_name, 200),
      displayPhoneNumber: cap(d.display_phone_number, 40),
      qualityRating: cap(d.quality_rating, 30),
      messagingLimit: cap(d.messaging_limit_tier, 30),
      nameStatus: cap(d.name_status, 50),
    },
  };
}
