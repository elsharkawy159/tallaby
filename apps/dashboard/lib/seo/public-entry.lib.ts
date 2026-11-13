/**
 * The dashboard's one indexable page. Signed out, `/` redirects to `/login`
 * (supabase/middleware.ts), so `/login` is the page search engines show.
 * Every other route keeps the root layout's noindex.
 */
export const PUBLIC_ENTRY_PATH = "/login";

const FALLBACK_ORIGIN = "https://dashboard.tallaby.com";

/** The dashboard's absolute origin, without a trailing slash. */
export function dashboardOrigin(siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  const raw = siteUrl?.trim();
  if (!raw) return FALLBACK_ORIGIN;
  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}
