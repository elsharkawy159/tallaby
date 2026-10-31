/**
 * Redirect URI rules for MCP OAuth clients (ROADMAP.md F-29b). Pure.
 *
 * Allowed: https URLs (Claude, ChatGPT, vscode.dev), http only on loopback
 * hosts (Claude Code, Cursor, MCP Inspector; RFC 8252 §7.3, any port), and
 * private-use app schemes such as `cursor://` (RFC 8252 §7.1). Never: a
 * fragment, user info, or schemes that run code or read local data.
 * A code is only redeemable with the PKCE verifier, and the consent page shows
 * the redirect host, so an odd but allowed URI cannot leak access on its own.
 */

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const BLOCKED_SCHEMES = new Set([
  "javascript:", "data:", "file:", "vbscript:", "about:", "blob:", "filesystem:",
  "ws:", "wss:", "ftp:", "mailto:", "tel:", "sms:", "chrome:", "chrome-extension:",
]);

export const MAX_REDIRECT_URI_LENGTH = 2000;

function parse(uri: string): URL | null {
  if (typeof uri !== "string" || uri.length === 0 || uri.length > MAX_REDIRECT_URI_LENGTH) return null;
  if (/[\u0000- \u007f]/.test(uri)) return null;
  try {
    return new URL(uri);
  } catch {
    return null;
  }
}

export function isLoopbackRedirect(url: URL): boolean {
  return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
}

export function isAllowedRedirectUri(uri: string): boolean {
  const url = parse(uri);
  if (!url) return false;
  if (url.hash || uri.includes("#")) return false;
  if (url.username || url.password) return false;
  if (url.protocol === "https:") return url.hostname.length > 0;
  if (url.protocol === "http:") return isLoopbackRedirect(url);
  if (BLOCKED_SCHEMES.has(url.protocol)) return false;
  // Private-use scheme: letters, digits, "+", "-", "." only.
  return /^[a-z][a-z0-9+.-]{1,63}:$/.test(url.protocol);
}

/**
 * Whether `requested` is one of the client's registered URIs: an exact string
 * match, except that a loopback http URI matches on any port (native apps pick
 * a free port at runtime).
 */
export function redirectUriMatches(registered: readonly string[], requested: string): boolean {
  if (!isAllowedRedirectUri(requested)) return false;
  if (registered.includes(requested)) return true;
  const req = parse(requested)!;
  if (!isLoopbackRedirect(req)) return false;
  return registered.some((candidate) => {
    const reg = parse(candidate);
    return (
      reg !== null &&
      isLoopbackRedirect(reg) &&
      reg.hostname === req.hostname &&
      reg.pathname === req.pathname &&
      reg.search === req.search
    );
  });
}

/** What the consent page shows: the host for web redirects, the scheme for apps. */
export function redirectDisplayHost(uri: string): string {
  const url = parse(uri);
  if (!url) return "";
  if (url.protocol === "https:" || url.protocol === "http:") return url.host;
  return url.protocol.replace(/:$/, "");
}

/** Appends OAuth response params to a redirect URI, keeping its own query. */
export function buildRedirect(uri: string, params: Record<string, string | null | undefined>): string {
  const url = new URL(uri);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) url.searchParams.set(key, value);
  }
  return url.toString();
}
