/**
 * "Preview on my store" tokens (PLAN.md P4-08, §17 isolation test 8).
 *
 * The dashboard signs a short-lived token for ONE store and the draft it saw
 * (`draftKey`, a hash of the store's draft site). The storefront only renders
 * the draft when the token verifies for the store of the request HOST and the
 * draft is still the same, so a token for store A never shows on B's host and
 * a leaked link dies with the next edit or after 15 minutes.
 *
 * Format: base64url(JSON payload) "." base64url(HMAC-SHA256(payload)).
 * Pure (node:crypto only), no database access. Server-only: the secret
 * (`STORE_PREVIEW_SECRET`) must never reach a client bundle.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Upper bound on a token's life (PLAN.md §17: ≤ 15 min). */
export const STORE_PREVIEW_MAX_TTL_SECONDS = 15 * 60;

/** Name of the httpOnly cookie that carries the token on the store host. */
export const STORE_PREVIEW_COOKIE = "tallaby_store_preview";

/** Shorter secrets are treated as unset (fail closed). */
export const STORE_PREVIEW_SECRET_MIN_LENGTH = 32;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DRAFT_KEY_RE = /^[0-9a-f]{16,64}$/;
const MAX_TOKEN_LENGTH = 512;

type Payload = { v: 1; s: string; d: string; e: number };

export type StorePreviewVerifyError = "malformed" | "signature" | "expired" | "wrong_store";

export type StorePreviewVerifyResult =
  | { ok: true; storeId: string; draftKey: string; expiresAt: number }
  | { ok: false; reason: StorePreviewVerifyError };

/**
 * The preview secret, or null when the feature is off. Callers must treat
 * null as "no preview" (button hidden, storefront ignores tokens).
 */
export function storePreviewSecret(env: Record<string, string | undefined> = process.env): string | null {
  const secret = env.STORE_PREVIEW_SECRET?.trim();
  return secret && secret.length >= STORE_PREVIEW_SECRET_MIN_LENGTH ? secret : null;
}

/** Stable fingerprint of a draft (any JSON value): sorted keys, SHA-256, 32 hex chars. */
export function storeDraftKey(draft: unknown): string {
  return createHash("sha256").update(stableStringify(draft)).digest("hex").slice(0, 32);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item ?? null)).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

function hmac(secret: string, data: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

export function signStorePreviewToken(input: {
  storeId: string;
  draftKey: string;
  secret: string;
  /** Seconds; clamped to 1..STORE_PREVIEW_MAX_TTL_SECONDS. */
  ttlSeconds?: number;
  now?: number;
}): { token: string; expiresAt: number } {
  if (!UUID_RE.test(input.storeId)) throw new Error("invalid store id");
  if (!DRAFT_KEY_RE.test(input.draftKey)) throw new Error("invalid draft key");
  if (!input.secret) throw new Error("missing secret");
  const ttl = Math.min(Math.max(Math.floor(input.ttlSeconds ?? STORE_PREVIEW_MAX_TTL_SECONDS), 1), STORE_PREVIEW_MAX_TTL_SECONDS);
  const expiresAt = Math.floor((input.now ?? Date.now()) / 1000) + ttl;
  const payload: Payload = { v: 1, s: input.storeId.toLowerCase(), d: input.draftKey, e: expiresAt };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${body}.${hmac(input.secret, body).toString("base64url")}`, expiresAt };
}

/**
 * Checks signature (timing-safe), expiry, and that the token was issued for
 * `storeId` (the store resolved from the request host, never from the token).
 */
export function verifyStorePreviewToken(
  token: unknown,
  options: { secret: string; storeId: string; now?: number },
): StorePreviewVerifyResult {
  if (typeof token !== "string" || token.length > MAX_TOKEN_LENGTH || !options.secret) {
    return { ok: false, reason: "malformed" };
  }
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "malformed" };
  const [body, signature] = parts as [string, string];

  const expected = hmac(options.secret, body);
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { ok: false, reason: "signature" };
  }

  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    !payload ||
    payload.v !== 1 ||
    typeof payload.s !== "string" ||
    !UUID_RE.test(payload.s) ||
    typeof payload.d !== "string" ||
    !DRAFT_KEY_RE.test(payload.d) ||
    !Number.isInteger(payload.e)
  ) {
    return { ok: false, reason: "malformed" };
  }

  const nowSeconds = Math.floor((options.now ?? Date.now()) / 1000);
  // Also refuse tokens that claim a life longer than the maximum.
  if (payload.e <= nowSeconds || payload.e - nowSeconds > STORE_PREVIEW_MAX_TTL_SECONDS) {
    return { ok: false, reason: "expired" };
  }
  if (payload.s !== String(options.storeId).toLowerCase()) return { ok: false, reason: "wrong_store" };

  return { ok: true, storeId: payload.s, draftKey: payload.d, expiresAt: payload.e };
}
