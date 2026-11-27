import { createHash } from "crypto";
import { accountOrigin } from "../storefront/platform-hosts.lib";

/**
 * Rules for a buyer's digital download link (ROADMAP.md F-108c; owner,
 * 2026-11-27): the link opens once, and an unopened link stops working after
 * 7 days. A seller can issue a new link (reissueDigitalAccess), which ends
 * the old one. Pure, so it can be tested alone.
 */

/** A link downloads once (new rows only; rows made before F-108c keep their own limit). */
export const DIGITAL_LINK_MAX_DOWNLOADS = 1;

/** An unopened link stops working this many days after it was made. */
export const DIGITAL_LINK_TTL_DAYS = 7;

/**
 * Lifetime of the storage link handed out after the one real download. Long
 * enough for a big video on a slow phone to start; the page link itself is
 * already used up by then.
 */
export const DIGITAL_SIGNED_URL_TTL_SECONDS = 15 * 60;

/** The download page path on account.<root> (apps/ecommerce/app/d/[token]). */
export const DIGITAL_DOWNLOAD_PATH = "/d";

/** Tokens are 32 random bytes in hex (generateDownloadToken). */
const TOKEN_RE = /^[0-9a-f]{64}$/;

export function isDownloadTokenShape(token: string | null | undefined): token is string {
  return typeof token === "string" && TOKEN_RE.test(token);
}

export function digitalLinkExpiresAt(now: Date = new Date()): string {
  return new Date(now.getTime() + DIGITAL_LINK_TTL_DAYS * 24 * 3600 * 1000).toISOString();
}

/**
 * The buyer's link, built in one place: `https://account.tallaby.com/d/<token>`.
 * `lang` (the language the link is sent in) opens the page in that language.
 */
export function digitalDownloadUrl(token: string, options: { lang?: "ar" | "en" | null } = {}): string {
  const url = `${accountOrigin()}${DIGITAL_DOWNLOAD_PATH}/${encodeURIComponent(token)}`;
  return options.lang ? `${url}?lang=${options.lang}` : url;
}

/** Statuses a link can still be used in; `pending` (manual delivery), `expired` and `revoked` can't. */
export const USABLE_DIGITAL_STATUSES = ["delivered", "downloaded"] as const;

/**
 * Whether a link can still download. The SQL in access.server.ts applies the
 * same rule atomically; this copy is for tests and callers that already hold
 * the row. A missing or 0 limit means no limit (rows made before F-108c).
 */
export function isDigitalLinkUsable(
  row: {
    fulfillmentStatus: string;
    downloadCount: number | null;
    maxDownloads: number | null;
    expiresAt: string | null;
  },
  now: Date = new Date(),
): boolean {
  if (!(USABLE_DIGITAL_STATUSES as readonly string[]).includes(row.fulfillmentStatus)) return false;
  const max = row.maxDownloads ?? 0;
  if (max > 0 && (row.downloadCount ?? 0) >= max) return false;
  if (row.expiresAt && new Date(row.expiresAt).getTime() <= now.getTime()) return false;
  return true;
}

/**
 * Headers on every download page, redirect and error: never indexed, never
 * cached, and the token never leaks to the storage host as a Referer.
 */
export const DIGITAL_DOWNLOAD_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
});

/**
 * The delivery email's `email_deliveries` reference: a uuid derived from the
 * links it carries, so a repeated payment webhook sends nothing new while a
 * new link (new token) mails again.
 */
export function digitalDeliveryReferenceId(tokens: readonly string[]): string {
  if (tokens.length === 0) throw new Error("digital delivery reference needs at least one token");
  const hex = createHash("md5").update(`digital_delivery:${[...tokens].sort().join(",")}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
