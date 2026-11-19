import { isPlatformHost } from "@workspace/lib/storefront";
import { accountOrigin } from "@workspace/lib/storefront/platform-hosts";

/**
 * On a seller's own domain (faster-eg.com), the URL that starts OAuth on
 * account.tallaby.com (accountOrigin) and hands the session back here (see lib/auth-handoff.server).
 * Null on tallaby.com and store subdomains, which sign in directly.
 */
export function oauthHandoffUrl(provider: string, next: string): string | null {
  if (typeof window === "undefined" || isPlatformHost(window.location.host)) {
    return null;
  }
  const url = new URL("/api/auth/oauth", accountOrigin());
  url.searchParams.set("provider", provider);
  url.searchParams.set("handoff", window.location.origin);
  url.searchParams.set("next", next);
  return url.toString();
}
