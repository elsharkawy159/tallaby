import { type NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { db, eq, sellers } from "@workspace/db";
import { createClient } from "@/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next.lib";
import { completeSignup, signupIntentFromMetadata } from "@/app/signup/signup-complete.server";
import { readSignupIntentCookie } from "@/app/signup/signup-intent.server";

/**
 * OAuth and email-confirmation callback. After the session is established, a
 * pending signup (signed intent cookie, or the choices saved in user_metadata
 * at email signup) becomes the seller account + primary store (PLAN.md P2-03).
 * A signed-in user with no seller row and no pending signup goes to /signup.
 * No revalidatePath("/", "layout") here: in a route handler it only purges
 * the Data Cache (the template gallery, library sections…), and nothing
 * cached depends on the user (docs/egress-audit.md §2).
 */
async function finish(origin: string, next: string, user: User | null) {
  if (!user) return NextResponse.redirect(`${origin}${next}`);

  const [seller] = await db.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, user.id)).limit(1);
  if (seller) return NextResponse.redirect(`${origin}${next}`);

  const intent = (await readSignupIntentCookie()) ?? signupIntentFromMetadata(user);
  if (!intent) return NextResponse.redirect(`${origin}/signup`);

  const result = await completeSignup(user, intent);
  if (!result.success) {
    // e.g. the address was taken meanwhile: let them pick another one.
    return NextResponse.redirect(`${origin}/signup?error=${result.error === "taken" ? "subdomainTaken" : "generic"}`);
  }
  return NextResponse.redirect(`${origin}/?welcome=1`);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const token = searchParams.get("token");
  const tokenHash = searchParams.get("token_hash");
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();

  // OAuth (and PKCE email confirmation) callback with a code
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${origin}/login`);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return finish(origin, next, user);
  }

  // Email verification links that carry a token
  if (type && (token || tokenHash)) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError && userError.message.includes("Invalid")) {
      return NextResponse.redirect(`${origin}/login`);
    }
    if (user) return finish(origin, next, user);

    // Verified, but no session in this browser: sign in to continue.
    return NextResponse.redirect(`${origin}/login?verified=true`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
