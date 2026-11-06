/**
 * The seller's private pass to a store that isn't activated yet (ROADMAP.md
 * F-76, owner 2026-11-06).
 *
 * A Free seller who isn't activated (`orderLockState` in billing/order-lock.lib.ts)
 * has a store nobody else can visit. The dashboard's "View store" link signs a
 * pass for ONE store and its owner; the store host checks it at
 * /api/store-owner-pass and keeps it in an httpOnly cookie on that host. Every
 * storefront request re-verifies it against the store of the request HOST and
 * that store's seller (never ids from the request), so a pass for store A never
 * opens store B, and a pass from before a store changed hands opens nothing.
 *
 * Same format and secret as the builder preview token (preview-token.ts):
 * base64url(JSON payload) "." base64url(HMAC-SHA256). The HMAC input carries a
 * "owner-pass." prefix, so a builder preview token can never pass as an owner
 * pass or the other way round. Pure (node:crypto only), server-only.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** How long a pass lasts; opening the store from the dashboard again issues a new one. */
export const STORE_OWNER_PASS_TTL_SECONDS = 30 * 24 * 60 * 60;

/** How long the signed link itself may be used before it is swapped for the cookie. */
export const STORE_OWNER_PASS_LINK_TTL_SECONDS = 10 * 60;

/** httpOnly cookie on the store host. */
export const STORE_OWNER_PASS_COOKIE = "tallaby_store_owner";

const DOMAIN = "owner-pass.";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TOKEN_LENGTH = 512;

type Payload = { v: 1; k: "owner"; s: string; u: string; e: number };

export type StoreOwnerPassVerifyError = "malformed" | "signature" | "expired" | "wrong_store";

export type StoreOwnerPassVerifyResult =
  | { ok: true; storeId: string; sellerId: string; expiresAt: number }
  | { ok: false; reason: StoreOwnerPassVerifyError };

function hmac(secret: string, body: string): Buffer {
  return createHmac("sha256", secret).update(DOMAIN + body).digest();
}

export function signStoreOwnerPass(input: {
  storeId: string;
  sellerId: string;
  secret: string;
  /** Seconds; clamped to 1..STORE_OWNER_PASS_TTL_SECONDS. */
  ttlSeconds?: number;
  now?: number;
}): { token: string; expiresAt: number } {
  if (!UUID_RE.test(input.storeId)) throw new Error("invalid store id");
  if (!UUID_RE.test(input.sellerId)) throw new Error("invalid seller id");
  if (!input.secret) throw new Error("missing secret");
  const ttl = Math.min(Math.max(Math.floor(input.ttlSeconds ?? STORE_OWNER_PASS_TTL_SECONDS), 1), STORE_OWNER_PASS_TTL_SECONDS);
  const expiresAt = Math.floor((input.now ?? Date.now()) / 1000) + ttl;
  const payload: Payload = { v: 1, k: "owner", s: input.storeId.toLowerCase(), u: input.sellerId.toLowerCase(), e: expiresAt };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${body}.${hmac(input.secret, body).toString("base64url")}`, expiresAt };
}

/**
 * Checks the signature (timing-safe), the expiry, and that the pass was issued
 * for `storeId` AND `sellerId`: the store of the request host and its owner,
 * both read on the server.
 */
export function verifyStoreOwnerPass(
  token: unknown,
  options: { secret: string; storeId: string; sellerId: string; now?: number },
): StoreOwnerPassVerifyResult {
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
    payload.k !== "owner" ||
    typeof payload.s !== "string" ||
    !UUID_RE.test(payload.s) ||
    typeof payload.u !== "string" ||
    !UUID_RE.test(payload.u) ||
    !Number.isInteger(payload.e)
  ) {
    return { ok: false, reason: "malformed" };
  }

  const nowSeconds = Math.floor((options.now ?? Date.now()) / 1000);
  // Also refuse passes that claim a life longer than the maximum.
  if (payload.e <= nowSeconds || payload.e - nowSeconds > STORE_OWNER_PASS_TTL_SECONDS) {
    return { ok: false, reason: "expired" };
  }
  if (payload.s !== String(options.storeId).toLowerCase() || payload.u !== String(options.sellerId).toLowerCase()) {
    return { ok: false, reason: "wrong_store" };
  }
  return { ok: true, storeId: payload.s, sellerId: payload.u, expiresAt: payload.e };
}
