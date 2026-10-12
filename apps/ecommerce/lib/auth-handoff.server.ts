/**
 * Signing in on a seller's own domain (faster-eg.com) through tallaby.com.
 *
 * Supabase only sends OAuth back to allow-listed hosts, and seller domains
 * can't be listed one by one. So the custom domain starts sign-in at
 * tallaby.com (`/api/auth/oauth`), the provider returns there
 * (`/api/auth/callback?handoff=…`), and the session is handed to the store
 * with a single-use code that its `/api/auth/handoff` route redeems.
 *
 * The session never gets cookies on tallaby.com: it belongs to the store
 * domain only, so the two can't rotate the same refresh token.
 */

import { createHash, randomBytes } from "node:crypto";
import { db, authHandoffCodes, and, eq, gt, lt } from "@workspace/db";
import { hostnameOf, isPlatformHost } from "@workspace/lib/storefront";
import { isActiveCustomDomain } from "@workspace/lib/storefront/server";

const CODE_TTL_MS = 60_000;

function hash(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * `https://faster-eg.com` when `value` is the origin of an active custom
 * domain, else null. Guards every redirect off tallaby.com.
 */
export async function trustedHandoffOrigin(value: string | null): Promise<string | null> {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  // Plain http (and a port) only in development, for hosts-file testing.
  const dev = process.env.NODE_ENV === "development";
  if (url.protocol !== "https:" && !(dev && url.protocol === "http:")) return null;
  if ((url.port && !dev) || url.pathname !== "/" || url.search || url.username) return null;
  const domain = hostnameOf(url.host);
  if (isPlatformHost(domain) || !(await isActiveCustomDomain(domain))) return null;
  return url.origin;
}

/** Same-site path to land on after sign-in; anything else becomes "/". */
export function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}

/** Stores the session for `targetOrigin` and returns the code to redeem it. */
export async function createHandoffCode(
  targetOrigin: string,
  session: { access_token: string; refresh_token: string },
): Promise<string> {
  const code = randomBytes(32).toString("base64url");
  await db.insert(authHandoffCodes).values({
    codeHash: hash(code),
    targetOrigin,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  });
  return code;
}

/**
 * Redeems `code` once, for the origin it was issued to. Returns the session
 * tokens, or null when the code is unknown, expired, used or for another site.
 */
export async function consumeHandoffCode(code: string, origin: string) {
  const [row] = await db
    .delete(authHandoffCodes)
    .where(
      and(
        eq(authHandoffCodes.codeHash, hash(code)),
        gt(authHandoffCodes.expiresAt, new Date().toISOString()),
      ),
    )
    .returning();
  if (!row || row.targetOrigin !== origin) return null;
  return { access_token: row.accessToken, refresh_token: row.refreshToken };
}

/** Drops expired codes nobody redeemed (run by the custom-domains cron). */
export async function purgeExpiredHandoffCodes() {
  await db
    .delete(authHandoffCodes)
    .where(lt(authHandoffCodes.expiresAt, new Date().toISOString()));
}
