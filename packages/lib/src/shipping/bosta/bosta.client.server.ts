import { bostaErrorReason, type BostaErrorReason } from "./bosta-errors.lib";
import type {
  BostaCreateDeliveryRequest,
  BostaCreatedDelivery,
  BostaDelivery,
  BostaPickupLocation,
} from "./bosta.types";

/**
 * Bosta API v2 client for a seller's own Bosta account (plan §1, §4.2). Server
 * only: the API key is decrypted from `store_integrations` by the caller and
 * passed per call. The host is fixed (no seller-supplied URLs), every call
 * has a timeout, and the key never reaches an error message or a log.
 */

export const BOSTA_API_BASE = "https://app.bosta.co/api/v2";
export const BOSTA_TIMEOUT_MS = 15_000;

export type BostaApiError = {
  reason: BostaErrorReason;
  /** HTTP status, or null on a timeout / network failure. */
  status: number | null;
  errorCode: number | null;
  /** Bosta's message with any secret removed, at most 300 characters. */
  message: string;
};

export type BostaResult<T> = { ok: true; data: T } | { ok: false; error: BostaApiError };

export type BostaCallOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export function redactBostaSecrets(message: string, secrets: Array<string | null | undefined> = []): string {
  let out = message;
  for (const secret of secrets) {
    if (secret && secret.length >= 8) out = out.split(secret).join("[redacted]");
  }
  return out.length > 300 ? `${out.slice(0, 297)}...` : out;
}

type Envelope = { success?: unknown; message?: unknown; errorCode?: unknown; data?: unknown };

function readErrorCode(value: unknown): number | null {
  const code = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(code) ? code : null;
}

function apiError(status: number | null, body: Envelope | null, apiKey: string, fallback: string): BostaApiError {
  const errorCode = readErrorCode(body?.errorCode);
  const message = typeof body?.message === "string" && body.message ? body.message : fallback;
  return {
    reason: bostaErrorReason(errorCode, status),
    status,
    errorCode,
    message: redactBostaSecrets(message, [apiKey]),
  };
}

