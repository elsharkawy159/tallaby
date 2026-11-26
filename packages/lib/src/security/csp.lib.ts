/**
 * Defence-in-depth Content-Security-Policy for pages that may carry seller
 * HTML (code sections, ROADMAP.md F-101; design note
 * docs/superpowers/specs/2026-11-20-code-sections-design.md §2, §7.1–7.2).
 * Pure and edge-safe: both proxies (ecommerce storefront hosts, dashboard
 * builder) build their headers here.
 *
 * - Enforced: `object-src 'none'; base-uri 'self'`. No storefront, checkout or
 *   builder page uses <object>, <embed> or <base href> (inventory 2026-11-26),
 *   and every rich-text and code-section cleaner drops them.
 * - Report-only: the same pair plus `form-action` and `frame-src` limited to
 *   the origins the pages really use. Violations show in the browser console
 *   only: there is no report endpoint yet, so no `report-uri`/`report-to`.
 * - Never `script-src` here: the fixed integration scripts need nonces first
 *   (F-101i).
 */

export const CSP_HEADER = "Content-Security-Policy";
export const CSP_REPORT_ONLY_HEADER = "Content-Security-Policy-Report-Only";

/** Enforced everywhere this module applies. */
export const ENFORCED_CSP = "object-src 'none'; base-uri 'self'";

/**
 * Card gateways a shopper is sent to from checkout (server redirect,
 * `window.location`, or the Paymob iframe): Paymob unified checkout, Kashier
 * hosted sessions, EasyKash (also behind Tallaby Pay).
 */
export const PAYMENT_GATEWAY_ORIGINS = [
  "https://accept.paymob.com",
  "https://payments.kashier.io",
  "https://www.easykash.net",
] as const;

/** Players the video element frames (packages/store-sections/src/elements/video.ts `videoEmbedUrl`). */
export const VIDEO_EMBED_ORIGINS = [
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
  "https://www.tiktok.com",
  "https://www.instagram.com",
  "https://www.facebook.com",
] as const;

/**
 * Frames the fixed tracking scripts add on their own (gtag/GTM for Google Ads,
 * the Snap pixel's cookie sync). Best effort: confirm on staging.
 */
export const TRACKING_FRAME_ORIGINS = [
  "https://www.googletagmanager.com",
  "https://td.doubleclick.net",
  "https://tr.snapchat.com",
] as const;

/** `https://host[:port]` only, so a value can never add a directive (`;`, spaces, quotes). */
const ORIGIN_RE = /^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*(?::\d{1,5})?$/;

export function isCspOrigin(value: string): boolean {
  return ORIGIN_RE.test(value);
}

/** The https origin of a URL (e.g. the Supabase project URL from env), or null. */
export function cspOriginOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol, origin } = new URL(url);
    return protocol === "https:" && isCspOrigin(origin) ? origin : null;
  } catch {
    return null;
  }
}

export type CspSources = {
  /** Extra `form-action` origins besides `'self'`. */
  formAction?: readonly string[];
  /** Extra `frame-src` origins besides `'self'`. */
  frameSrc?: readonly string[];
};

function sourceList(origins: readonly string[] | undefined): string {
  const unique = [...new Set((origins ?? []).filter(isCspOrigin))];
  return ["'self'", ...unique].join(" ");
}

/** The report-only policy: the enforced pair plus the directives given (omitted ones are left out). */
export function buildReportOnlyCsp(sources: CspSources): string {
  const parts = [ENFORCED_CSP];
  if (sources.formAction) parts.push(`form-action ${sourceList(sources.formAction)}`);
  if (sources.frameSrc) parts.push(`frame-src ${sourceList(sources.frameSrc)}`);
  return parts.join("; ");
}

export type CspHeaders = { enforced: string; reportOnly: string };

/**
 * Storefront pages on every store host (subdomains and custom domains),
 * checkout included. `extraFrameSrc` is for env-dependent origins such as the
 * Supabase storage host (a video file played in a playlist frame).
 */
export function storefrontCsp(extraFrameSrc: readonly string[] = []): CspHeaders {
  return {
    enforced: ENFORCED_CSP,
    reportOnly: buildReportOnlyCsp({
      formAction: PAYMENT_GATEWAY_ORIGINS,
      frameSrc: [...VIDEO_EMBED_ORIGINS, ...PAYMENT_GATEWAY_ORIGINS, ...TRACKING_FRAME_ORIGINS, ...extraFrameSrc],
    }),
  };
}

/**
 * The dashboard builder (`/stores/<id>/editor`). Its canvas and preview
 * frames have no `src` (same origin) and inherit this policy, so the players
 * a public-mode preview may frame are listed too.
 */
export function builderCsp(extraFrameSrc: readonly string[] = []): CspHeaders {
  return {
    enforced: ENFORCED_CSP,
    reportOnly: buildReportOnlyCsp({ frameSrc: [...VIDEO_EMBED_ORIGINS, ...extraFrameSrc] }),
  };
}

/** The builder page, both locales: `/stores/<id>/editor` and `/en/stores/<id>/editor` (`/ar/…` after the locale rewrite). */
export function isStoreEditorPath(pathname: string): boolean {
  return /^(?:\/(?:ar|en))?\/stores\/[^/]+\/editor\/?$/.test(pathname);
}

/**
 * Sets both headers on a response, unless one is already there (a route or
 * an earlier step set its own policy: never override or duplicate it).
 */
export function applyCsp(headers: Headers, policy: CspHeaders): void {
  if (!headers.has(CSP_HEADER)) headers.set(CSP_HEADER, policy.enforced);
  if (!headers.has(CSP_REPORT_ONLY_HEADER)) headers.set(CSP_REPORT_ONLY_HEADER, policy.reportOnly);
}
