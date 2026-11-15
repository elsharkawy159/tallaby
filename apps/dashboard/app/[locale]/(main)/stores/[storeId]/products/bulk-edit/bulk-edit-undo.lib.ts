import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { BULK_EDIT_UNDO_MS } from "./bulk-edit.dto";
import type { ProductValues } from "./bulk-edit.lib";

/**
 * The Undo token of a bulk edit (ROADMAP.md F-24b). It carries, per product,
 * the values the edit replaced (`b`) and the values it wrote (`a`), bound to
 * the seller and valid for 10 minutes. Format:
 * `base64url(deflate(payload)).base64url(hmac-sha256)` (deflated so 500
 * products stay well under the 1 MB server-action body limit). The HMAC key is
 * derived from INTEGRATIONS_ENCRYPTION_KEY with HKDF (no extra secret). Undo
 * only puts a product back when its current values still equal `a`, so a
 * later edit is never overwritten. Server-only.
 */

export type UndoEntry = { id: string; b: ProductValues; a: ProductValues };
export type UndoPayload = { sellerId: string; entries: UndoEntry[]; expiresAt: number };

type Signed = { v: 1; u: string; e: number; r: UndoEntry[] };

/** Big enough for 500 products with variants, small enough to refuse junk. */
const MAX_TOKEN_LENGTH = 900_000;
const MAX_PAYLOAD_BYTES = 16_000_000;

export function deriveUndoKey(key: Buffer): Buffer {
  return Buffer.from(hkdfSync("sha256", key, Buffer.alloc(0), "tallaby:bulk-edit-undo:v1", 32));
}

function mac(encoded: string, key: Buffer): string {
  return createHmac("sha256", key).update(encoded).digest("base64url");
}

export function signUndoToken(
  sellerId: string,
  entries: UndoEntry[],
  key: Buffer,
  now = Date.now(),
): { token: string; expiresAt: number } {
  const expiresAt = now + BULK_EDIT_UNDO_MS;
  const body: Signed = { v: 1, u: sellerId, e: expiresAt, r: entries };
  const encoded = deflateRawSync(Buffer.from(JSON.stringify(body))).toString("base64url");
  return { token: `${encoded}.${mac(encoded, key)}`, expiresAt };
}

/** The payload, or null when the token is malformed, tampered with or expired. */
export function verifyUndoToken(token: unknown, key: Buffer, now = Date.now()): UndoPayload | null {
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts as [string, string];
  const expected = Buffer.from(mac(encoded, key));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const json = inflateRawSync(Buffer.from(encoded, "base64url"), { maxOutputLength: MAX_PAYLOAD_BYTES }).toString("utf8");
    const body = JSON.parse(json) as Signed;
    if (body?.v !== 1 || typeof body.u !== "string" || typeof body.e !== "number" || !Array.isArray(body.r)) return null;
    if (now > body.e) return null;
    return { sellerId: body.u, entries: body.r, expiresAt: body.e };
  } catch {
    return null;
  }
}
