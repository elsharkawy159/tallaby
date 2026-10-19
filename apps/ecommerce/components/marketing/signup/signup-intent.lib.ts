// Copied from apps/dashboard/app/signup (P2-03). Keep both in sync.
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The signup choices (store address + phone) carried across the Google OAuth
 * round-trip (PLAN.md §6.5). Stored in an httpOnly cookie as
 * `base64url(payload).base64url(hmac-sha256)`, valid for 15 minutes. The
 * server re-validates the values when it uses them; the signature only proves
 * the cookie came from us.
 */

export type SignupIntent = { subdomain: string; phone: string };

export const SIGNUP_INTENT_TTL_MS = 15 * 60 * 1000;
const MIN_SECRET_LENGTH = 32;
const MAX_TOKEN_LENGTH = 1024;

type Payload = SignupIntent & { exp: number };

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signSignupIntent(intent: SignupIntent, secret: string, now = Date.now()): string {
  if (secret.length < MIN_SECRET_LENGTH) throw new Error("SIGNUP_INTENT_SECRET is missing or too short");
  const payload: Payload = { subdomain: intent.subdomain, phone: intent.phone, exp: now + SIGNUP_INTENT_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifySignupIntent(token: string, secret: string, now = Date.now()): SignupIntent | null {
  if (secret.length < MIN_SECRET_LENGTH || !token || token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts as [string, string];

  const expected = Buffer.from(sign(encoded, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<Payload>;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (typeof payload.subdomain !== "string" || typeof payload.phone !== "string") return null;
    return { subdomain: payload.subdomain, phone: payload.phone };
  } catch {
    return null;
  }
}
