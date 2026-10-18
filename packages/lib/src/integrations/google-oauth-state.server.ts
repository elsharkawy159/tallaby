import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { parseIntegrationKey } from "./crypto.server";

/**
 * Signed OAuth `state` for Google Sheets (PLAN.md §9.2, P7-06). It binds the
 * round-trip to the seller and store that started it and to a nonce the
 * browser holds in an httpOnly cookie (CSRF), and expires after 10 minutes.
 * Format: `base64url(payload).base64url(hmac-sha256)`. The HMAC key is derived
 * from INTEGRATIONS_ENCRYPTION_KEY with HKDF, so no extra secret is needed.
 */

export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const MAX_STATE_LENGTH = 1024;

export type OAuthStatePayload = { sellerId: string; storeId: string; nonce: string };
type Signed = { s: string; u: string; n: string; e: number };

export function deriveOAuthStateKey(key: Buffer = parseIntegrationKey()): Buffer {
  return Buffer.from(hkdfSync("sha256", key, Buffer.alloc(0), "tallaby:google-oauth-state:v1", 32));
}

export function newOAuthNonce(): string {
  return randomBytes(18).toString("base64url");
}

function mac(encoded: string, key: Buffer): string {
  return createHmac("sha256", key).update(encoded).digest("base64url");
}

export function signOAuthState(payload: OAuthStatePayload, key: Buffer = deriveOAuthStateKey(), now = Date.now()): string {
  const body: Signed = { s: payload.storeId, u: payload.sellerId, n: payload.nonce, e: now + OAUTH_STATE_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${encoded}.${mac(encoded, key)}`;
}

/** The payload, or null when the state is malformed, tampered with or expired. */
export function verifyOAuthState(token: unknown, key: Buffer = deriveOAuthStateKey(), now = Date.now()): OAuthStatePayload | null {
  if (typeof token !== "string" || !token || token.length > MAX_STATE_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts as [string, string];
  const expected = Buffer.from(mac(encoded, key));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const body = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<Signed>;
    if (typeof body.e !== "number" || body.e < now) return null;
    if (typeof body.s !== "string" || typeof body.u !== "string" || typeof body.n !== "string") return null;
    return { storeId: body.s, sellerId: body.u, nonce: body.n };
  } catch {
    return null;
  }
}

/** Constant-time nonce comparison (state nonce vs the httpOnly cookie). */
export function nonceMatches(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
