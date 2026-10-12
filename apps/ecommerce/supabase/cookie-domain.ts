import { isPlatformHost } from "@workspace/lib/storefront";

/**
 * The `domain` for Supabase auth cookies on a request to `host`.
 *
 * On tallaby.com and its store subdomains the session is shared through
 * `.tallaby.com`. A seller's own domain (faster-eg.com) can't read or set
 * those, so it gets host-only cookies (no domain) and its own session.
 * Omitted in development too: an empty domain makes browsers drop the cookie.
 */
export function cookieDomainForHost(host: string | null | undefined): string | undefined {
  if (process.env.NODE_ENV === "development") return undefined;
  if (!isPlatformHost(host)) return undefined;
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  return root ? `.${root}` : undefined;
}
