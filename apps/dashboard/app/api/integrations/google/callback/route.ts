import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCode } from "@workspace/lib/integrations";
import { nonceMatches, saveGoogleSheetsConnection, verifyOAuthState } from "@workspace/lib/integrations/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import {
  GOOGLE_OAUTH_COOKIE_PATH,
  GOOGLE_OAUTH_NONCE_COOKIE,
  googleOAuthClient,
} from "@/lib/integrations/google-oauth.server";

export const dynamic = "force-dynamic";

/**
 * Google OAuth callback for the Sheets app (PLAN.md P7-06). Accepted only
 * when the signed state is valid and unexpired, its nonce matches this
 * browser's httpOnly cookie, and the session seller still owns the store the
 * state names. The refresh token is encrypted before it is stored and never
 * logged. 404 when the Google OAuth env is not configured.
 */
export async function GET(request: NextRequest) {
  const client = googleOAuthClient(request.nextUrl.origin);
  if (!client) return new NextResponse("Not found", { status: 404 });

  const params = request.nextUrl.searchParams;
  const state = verifyOAuthState(params.get("state"));
  const nonce = request.cookies.get(GOOGLE_OAUTH_NONCE_COOKIE)?.value;

  const finish = (path: string) => {
    const response = NextResponse.redirect(new URL(path, request.url));
    response.cookies.set(GOOGLE_OAUTH_NONCE_COOKIE, "", { path: GOOGLE_OAUTH_COOKIE_PATH, maxAge: 0 });
    return response;
  };

  if (!state || !nonceMatches(state.nonce, nonce)) return finish("/?google=invalid");
  const appsPath = `/stores/${state.storeId}/apps`;

  try {
    const { seller, store } = await requireStore(state.storeId, { forWrite: true });
    if (seller.sellerId !== state.sellerId) return finish("/?google=invalid");

    const code = params.get("code");
    // Denied consent (error=access_denied) or a missing code.
    if (!code || params.get("error") || code.length > 2048) return finish(`${appsPath}?google=cancelled`);

    const grant = await exchangeGoogleCode(client, code);
    if (!grant.ok) return finish(`${appsPath}?google=failed`);

    const saved = await saveGoogleSheetsConnection(seller.sellerId, seller.userId, store.id, {
      refreshToken: grant.data.refreshToken,
      scopes: grant.data.scopes,
    });
    if (!saved.success) return finish(`${appsPath}?google=failed`);

    revalidatePath(appsPath);
    return finish(`${appsPath}?google=connected`);
  } catch (error) {
    if (isAccessError(error)) return finish("/?google=invalid");
    console.error("[google-sheets] callback failed", (error as Error)?.name);
    return finish(`${appsPath}?google=failed`);
  }
}
