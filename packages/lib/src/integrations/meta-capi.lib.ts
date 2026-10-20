import { z } from "zod";

/**
 * Meta Conversions API for a store's own Pixel (PLAN.md §9.2, P7-05). Pure
 * and edge-safe: the Graph calls take an injectable fetch and a timeout. The
 * access token goes in the request body or an Authorization header, never in
 * a URL, and every error string is redacted before it is returned, so it can
 * be stored in `last_error` or logged.
 */

export type MetaCapiCredentials = {
  pixelId: string;
  accessToken: string;
  testEventCode?: string | null;
};

/** What is encrypted in `store_integrations.credentials_encrypted`. */
export type MetaCapiSecret = { accessToken: string; testEventCode: string | null };

/** The Graph API version, overridable per deployment (same env as the marketplace CAPI). */
export const DEFAULT_META_GRAPH_VERSION = "v21.0";
const GRAPH_VERSION_RE = /^v\d{1,2}\.\d$/;
export const META_CAPI_TIMEOUT_MS = 5_000;

/** System-user tokens are long opaque strings (usually starting with EAA). */
const TOKEN_RE = /^[A-Za-z0-9_\-.|]{32,1024}$/;
/** Events Manager › Test events, e.g. TEST12345. */
const TEST_CODE_RE = /^TEST[A-Z0-9]{1,20}$/;

export type MetaCapiInputError = "invalid_token" | "invalid_test_code";

const inputSchema = z.strictObject({
  accessToken: z.string().max(2048).optional().default(""),
  testEventCode: z.string().max(64).optional().default(""),
});

/**
 * Validates the form input. An empty token means "keep the saved one"
 * (`accessToken: null`); the caller decides whether one is saved.
 */
export function validateMetaCapiInput(
  raw: unknown,
):
  | { success: true; data: { accessToken: string | null; testEventCode: string | null } }
  | { success: false; error: MetaCapiInputError } {
  const parsed = inputSchema.safeParse(raw ?? {});
  if (!parsed.success) return { success: false, error: "invalid_token" };
  const token = parsed.data.accessToken.replace(/\s+/g, "");
  const testCode = parsed.data.testEventCode.trim().toUpperCase();
  if (token && !TOKEN_RE.test(token)) return { success: false, error: "invalid_token" };
  if (testCode && !TEST_CODE_RE.test(testCode)) return { success: false, error: "invalid_test_code" };
  return { success: true, data: { accessToken: token || null, testEventCode: testCode || null } };
}

/**
 * Removes secrets from a message before it is stored or logged: the given
 * values verbatim plus anything shaped like a Meta token, then truncates.
 */
export function redactSecrets(message: string, secrets: Array<string | null | undefined> = []): string {
  let out = message;
  for (const secret of secrets) {
    if (secret && secret.length >= 8) out = out.split(secret).join("[redacted]");
  }
  out = out.replace(/EAA[A-Za-z0-9_\-.|]{8,}/g, "[redacted]").replace(/access_token=[^&\s"]+/gi, "access_token=[redacted]");
  return out.length > 300 ? `${out.slice(0, 297)}...` : out;
}

export type MetaCallResult = { ok: true; data?: unknown } | { ok: false; error: string };

type CallOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  graphVersion?: string;
};

function graphBase(version?: string): string {
  const v = version && GRAPH_VERSION_RE.test(version) ? version : DEFAULT_META_GRAPH_VERSION;
  return `https://graph.facebook.com/${v}`;
}

async function readGraphError(response: Response, token: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: { message?: unknown; code?: unknown } } | null;
  const message = typeof body?.error?.message === "string" ? body.error.message : "";
  const code = typeof body?.error?.code === "number" ? ` (code ${body.error.code})` : "";
  return redactSecrets(`Meta API HTTP ${response.status}${code}${message ? `: ${message}` : ""}`, [token]);
}

async function call(
  url: string,
  init: RequestInit,
  token: string,
  { fetchImpl = fetch, timeoutMs = META_CAPI_TIMEOUT_MS }: CallOptions,
): Promise<MetaCallResult> {
  try {
    const response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) return { ok: false, error: await readGraphError(response, token) };
    return { ok: true, data: await response.json().catch(() => null) };
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    return { ok: false, error: name === "TimeoutError" || name === "AbortError" ? "Meta API timed out" : "Meta API request failed" };
  }
}

/** POSTs server events for the credentials' Pixel. */
export async function postMetaCapiEvents(
  credentials: MetaCapiCredentials,
  events: Array<Record<string, unknown>>,
  options: CallOptions = {},
): Promise<MetaCallResult> {
  const body: Record<string, unknown> = { data: events, access_token: credentials.accessToken };
  if (credentials.testEventCode) body.test_event_code = credentials.testEventCode;
  return call(
    `${graphBase(options.graphVersion)}/${encodeURIComponent(credentials.pixelId)}/events`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    credentials.accessToken,
    options,
  );
}

/**
 * "Test connection": reads the Pixel with the token, which proves the token
 * can reach that Pixel without sending a fake event.
 */
export async function checkMetaCapiAccess(credentials: MetaCapiCredentials, options: CallOptions = {}): Promise<MetaCallResult> {
  const result = await call(
    `${graphBase(options.graphVersion)}/${encodeURIComponent(credentials.pixelId)}?fields=id`,
    { method: "GET", headers: { Authorization: `Bearer ${credentials.accessToken}` } },
    credentials.accessToken,
    options,
  );
  if (!result.ok) return result;
  const id = (result.data as { id?: unknown } | null)?.id;
  return String(id) === credentials.pixelId ? result : { ok: false, error: "Meta API returned a different Pixel" };
}
