import { type NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@workspace/lib/integrations";
import { newOAuthNonce, OAUTH_STATE_TTL_MS, signOAuthState } from "@workspace/lib/integrations/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import {
  GOOGLE_OAUTH_COOKIE_PATH,
  GOOGLE_OAUTH_NONCE_COOKIE,
  googleOAuthClient,
} from "@/lib/integrations/google-oauth.server";

export const dynamic = "force-dynamic";

const limiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });

/**
 * Starts "Connect Google Sheets" for one store (PLAN.md P7-06). The store is
 * re-checked against the session seller; the signed state binds the round
 * trip to that seller + store and to a nonce in an httpOnly cookie (CSRF).
 * 404 when the Google OAuth env is not configured.
 */
export async function GET(request: NextRequest) {
  const client = googleOAuthClient(request.nextUrl.origin);
  if (!client) return new NextResponse("Not found", { status: 404 });

  const storeId = request.nextUrl.searchParams.get("storeId") ?? "";
  try {
    const { seller, store } = await requireStore(storeId, { forWrite: true });
    if (!limiter.check(`google-start:${seller.sellerId}`)) {
      return NextResponse.redirect(new URL(`/stores/${store.id}/apps?google=rateLimited`, request.url));
    }
    const nonce = newOAuthNonce();
    const state = signOAuthState({ sellerId: seller.sellerId, storeId: store.id, nonce });
    const response = NextResponse.redirect(buildGoogleAuthUrl(client, state));
    response.cookies.set(GOOGLE_OAUTH_NONCE_COOKIE, nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: GOOGLE_OAUTH_COOKIE_PATH,
      maxAge: OAUTH_STATE_TTL_MS / 1000,
    });
    return response;
  } catch (error) {
    if (isAccessError(error)) return new NextResponse("Not found", { status: 404 });
    console.error("[google-sheets] start failed", (error as Error)?.name);
    return new NextResponse("Error", { status: 500 });
  }
}
