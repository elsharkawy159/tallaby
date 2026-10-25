import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { mergeGuestAccount } from "@/actions/merge-guest-account";
import { consumeHandoffCode, safeNextPath } from "@/lib/auth-handoff.server";
import { getRequestSiteUrl } from "@/lib/storefront.server";

export const dynamic = "force-dynamic";

/**
 * Lands a sign-in that happened on tallaby.com on a seller's own domain:
 * redeems the single-use code from /api/auth/callback and sets the session
 * cookies for this host.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  // The public origin of this store (the request URL may be internal).
  const origin = await getRequestSiteUrl();

  const tokens = code ? await consumeHandoffCode(code, origin) : null;
  if (!tokens) return NextResponse.redirect(`${origin}/auth`);

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession(tokens);
  if (error) {
    console.error("Auth handoff failed:", error);
    return NextResponse.redirect(`${origin}/auth`);
  }

  try {
    // Guest cart/address/orders live in this domain's guest cookie.
    await mergeGuestAccount();
  } catch (mergeError) {
    console.error("Failed to merge guest account:", mergeError);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
