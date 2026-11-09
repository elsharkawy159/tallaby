import { type NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { db, eq, sellers } from "@workspace/db";
import {
  builderUrlFor,
  claimSignupIntake,
  completeSignup,
  intakeFromMetadata,
  signupIntentFromMetadata,
} from "@/components/marketing/signup/signup-complete.server";
import { cleanPlanHint, dashboardSignupQuery, PRO_PLAN_PATH } from "@/components/marketing/signup/signup-hint.lib";
import {
  clearSignupHintCookie,
  clearSignupIntentCookie,
  readSignupHintCookie,
  readSignupIntentCookie,
} from "@/components/marketing/signup/signup-intent.server";
import { DASHBOARD_URL } from "@/lib/marketing/site.lib";
import { createClient } from "@/supabase/server";

/**
 * Google OAuth and email-confirmation callback for signups started on the
 * marketing pages (same logic as the dashboard callback). Separate from
 * /api/auth/callback, which signs storefront customers in. The pending signup
 * (signed intent cookie, or the choices saved in user_metadata) becomes the
 * seller account + primary store, then the seller lands in the dashboard.
 * The hint cookie (or `signup_plan` in user_metadata) only changes where:
 * the Plans page after the Pro button, and the address typed before a Google
 * signup pre-filled on the dashboard's store step (checked there again).
 */
async function finish(origin: string, user: User | null) {
  if (!user) return NextResponse.redirect(`${origin}/#signup`);

  const cookieIntent = await readSignupIntentCookie();
  const cookieHint = await readSignupHintCookie();
  if (cookieHint) await clearSignupHintCookie();
  const pro = (cookieHint?.plan ?? cleanPlanHint(user.user_metadata?.signup_plan)) === "pro";
  const proUrl = `${DASHBOARD_URL}${PRO_PLAN_PATH.slice(1)}`;
  const [seller] = await db.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, user.id)).limit(1);
  if (seller) {
    // Already a seller (Google with an existing account): a hero intake (F-82d)
    // is still theirs, with no store bound; the builder creates or picks one.
    const intakeId = await claimSignupIntake(seller.id, cookieIntent ?? intakeFromMetadata(user.user_metadata), null);
    if (cookieIntent) await clearSignupIntentCookie();
    return NextResponse.redirect(intakeId ? builderUrlFor(intakeId) : pro ? proUrl : DASHBOARD_URL);
  }

  const intent = cookieIntent ?? signupIntentFromMetadata(user);
  // Signed in but no pending choice: the dashboard signup asks for the store.
  if (!intent) {
    return NextResponse.redirect(`${DASHBOARD_URL}signup${dashboardSignupQuery({ subdomain: cookieHint?.subdomain, plan: pro ? "pro" : undefined })}`);
  }

  const result = await completeSignup(user, intent);
  if (!result.success) {
    const error = result.error === "taken" ? "subdomainTaken" : "generic";
    return NextResponse.redirect(`${DASHBOARD_URL}signup?error=${error}${pro ? `&next=${encodeURIComponent(PRO_PLAN_PATH)}` : ""}`);
  }
  // `signup` only for a new account: the welcome page (or the builder, after a
  // hero intake) fires Meta's CompleteRegistration once.
  const signup = result.signup ? `&signup=${result.signup}` : "";
  if (result.intakeId) return NextResponse.redirect(`${builderUrlFor(result.intakeId)}&welcome=1${signup}`);
  // The Pro button: the Plans page, where the seller upgrades through the normal flow.
  if (pro) return NextResponse.redirect(`${proUrl}?welcome=1${signup}`);
  return NextResponse.redirect(`${DASHBOARD_URL}?welcome=1${signup}`);
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
