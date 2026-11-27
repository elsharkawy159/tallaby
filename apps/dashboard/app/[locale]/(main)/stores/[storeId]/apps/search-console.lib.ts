import { GOOGLE_SITE_VERIFICATION_RE } from "@workspace/lib/stores";

/** Apps › Google Search Console helpers (moved from Website › SEO, 2026-11-27). Pure. */

export const SEARCH_CONSOLE_URL = "https://search.google.com/search-console";

/**
 * Search Console shows the token inside a whole tag:
 * `<meta name="google-site-verification" content="abc…" />`. Sellers often
 * paste the tag; keep only the content value. Anything else is returned
 * trimmed and still has to pass GOOGLE_SITE_VERIFICATION_RE on the server.
 */
export function extractVerificationToken(input: string): string {
  const value = input.trim();
  const match = /content\s*=\s*["']([^"']*)["']/i.exec(value);
  return (match ? match[1]! : value).trim();
}

export function isVerificationToken(value: string): boolean {
  return GOOGLE_SITE_VERIFICATION_RE.test(value);
}

/** The addresses the seller copies into Search Console: the property, its sitemap and robots file. */
export function searchConsoleUrls(baseUrl: string): { property: string; sitemap: string; robots: string } {
  const property = baseUrl.replace(/\/+$/, "");
  return { property: `${property}/`, sitemap: `${property}/sitemap.xml`, robots: `${property}/robots.txt` };
}
