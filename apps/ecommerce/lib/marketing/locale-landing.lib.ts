/**
 * tallaby.com language landing (owner, 2026-11-09): a visitor whose browser
 * doesn't prefer Arabic, landing on an Arabic (unprefixed) marketing page, is
 * sent to the same page under /en. Arabic stays the URL default, the SEO
 * default and hreflang x-default: crawlers, prefetches and anyone who has
 * already chosen a language (the locale cookie) are never redirected.
 *
 * Pure functions only; `proxy.ts` calls `englishLandingRedirect`.
 */

/**
 * The top-level segments of the marketing pages under `app/[locale]/(marketing)`
 * ("" is the home page). The marketplace and auth pages on tallaby.com are not
 * here, so they are never redirected. A test checks this against the folders.
 */
export const MARKETING_SEGMENTS: ReadonlySet<string> = new Set([
  "",
  "about",
  "affiliates",
  "blog",
  "careers",
  "compare",
  "contact",
  "faq",
  "features",
  "follow-us",
  "industries",
  "integrations",
  "pricing",
  "privacy",
  "solutions",
  "templates",
  "terms",
  "tools",
]);

/** True for an Arabic (unprefixed) marketing page path, e.g. `/`, `/pricing`, `/blog/x`. */
export function isArabicMarketingPath(pathname: string): boolean {
  if (!pathname.startsWith("/")) return false;
  const segments = pathname.split("/");
  const first = segments[1] ?? "";
  // A file (`/x.txt`, `/blog/a.png`) is never a page.
  if ((segments.at(-1) ?? "").includes(".")) return false;
  return MARKETING_SEGMENTS.has(first);
}

/**
 * Crawlers and link-preview bots: they must keep seeing the Arabic default.
 * Named bots first, then any UA that calls itself a bot, crawler, spider or preview.
 */
const BOT_USER_AGENT =
  /googlebot|google-|-google|bingbot|bingpreview|adsbot|mediapartners|facebookexternalhit|facebookcatalog|facebot|meta-externalagent|twitterbot|whatsapp|linkedinbot|slackbot|discordbot|telegrambot|pinterest|applebot|duckduckbot|yandex|baiduspider|slurp|petalbot|ahrefs|semrush|chrome-lighthouse|lighthouse|headlesschrome|bot\b|bot\/|crawler|spider|preview/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || !userAgent.trim()) return true; // no UA at all: not a person's browser
  return BOT_USER_AGENT.test(userAgent);
}

/**
 * The browser's preferred language between Arabic and English, from
 * `Accept-Language` with q-values: the highest-ranked `ar*` or `en*` wins; a
 * header with neither (e.g. `fr-FR`) counts as English, since it isn't Arabic.
 * Null when the header is missing or has no usable language (only `*`, q=0, junk).
 */
export function preferredLanguage(acceptLanguage: string | null | undefined): "ar" | "en" | null {
  if (!acceptLanguage) return null;
  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [rawTag = "", ...params] = part.trim().split(";");
      const tag = rawTag.trim().toLowerCase();
      let q = 1;
      for (const param of params) {
        const [key, value] = param.trim().split("=");
        if (key?.trim().toLowerCase() === "q") {
          const parsed = Number(value?.trim());
          q = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 0;
        }
      }
      return { tag, q, index };
    })
    .filter(({ tag, q }) => q > 0 && /^[a-z]{1,8}(?:-[a-z0-9]{1,8})*$/.test(tag))
    .sort((a, b) => b.q - a.q || a.index - b.index);
  if (ranked.length === 0) return null;
  for (const { tag } of ranked) {
    const primary = tag.split("-")[0];
    if (primary === "ar") return "ar";
    if (primary === "en") return "en";
  }
  return "en";
}

export interface LocaleLandingRequest {
  method: string;
  pathname: string;
  /** The query string with its leading `?`, or "". */
  search: string;
  /** The request host, to tell an internal navigation (same-site Referer) from a landing. */
  host: string | null;
  headers: { get(name: string): string | null };
  /** The NEXT_LOCALE cookie's value, or null. "ar" (chosen Arabic) never redirects; "en" always does. */
  localeCookie: string | null;
}

function isPrefetch(headers: LocaleLandingRequest["headers"]): boolean {
  if (headers.get("next-router-prefetch") != null) return true;
  const purpose = `${headers.get("purpose") ?? ""} ${headers.get("sec-purpose") ?? ""} ${headers.get("x-purpose") ?? ""}`;
  return /prefetch|prerender/i.test(purpose);
}

function isSameSiteReferer(referer: string | null, host: string | null): boolean {
  if (!referer || !host) return false;
  try {
    return new URL(referer).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Where to send this request, or null to serve it as is. Redirects only a
 * person's browser loading an Arabic marketing page as a document (a landing,
 * not a click inside the site), when the visitor chose English before (cookie
 * "en"), or chose nothing and their browser doesn't prefer Arabic.
 */
export function englishLandingRedirect(request: LocaleLandingRequest): string | null {
  const { headers } = request;
  if (request.method !== "GET") return null;
  // Only Arabic chosen in the switch keeps an Arabic landing; next-intl also
  // writes "en" when an English visitor browses /en, and they should get English.
  if (request.localeCookie === "ar") return null;
  if (!isArabicMarketingPath(request.pathname)) return null;
  if (isPrefetch(headers)) return null;
  // Only a page load: client-router (RSC) fetches and other subresources keep
  // their URL (Next strips `rsc`/`next-router-prefetch` before the proxy, so
  // Sec-Fetch-Dest is the reliable signal, as next-intl uses it too).
  const dest = headers.get("sec-fetch-dest");
  if (dest != null && dest !== "document") return null;
  // A click from another tallaby.com page (e.g. the language switch opened in a
  // new tab, or with cookies blocked) is the visitor's own choice.
  if (isSameSiteReferer(headers.get("referer"), request.host)) return null;
  if (isBotUserAgent(headers.get("user-agent"))) return null;
  if (request.localeCookie !== "en" && preferredLanguage(headers.get("accept-language")) !== "en") return null;
  const path = request.pathname === "/" ? "/en" : `/en${request.pathname}`;
  return `${path}${request.search}`;
}

/** Headers on the redirect: per visitor, never kept by a shared cache. */
export const LOCALE_LANDING_REDIRECT_HEADERS = {
  "Cache-Control": "private, no-store",
  Vary: "Accept-Language, Cookie",
} as const;
