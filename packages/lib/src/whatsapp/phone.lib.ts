/**
 * Phones for WhatsApp (docs/whatsapp.md §4 Phone). Pure, safe on the client.
 *
 * Meta's Cloud API takes E.164 digits without `+`. Every spelling of an
 * Egyptian mobile (`010…`, `+20 10…`, `0020…`, `2010…`, Arabic digits) becomes
 * `201XXXXXXXXX`; a foreign number is accepted when it is already written in
 * international form (`+9665…`, `009665…`, the F-61e stored form). Anything
 * else is null and the message is not sent.
 */
import { normalizeForeignPhone } from "../address/phone.lib";
import { normalizeEgyptianMobile } from "../stores/blocked-phones.lib";

const E164_DIGITS_RE = /^[1-9]\d{7,14}$/;
const LOOKS_LIKE_PHONE_RE = /^[+()\d\s.-]+$/;

/** `01012345678` → `201012345678`; `+966512345678` → `966512345678`; null when it can't be read. */
export function toWhatsAppPhone(raw: string | null | undefined): string | null {
  if (typeof raw !== "string" || raw.length > 40) return null;
  const text = raw.replace(/[٠-٩۰-۹]/g, (d) => String((d.charCodeAt(0) & 0xf) % 10)).trim();
  if (!LOOKS_LIKE_PHONE_RE.test(text)) return null;
  const egyptian = normalizeEgyptianMobile(text);
  if (egyptian) return `20${egyptian.slice(1)}`;
  // A foreign number only in international form; a bare local number can't be read safely.
  if (!text.startsWith("+") && !text.startsWith("00")) return null;
  const foreign = normalizeForeignPhone(text);
  const digits = foreign?.slice(1) ?? "";
  return E164_DIGITS_RE.test(digits) ? digits : null;
}

/** Whether a value is already in the stored form (E.164 digits, no `+`). */
export function isWhatsAppPhone(value: unknown): value is string {
  return typeof value === "string" && E164_DIGITS_RE.test(value);
}

const MASK = "•";

/**
 * A phone for seller UI and logs: `201012345678` → `+20 10•••••678`; a
 * foreign number keeps its first three and last three digits. Empty for an
 * unreadable value.
 */
export function maskPhone(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/^\+/, "");
  if (!E164_DIGITS_RE.test(digits)) return "";
  if (digits.startsWith("20") && digits.length === 12) {
    return `+20 ${digits.slice(2, 4)}${MASK.repeat(5)}${digits.slice(-3)}`;
  }
  return `+${digits.slice(0, 3)} ${MASK.repeat(Math.max(digits.length - 6, 1))}${digits.slice(-3)}`;
}
