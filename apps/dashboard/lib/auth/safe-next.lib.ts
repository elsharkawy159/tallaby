/**
 * Returns `next` only when it is a same-site relative path, otherwise
 * `fallback`. Used wherever a redirect target comes from a query parameter
 * (e.g. the auth callback) to prevent open redirects such as `//evil.com`,
 * `/\evil.com` or `@evil.com` (which `${origin}${next}` would turn into
 * `https://dashboard.tallaby.com@evil.com`).
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || next.length > 2048) return fallback;
  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }
  for (const value of [next, decoded]) {
    if (!value.startsWith("/")) return fallback;
    // "//host", "/\host" and control characters can all be read as another origin.
    if (/^\/[\\/]/.test(value) || /[\u0000-\u001f\u007f]/.test(value)) return fallback;
  }
  return next;
}
