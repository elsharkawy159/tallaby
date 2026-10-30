/**
 * Retargeting audiences (ROADMAP.md F-16b): pure helpers that turn a store's
 * customers, missed-order leads or newsletter subscribers into a custom
 * audience file for Meta or TikTok Ads. Shared by the server action and its
 * tests; the database side is audiences.server.ts. Safe on the client.
 *
 * File formats (both platforms hash the values in the browser on upload, so
 * the file holds plain, normalised values):
 * - `meta`: Meta Ads Manager › Audiences › Custom audience › Customer list.
 *   A CSV with a header row using Meta's identifier names: `email`, `phone`,
 *   `fn`, `ln`, `ct`, `country`. Phones in E.164 (`+201012345678`), emails
 *   lower-cased; Meta maps these headers automatically.
 * - `tiktok_phone` / `tiktok_email`: TikTok Ads Manager › Assets › Audiences ›
 *   Custom audience › Customer file. One identifier type per file, one value
 *   per line, no header (the type is picked in the upload form). Phones in
 *   E.164 with the `+`, emails lower-cased.
 */
import type { StoreCustomer } from "../customers/customers.lib";
import { normalizeBlockedPhone } from "../stores/blocked-phones.lib";

export const AUDIENCE_SEGMENTS = ["buyers", "all", "refused", "leads", "subscribers"] as const;
export type AudienceSegment = (typeof AUDIENCE_SEGMENTS)[number];

export const AUDIENCE_FORMATS = ["meta", "tiktok_phone", "tiktok_email"] as const;
export type AudienceFormat = (typeof AUDIENCE_FORMATS)[number];

export const parseAudienceSegment = (value: unknown): AudienceSegment | null =>
  AUDIENCE_SEGMENTS.includes(value as AudienceSegment) ? (value as AudienceSegment) : null;
export const parseAudienceFormat = (value: unknown): AudienceFormat | null =>
  AUDIENCE_FORMATS.includes(value as AudienceFormat) ? (value as AudienceFormat) : null;

/** Most rows one export holds (Meta and TikTok take far more; this caps the server work). */
export const AUDIENCE_MAX_ROWS = 20_000;

/** One person from any source, before normalising. */
export type AudienceContact = {
  phone: string | null;
  email: string | null;
  name: string | null;
  city: string | null;
};

/** One line of the file: normalised identifiers. */
export type AudienceRow = {
  /** E.164, e.g. `+201012345678`; null when there is no usable phone. */
  phone: string | null;
  /** Lower-cased; null when there is no usable email. */
  email: string | null;
  firstName: string;
  lastName: string;
  city: string;
};

/** Arabic-Indic and Persian digits → ASCII. */
const asciiDigits = (input: string) =>
  input.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));

/**
 * A phone in E.164. Egyptian mobiles in any spelling (`010…`, `+20 10…`,
 * `0020…`, Arabic digits) become `+2010…`; a number typed with an
 * international prefix (`+` or `00`) keeps its country code. Anything else
 * (landlines without a code, short or garbage input) is null, since an ad
 * platform could not match it.
 */
