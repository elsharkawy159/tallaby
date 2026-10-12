import { isPlatformHost } from "@workspace/lib/storefront";

/**
 * On a seller's own domain (faster-eg.com), the URL that starts OAuth on
 * tallaby.com and hands the session back here (see lib/auth-handoff.server).
 * Null on tallaby.com and store subdomains, which sign in directly.
 */
export function oauthHandoffUrl(provider: string, next: string): string | null {
  if (typeof window === "undefined" || isPlatformHost(window.location.host)) {
    return null;
  }
  const marketplace = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!marketplace) return null;
  const url = new URL("/api/auth/oauth", marketplace);
  url.searchParams.set("provider", provider);
  url.searchParams.set("handoff", window.location.origin);
  url.searchParams.set("next", next);
  return url.toString();
}
