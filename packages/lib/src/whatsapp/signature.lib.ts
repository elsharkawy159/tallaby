/**
 * Meta webhook signature (docs/whatsapp.md §4, §8). Server-only use: the app
 * secret (`WHATSAPP_APP_SECRET`) is passed in by the caller.
 *
 * `X-Hub-Signature-256: sha256=<hex>` is HMAC-SHA256 of the raw request body
 * with the app secret. Check it on the raw bytes, before any parse.
 */
import { createHmac, timingSafeEqual } from "crypto";

const HEADER_RE = /^sha256=([0-9a-fA-F]{64})$/;

/** True only for a well-formed header whose HMAC matches; false for anything missing or malformed. */
export function verifyMetaSignature(
  rawBody: Uint8Array | string,
  header: string | null | undefined,
  appSecret: string | null | undefined
): boolean {
  if (!appSecret || typeof header !== "string") return false;
  const match = HEADER_RE.exec(header.trim());
  if (!match) return false;
  const body = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : Buffer.from(rawBody);
  const expected = createHmac("sha256", appSecret).update(body).digest();
  const given = Buffer.from(match[1]!.toLowerCase(), "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
