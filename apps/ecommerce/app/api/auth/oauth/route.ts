import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { safeNextPath, trustedHandoffOrigin } from "@/lib/auth-handoff.server";

export const dynamic = "force-dynamic";

const PROVIDERS = new Set(["google", "github", "facebook", "twitter"]);

/**
 * Starts OAuth on tallaby.com for a shopper on a seller's own domain:
 *   /api/auth/oauth?provider=google&handoff=https://faster-eg.com&next=/cart
 * The PKCE verifier is stored here, so the provider must also return here;
 * the callback then hands the session to the store domain.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const provider = searchParams.get("provider") ?? "";
  const handoff = await trustedHandoffOrigin(searchParams.get("handoff"));
  const next = safeNextPath(searchParams.get("next"));

  if (!handoff || !PROVIDERS.has(provider)) {
    return NextResponse.redirect(`${origin}/auth`);
  }

  const callback = new URL("/api/auth/callback", origin);
  callback.searchParams.set("handoff", handoff);
  callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google",
    options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    console.error("OAuth handoff start failed:", error);
    return NextResponse.redirect(`${handoff}/auth`);
  }
  return NextResponse.redirect(data.url);
}
