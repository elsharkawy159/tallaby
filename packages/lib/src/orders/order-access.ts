import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_MS = 90 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.ORDER_ACCESS_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("ORDER_ACCESS_SECRET is required in production");
  }

  return "dev-order-access-secret";
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/** Issue a signed access token for guest/cross-device order page access. */
export function signOrderAccess(orderId: string): string {
  const expiry = Date.now() + TTL_MS;
  const payload = `${orderId}:${expiry}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const signature = signPayload(payload);
  return `${encoded}.${signature}`;
}

/** Verify a signed access token matches the order and has not expired. */
export function verifyOrderAccess(orderId: string, token: string): boolean {
  if (!token || !orderId) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;

  const encoded = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const colon = payload.lastIndexOf(":");
  if (colon <= 0) return false;

  const tokenOrderId = payload.slice(0, colon);
  const expiryStr = payload.slice(colon + 1);
  const expiry = Number(expiryStr);

  if (tokenOrderId !== orderId || !Number.isFinite(expiry) || Date.now() > expiry) {
    return false;
  }

  const expectedSig = signPayload(payload);

  try {
    const a = Buffer.from(providedSig);
    const b = Buffer.from(expectedSig);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Build the order tracking page path with an access token query param. */
export function buildOrderPagePath(orderId: string): string {
  const access = signOrderAccess(orderId);
  return `/orders/${orderId}?access=${encodeURIComponent(access)}`;
}

/** Build an absolute order tracking URL — used by emails and other off-site links. */
export function buildOrderPageUrl(orderId: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${buildOrderPagePath(orderId)}`;
}
