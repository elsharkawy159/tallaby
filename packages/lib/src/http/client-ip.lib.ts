/**
 * The client's IP address and country from request headers, for every app
 * (docs/plans/hetzner-migration.md §2 rows 3–4, §6 step 2.2).
 *
 * Cloudflare's `CF-Connecting-IP` / `CF-IPCountry` are read ONLY when
 * `TRUST_CLOUDFLARE_HEADERS=1`. Set it only on a server whose Cloudflare proxy
 * is on (orange cloud) AND whose firewall accepts 80/443 from Cloudflare's IP
 * ranges alone; anywhere else a client could send those headers itself.
 * Without the flag (Vercel, a grey-cloud host) the result is exactly what the
 * call sites read before: the first `x-forwarded-for` entry, trimmed, then
 * `x-real-ip`; the country from `x-vercel-ip-country`.
 *
 * Pure, no Node-only imports: it runs in `proxy.ts`, route handlers, server
 * actions and the Hono backend. Meant for server code (it reads request
 * headers and a server env var).
 */

/** Anything with a `Headers`-style `get` (Headers, Next's ReadonlyHeaders). */
export type HeaderReader = { get(name: string): string | null };

const COUNTRY = /^[A-Z]{2}$/;
/** Cloudflare's "unknown" and "Tor" pseudo-countries. */
const CLOUDFLARE_NO_COUNTRY = new Set(["XX", "T1"]);

function trustCloudflare(): boolean {
  return process.env.TRUST_CLOUDFLARE_HEADERS === "1";
}

/** Upper-case ISO-2 code, or null for a missing or malformed value. */
function isoCountry(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  return COUNTRY.test(code) ? code : null;
}

/**
 * The client IP, or null when no header carries one. Callers keep their own
 * fallback (`?? "unknown"` for rate-limit keys, null for logs).
 */
export function getClientIp(headers: HeaderReader): string | null {
  if (trustCloudflare()) {
    const cf = headers.get("cf-connecting-ip")?.trim();
    if (cf) return cf;
  }
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
}

/**
 * The client's country (ISO-2, upper case), or null. Behind Cloudflare
 * (trusted) a present `CF-IPCountry` is the answer, with `XX`/`T1` as null;
 * otherwise `x-vercel-ip-country`.
 */
export function getClientCountry(headers: HeaderReader): string | null {
  if (trustCloudflare()) {
    const cf = headers.get("cf-ipcountry");
    if (cf !== null && cf.trim() !== "") {
      const code = isoCountry(cf);
      return code && !CLOUDFLARE_NO_COUNTRY.has(code) ? code : null;
    }
  }
  return isoCountry(headers.get("x-vercel-ip-country"));
}
