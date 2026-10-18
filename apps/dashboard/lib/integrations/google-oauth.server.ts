import { readGoogleClientEnv } from "@workspace/lib/integrations";

/**
 * Google OAuth client for the Sheets app (PLAN.md §9.2, P7-06). Env
 * GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET are server-only; when
 * either is unset the app shows "Soon" and its routes return 404. The
 * redirect URI must be registered in the Google Cloud console exactly as
 * `${NEXT_PUBLIC_SITE_URL}/api/integrations/google/callback`.
 */

export const GOOGLE_OAUTH_NONCE_COOKIE = "tallaby_google_oauth_nonce";
export const GOOGLE_OAUTH_COOKIE_PATH = "/api/integrations/google";

export function isGoogleSheetsConfigured(): boolean {
  return readGoogleClientEnv() !== null;
}

export function googleOAuthClient(origin: string): { clientId: string; clientSecret: string; redirectUri: string } | null {
  const env = readGoogleClientEnv();
  if (!env) return null;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  return { ...env, redirectUri: `${base}/api/integrations/google/callback` };
}
