/**
 * The public origin (`https://dashboard.tallaby.com`) of a request, for route
 * handlers that build absolute URLs (redirects, OAuth `redirect_uri`).
 *
 * Self-hosted, Next's standalone server builds `request.url` from its own bind
 * address (`https://0.0.0.0:3000`), so the origin comes from the proxy's
 * headers instead: the first `x-forwarded-host` entry, else `host`, with the
 * first `x-forwarded-proto` entry (else `https`, or the URL's own protocol on
 * localhost and IP literals, so local dev over http keeps working). A header
 * that is not a plain `hostname[:port]` is ignored and `request.url`'s origin
 * is used, as it is when no header is sent.
 *
 * On Vercel `request.url` is itself built from these headers (they carry the
 * real host and `https`), so the result there is unchanged.
 *
 * Pure, no Node-only imports. Meant for server code.
 */

import type { HeaderReader } from "./client-ip.lib";

/** Anything with a URL and readable headers (Request, NextRequest). */
export type OriginRequest = { url: string; headers: HeaderReader };

const LABEL = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
/** `example.com`, `a.b.example.com:8443`, `localhost:3000`, `[::1]:3000`. */
const HOST = new RegExp(`^(?:${LABEL}(?:\\.${LABEL})*|\\[[0-9a-f:.]+\\])(?::\\d{1,5})?$`, "i");
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

function firstEntry(value: string | null): string {
  return (value ?? "").split(",")[0]?.trim() ?? "";
}

/** localhost, *.localhost and IP literals (0.0.0.0, 127.0.0.1, a LAN IP, [::1]). */
function isLocalHost(host: string): boolean {
  const name = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0]!;
  const lower = name.toLowerCase();
  return lower === "localhost" || lower.endsWith(".localhost") || IPV4.test(lower) || lower.startsWith("[");
}

export function requestOrigin(request: OriginRequest): string {
  const url = new URL(request.url);
  const host = firstEntry(request.headers.get("x-forwarded-host")) || firstEntry(request.headers.get("host"));
  if (!host || !HOST.test(host)) return url.origin;

  const forwardedProto = firstEntry(request.headers.get("x-forwarded-proto")).toLowerCase();
  const protocol =
    forwardedProto === "https" || forwardedProto === "http"
      ? forwardedProto
      : isLocalHost(host)
        ? url.protocol.replace(/:$/, "")
        : "https";

  try {
    // Normalises case and drops a default port, like URL#origin.
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return url.origin;
  }
}