async function call(
  path: string,
  init: { method: "GET" | "POST" | "DELETE"; body?: unknown },
  apiKey: string,
  { fetchImpl = fetch, timeoutMs = BOSTA_TIMEOUT_MS }: BostaCallOptions,
): Promise<BostaResult<Response>> {
  try {
    const response = await fetchImpl(`${BOSTA_API_BASE}${path}`, {
      method: init.method,
      headers: { Authorization: apiKey, "Content-Type": "application/json", Accept: "application/json" },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    return { ok: true, data: response };
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    const timedOut = name === "TimeoutError" || name === "AbortError";
    return {
      ok: false,
      error: {
        reason: timedOut ? "timeout" : "network",
        status: null,
        errorCode: null,
        message: timedOut ? "Bosta API timed out" : "Bosta API request failed",
      },
    };
  }
}

/** Calls Bosta and unwraps `{ success, data }`; any non-2xx or `success: false` is an error. */
async function callJson(
  path: string,
  init: { method: "GET" | "POST" | "DELETE"; body?: unknown },
  apiKey: string,
  options: BostaCallOptions,
): Promise<BostaResult<unknown>> {
  const result = await call(path, init, apiKey, options);
  if (!result.ok) return result;
  const response = result.data;
  const body = (await response.json().catch(() => null)) as Envelope | null;
  if (!response.ok || body?.success === false) {
    return { ok: false, error: apiError(response.status, body, apiKey, `Bosta API HTTP ${response.status}`) };
  }
  return { ok: true, data: body?.data ?? null };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}

function badResponse(what: string): { ok: false; error: BostaApiError } {
  return { ok: false, error: { reason: "unknown", status: 200, errorCode: null, message: `Unexpected Bosta ${what} response` } };
}

function readState(value: unknown): { code: number; value?: string } | null {
  const state = asRecord(value);
  const code = Number(state?.code);
  if (!Number.isInteger(code)) return null;
  return typeof state?.value === "string" ? { code, value: state.value } : { code };
}

function readDelivery(value: unknown): BostaDelivery | null {
  const record = asRecord(value);
  const state = readState(record?.state);
  const id = asString(record?._id);
  const trackingNumber = asString(record?.trackingNumber);
  if (!id || !trackingNumber || !state) return null;
  return {
    _id: id,
    trackingNumber,
    state,
    ...(typeof record?.maskedState === "string" ? { maskedState: record.maskedState } : {}),
    ...(typeof record?.cod === "number" ? { cod: record.cod } : {}),
    ...(typeof record?.businessReference === "string" ? { businessReference: record.businessReference } : {}),
  };
}

function addressLine(value: unknown): string {
  const address = asRecord(value);
  if (!address) return "";
  const city = asRecord(address.city);
  return [asString(address.firstLine), asString(address.district), asString(city?.name)].filter(Boolean).join(", ");
}

/**
 * The account's pickup locations (`GET /pickup-locations`). Also the
 * "verify key" call of the connect wizard: it needs only read access and
 * proves the key works without creating anything.
 */
export async function listBostaPickupLocations(
  apiKey: string,
  options: BostaCallOptions = {},
): Promise<BostaResult<BostaPickupLocation[]>> {
  const result = await callJson("/pickup-locations", { method: "GET" }, apiKey, options);
  if (!result.ok) return result;
  const data = asRecord(result.data);
  const list = Array.isArray(data?.list) ? data.list : Array.isArray(result.data) ? result.data : null;
  if (!list) return badResponse("pickup locations");
  const locations: BostaPickupLocation[] = [];
  for (const entry of list) {
    const record = asRecord(entry);
    const id = asString(record?._id);
    if (!id) continue;
    locations.push({
      _id: id,
      locationName: asString(record?.locationName) || id,
      isDefault: record?.isDefault === true,
      addressLine: addressLine(record?.address),
    });
  }
  return { ok: true, data: locations };
}

/** `POST /deliveries?apiVersion=1`. */
export async function createBostaDelivery(
  apiKey: string,
  body: BostaCreateDeliveryRequest,
  options: BostaCallOptions = {},
): Promise<BostaResult<BostaCreatedDelivery>> {
  const result = await callJson("/deliveries?apiVersion=1", { method: "POST", body }, apiKey, options);
  if (!result.ok) return result;
  const record = asRecord(result.data);
  const id = asString(record?._id);
  const trackingNumber = asString(record?.trackingNumber);
  if (!id || !trackingNumber) return badResponse("create delivery");
  const state = readState(record?.state);
  return {
    ok: true,
    data: {
      _id: id,
      trackingNumber,
      ...(typeof record?.businessReference === "string" ? { businessReference: record.businessReference } : {}),
      ...(state ? { state } : {}),
    },
  };
}

function trackingPath(trackingNumber: string): string {
  return encodeURIComponent(trackingNumber.trim());
}

/** `GET /deliveries/business/{trackingNumber}`: the current state, straight from Bosta. */
export async function getBostaDelivery(
  apiKey: string,
  trackingNumber: string,
  options: BostaCallOptions = {},
): Promise<BostaResult<BostaDelivery>> {
  const result = await callJson(`/deliveries/business/${trackingPath(trackingNumber)}`, { method: "GET" }, apiKey, options);
  if (!result.ok) return result;
  const delivery = readDelivery(result.data);
  return delivery ? { ok: true, data: delivery } : badResponse("delivery");
}

/**
 * `POST /deliveries/search` by business reference, to re-link an order whose
 * create call succeeded at Bosta but whose response was lost.
 */
export async function findBostaDeliveryByReference(
  apiKey: string,
  businessReference: string,
  options: BostaCallOptions = {},
): Promise<BostaResult<BostaDelivery | null>> {
  const result = await callJson("/deliveries/search", { method: "POST", body: { businessReference } }, apiKey, options);
  if (!result.ok) return result;
  const data = asRecord(result.data);
  const list = Array.isArray(data?.deliveries)
    ? data.deliveries
    : Array.isArray(data?.list)
      ? data.list
      : Array.isArray(result.data)
        ? result.data
        : data
          ? [data]
          : [];
  for (const entry of list) {
    const delivery = readDelivery(entry);
    if (delivery && delivery.businessReference === businessReference) return { ok: true, data: delivery };
  }
  return { ok: true, data: null };
}

/**
 * `DELETE /deliveries/business/{trackingNumber}/terminate`. Needs a Full
 * access key and works only before pickup.
 */
export async function terminateBostaDelivery(
  apiKey: string,
  trackingNumber: string,
  options: BostaCallOptions = {},
): Promise<BostaResult<null>> {
  const result = await callJson(
    `/deliveries/business/${trackingPath(trackingNumber)}/terminate`,
    { method: "DELETE" },
    apiKey,
    options,
  );
  return result.ok ? { ok: true, data: null } : result;
}

/** Bosta returns the PDF inline for up to 50 AWBs; above that it emails them. */
export const BOSTA_AWB_INLINE_MAX = 50;

export type BostaAwbType = "A4" | "A6";

/**
 * `POST /deliveries/mass-awb` → the labels as one base64 PDF. The response
 * wrapper is not documented, so a raw PDF, a base64 string and `{ data }`
 * are all accepted.
 */
export async function printBostaAwbs(
  apiKey: string,
  trackingNumbers: string[],
  { type, lang }: { type: BostaAwbType; lang: "ar" | "en" },
  options: BostaCallOptions = {},
): Promise<BostaResult<string>> {
  const unique = [...new Set(trackingNumbers.map((n) => n.trim()).filter(Boolean))];
  if (unique.length === 0 || unique.length > BOSTA_AWB_INLINE_MAX) {
    return { ok: false, error: { reason: "unknown", status: null, errorCode: null, message: "Between 1 and 50 labels per print" } };
  }
  const result = await call(
    "/deliveries/mass-awb",
    { method: "POST", body: { trackingNumbers: unique.join(","), requestedAwbType: type, lang } },
    apiKey,
    options,
  );
  if (!result.ok) return result;
  const response = result.data;
  const contentType = response.headers.get("content-type") ?? "";

  if (response.ok && contentType.includes("application/pdf")) {
    return { ok: true, data: Buffer.from(await response.arrayBuffer()).toString("base64") };
  }

  const text = await response.text().catch(() => "");
  let body: Envelope | null = null;
  try {
    body = JSON.parse(text) as Envelope;
  } catch {
    body = null;
  }
  if (!response.ok || body?.success === false) {
    return { ok: false, error: apiError(response.status, body, apiKey, `Bosta API HTTP ${response.status}`) };
  }
  const base64 = typeof body?.data === "string" ? body.data : body === null ? text.trim() : "";
  return /^[A-Za-z0-9+/=\r\n]{100,}$/.test(base64) ? { ok: true, data: base64.replace(/\s+/g, "") } : badResponse("label");
}
