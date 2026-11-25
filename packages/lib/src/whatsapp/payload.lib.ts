/**
 * Signed quick-reply payloads (docs/whatsapp.md §4 Buttons, §8). Server-only
 * use: the secret (`WHATSAPP_PAYLOAD_SECRET`) is passed in by the caller.
 *
 * Format: `TB1.<c|x>.<messageId>.<sig>`, where `c` = confirm, `x` = cancel and
 * `sig` = the first 16 hex chars of HMAC-SHA256(secret, `<c|x>:<messageId>`).
 * The payload names only our own message id; the order is read from that row.
 */
import { createHmac, timingSafeEqual } from "crypto";

export type QuickReplyAction = "confirm" | "cancel";

const ACTION_CODE: Record<QuickReplyAction, "c" | "x"> = { confirm: "c", cancel: "x" };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PAYLOAD_RE = /^TB1\.([cx])\.([0-9a-f-]{36})\.([0-9a-f]{16})$/;

/** The shortest secret accepted (the env asks for 32+ random bytes). */
export const MIN_PAYLOAD_SECRET_LENGTH = 32;

function signature(code: "c" | "x", messageId: string, secret: string): string {
  return createHmac("sha256", secret).update(`${code}:${messageId}`).digest("hex").slice(0, 16);
}

/** The payload for a quick-reply button of `messageId` (a whatsapp_messages id). */
export function signQuickReplyPayload(action: QuickReplyAction, messageId: string, secret: string): string {
  if (!secret || secret.length < MIN_PAYLOAD_SECRET_LENGTH) throw new Error("whatsapp: payload secret is missing or too short");
  const id = messageId.toLowerCase();
  if (!UUID_RE.test(id)) throw new Error("whatsapp: message id must be a uuid");
  const code = ACTION_CODE[action];
  return `TB1.${code}.${id}.${signature(code, id, secret)}`;
}

/** The action and message id of a tapped button, or null when the payload is malformed or its signature is wrong. */
export function verifyQuickReplyPayload(
  payload: string | null | undefined,
  secret: string
): { action: QuickReplyAction; messageId: string } | null {
  if (typeof payload !== "string" || !secret || secret.length < MIN_PAYLOAD_SECRET_LENGTH) return null;
  const match = PAYLOAD_RE.exec(payload);
  if (!match) return null;
  const [, code, messageId, sig] = match as unknown as [string, "c" | "x", string, string];
  if (!UUID_RE.test(messageId)) return null;
  const expected = Buffer.from(signature(code, messageId, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { action: code === "c" ? "confirm" : "cancel", messageId };
}
