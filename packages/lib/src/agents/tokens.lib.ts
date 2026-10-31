/**
 * Opaque MCP tokens and PKCE (ROADMAP.md F-29b, design note §4.3). Tokens are
 * 32 random bytes with a readable prefix; only a 64-char hex digest is stored
 * (sha256, or HMAC-sha256 with `MCP_TOKEN_PEPPER` when set — the dashboard
 * and the backend must use the same pepper). Pure apart from node:crypto.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const TOKEN_PREFIXES = {
  access: "tby_at_",
  refresh: "tby_rt_",
  pat: "tby_pat_",
  code: "tby_ac_",
  client: "tby_cl_",
} as const;

export type TokenKind = keyof typeof TOKEN_PREFIXES;

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const AUTH_CODE_TTL_SECONDS = 60;

export function generateToken(kind: TokenKind): string {
  return `${TOKEN_PREFIXES[kind]}${randomBytes(32).toString("base64url")}`;
}

/** The stored form of a token or code: always 64 hex characters. */
export function hashToken(token: string, pepper?: string | null): string {
  return pepper
    ? createHmac("sha256", pepper).update(token).digest("hex")
    : createHash("sha256").update(token).digest("hex");
}

/** Which kind a presented token claims to be, from its prefix (null for anything else). */
export function tokenKindOf(token: string): TokenKind | null {
  for (const [kind, prefix] of Object.entries(TOKEN_PREFIXES) as [TokenKind, string][]) {
    if (token.startsWith(prefix) && token.length > prefix.length + 40 && token.length < prefix.length + 60) return kind;
  }
  return null;
}

/** RFC 7636: 43–128 chars of [A-Z a-z 0-9 - . _ ~]. */
const PKCE_RE = /^[A-Za-z0-9\-._~]{43,128}$/;

export function isValidCodeVerifier(value: unknown): value is string {
  return typeof value === "string" && PKCE_RE.test(value);
}

/** An S256 challenge is base64url(sha256(verifier)) = exactly 43 chars. */
export function isValidCodeChallenge(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9\-_]{43}$/.test(value);
}

export function pkceChallengeS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function verifyPkceS256(verifier: string, challenge: string): boolean {
  if (!isValidCodeVerifier(verifier) || !isValidCodeChallenge(challenge)) return false;
  const expected = Buffer.from(pkceChallengeS256(verifier));
  const actual = Buffer.from(challenge);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
