import { type NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { db, eq, sellers } from "@workspace/db";
import { completeSignup, signupIntentFromMetadata } from "@/components/marketing/signup/signup-complete.server";
import { readSignupIntentCookie } from "@/components/marketing/signup/signup-intent.server";
import { DASHBOARD_URL } from "@/lib/marketing/site.lib";
import { createClient } from "@/supabase/server";

/**
 * Google OAuth and email-confirmation callback for signups started on the
 * marketing pages (same logic as the dashboard callback). Separate from
 * /api/auth/callback, which signs storefront customers in. The pending signup
 * (signed intent cookie, or the choices saved in user_metadata) becomes the
 * seller account + primary store, then the seller lands in the dashboard.
 */
async function finish(origin: string, user: User | null) {
  if (!user) return NextResponse.redirect(`${origin}/#signup`);

  const [seller] = await db.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, user.id)).limit(1);
  if (seller) return NextResponse.redirect(DASHBOARD_URL);

  const intent = (await readSignupIntentCookie()) ?? signupIntentFromMetadata(user);
  // Signed in but no pending choice: the dashboard signup asks for the store.
  if (!intent) return NextResponse.redirect(`${DASHBOARD_URL}signup`);

  const result = await completeSignup(user, intent);
  if (!result.success) {
    const error = result.error === "taken" ? "subdomainTaken" : "generic";
    return NextResponse.redirect(`${DASHBOARD_URL}signup?error=${error}`);
  }
  // `signup` only for a new account: the welcome page fires Meta's CompleteRegistration once.
  return NextResponse.redirect(`${DASHBOARD_URL}?welcome=1${result.signup ? `&signup=${result.signup}` : ""}`);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${origin}/?signup_error=generic#signup`);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return finish(origin, user);
  }

  // Token-style email verification: use the session if this browser has one.
  if (searchParams.get("type") && (searchParams.get("token") || searchParams.get("token_hash"))) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return finish(origin, user);
    return NextResponse.redirect(`${DASHBOARD_URL}login?verified=true`);
  }

  return NextResponse.redirect(`${origin}/`);
}