export function toE164Phone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const mobile = normalizeBlockedPhone(raw);
  if (mobile) return `+20${mobile.slice(1)}`;
  const text = asciiDigits(raw).trim();
  const international = /^(\+|00)/.test(text);
  if (!international) return null;
  const digits = text.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) return null;
  return `+${digits}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trimmed and lower-cased; null for a malformed address or a guest placeholder (`@temp.local`). */
export function normalizeAudienceEmail(raw: string | null | undefined): string | null {
  const value = raw?.trim().toLowerCase();
  if (!value || value.length > 254 || !EMAIL_RE.test(value) || value.endsWith("@temp.local")) return null;
  return value;
}

/** Free text for a name or city cell: one line, no leading formula characters. */
function cleanText(raw: string | null | undefined): string {
  return (raw ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[=+\-@]+/, "")
    .trim();
}

/** `Mona Ahmed Ali` → first `Mona`, last `Ahmed Ali`; the "Guest User" placeholder is no name. */
export function splitName(raw: string | null | undefined): { firstName: string; lastName: string } {
  const name = cleanText(raw);
  if (!name || name === "Guest User") return { firstName: "", lastName: "" };
  const [first = "", ...rest] = name.split(" ");
  return { firstName: first, lastName: rest.join(" ") };
}

/**
 * Normalises and de-duplicates contacts: a row needs an E.164 phone or a
 * valid email; the same phone or email appears once (the first contact
 * wins, so pass the newest first). Phones in `blockedPhones`
 * (`01XXXXXXXXX`, the blocklist form) are dropped.
 */
export function buildAudienceRows(
  contacts: readonly AudienceContact[],
  options: { blockedPhones?: ReadonlySet<string> } = {},
): AudienceRow[] {
  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();
  const out: AudienceRow[] = [];
  for (const contact of contacts) {
    const local = contact.phone ? normalizeBlockedPhone(contact.phone) : null;
    if (local && options.blockedPhones?.has(local)) continue;
    let phone = toE164Phone(contact.phone);
    let email = normalizeAudienceEmail(contact.email);
    if (phone && seenPhones.has(phone)) phone = null;
    if (email && seenEmails.has(email)) email = null;
    if (!phone && !email) continue;
    if (phone) seenPhones.add(phone);
    if (email) seenEmails.add(email);
    out.push({ phone, email, ...splitName(contact.name), city: cleanText(contact.city) });
    if (out.length === AUDIENCE_MAX_ROWS) break;
  }
  return out;
}

/** Which store customers belong to a customer segment. Leads and subscribers come from other tables. */
export function customersInSegment(
  customers: readonly StoreCustomer[],
  segment: Extract<AudienceSegment, "buyers" | "all" | "refused">,
): StoreCustomer[] {
  if (segment === "buyers") return customers.filter((c) => c.deliveredCount > 0);
  if (segment === "refused") return customers.filter((c) => c.refusedCount > 0 || c.cancelledCount > 0);
  return [...customers];
}

/** Blocked phones are left out of every segment except "refused", which is mostly used as an exclusion list. */
export const segmentExcludesBlocked = (segment: AudienceSegment) => segment !== "refused";

/** One CSV cell: quoted when it holds a comma, quote or line break. */
export function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const META_HEADER = ["email", "phone", "fn", "ln", "ct", "country"] as const;

/** The file text for `format`, with CRLF line ends. Empty identifiers are skipped in the TikTok files. */
export function audienceFile(rows: readonly AudienceRow[], format: AudienceFormat): string {
  if (format === "tiktok_phone" || format === "tiktok_email") {
    const values = rows.map((r) => (format === "tiktok_phone" ? r.phone : r.email)).filter((v): v is string => Boolean(v));
    return values.length ? `${values.join("\r\n")}\r\n` : "";
  }
  const lines = [META_HEADER.join(",")];
  for (const row of rows) {
    lines.push(
      [row.email ?? "", row.phone ?? "", row.firstName, row.lastName, row.city, row.phone?.startsWith("+20") ? "EG" : ""]
        .map(csvCell)
        .join(","),
    );
  }
  return `${lines.join("\r\n")}\r\n`;
}

/** How many lines the file will hold for `format`. */
export function audienceFileCount(rows: readonly AudienceRow[], format: AudienceFormat): number {
  if (format === "tiktok_phone") return rows.filter((r) => r.phone).length;
  if (format === "tiktok_email") return rows.filter((r) => r.email).length;
  return rows.length;
}

/** `audience-buyers-meta-2026-10-30.csv` */
export function audienceFileName(segment: AudienceSegment, format: AudienceFormat, date: string): string {
  return `audience-${segment}-${format.replace("_", "-")}-${date}.csv`;
}
