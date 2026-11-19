import { type NextRequest, NextResponse } from "next/server";
import { requestOrigin } from "@workspace/lib/http/request-origin";
import { buildGoogleAuthUrl } from "@workspace/lib/integrations";
import { newOAuthNonce, OAUTH_STATE_TTL_MS, signOAuthState } from "@workspace/lib/integrations/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import {
  GOOGLE_OAUTH_COOKIE_PATH,
  GOOGLE_OAUTH_NONCE_COOKIE,
  googleOAuthClient,
} from "@/lib/integrations/google-oauth.server";
import { LOCALE_COOKIE } from "@/i18n/config";
import { savedLocaleHref } from "@/lib/i18n/saved-locale-href.lib";

const limiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });

/**
 * Starts "Connect Google Sheets" for one store (PLAN.md P7-06). The store is
 * re-checked against the session seller; the signed state binds the round
 * trip to that seller + store and to a nonce in an httpOnly cookie (CSRF).
 * 404 when the Google OAuth env is not configured.
 */
export async function GET(request: NextRequest) {
  const client = googleOAuthClient(requestOrigin(request));
  if (!client) return new NextResponse("Not found", { status: 404 });

  const storeId = request.nextUrl.searchParams.get("storeId") ?? "";
  try {
    const { seller, store } = await requireStore(storeId, { forWrite: true });
    if (!limiter.check(`google-start:${seller.sellerId}`)) {
      const settings = `/stores/${store.id}/apps/google-sheets/settings?google=rateLimited`;
      return NextResponse.redirect(new URL(savedLocaleHref(settings, request.cookies.get(LOCALE_COOKIE)?.value), requestOrigin(request)));
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
