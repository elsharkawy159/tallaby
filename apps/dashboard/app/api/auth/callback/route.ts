import { type NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { db, eq, sellers } from "@workspace/db";
import { createClient } from "@/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next.lib";
import { completeSignup, signupIntentFromMetadata } from "@/app/[locale]/signup/signup-complete.server";
import { readSignupIntentCookie } from "@/app/[locale]/signup/signup-intent.server";
import { afterSignupPath } from "@/app/[locale]/signup/signup.dto";
import { withQuery } from "@/lib/auth/after-signup.lib";
import { LOCALE_COOKIE } from "@/i18n/config";
import { savedLocaleHref } from "@/lib/i18n/saved-locale-href.lib";

/**
 * OAuth and email-confirmation callback. After the session is established, a
 * pending signup (signed intent cookie, or the choices saved in user_metadata
 * at email signup) becomes the seller account + primary store (PLAN.md P2-03).
 * A signed-in user with no seller row and no pending signup goes to /signup.
 * No revalidatePath("/", "layout") here: in a route handler it only purges
 * the Data Cache (the template gallery, library sections…), and nothing
 * cached depends on the user (docs/egress-audit.md §2).
 */
async function finish(go: (path: string) => NextResponse, next: string, user: User | null) {
  if (!user) return go(next);

  const [seller] = await db.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, user.id)).limit(1);
  if (seller) return go(next);

  const intent = (await readSignupIntentCookie()) ?? signupIntentFromMetadata(user);
  // The seller came for the AI Store Builder: step 2 of signup keeps taking them there.
  const after = afterSignupPath(next);
  if (!intent) return go(withQuery("/signup", { next: after ?? undefined }));

  const result = await completeSignup(user, intent);
  if (!result.success) {
    // e.g. the address was taken meanwhile: let them pick another one.
    return go(`/signup?error=${result.error === "taken" ? "subdomainTaken" : "generic"}`);
  }
  // `signup` only for a new account: the welcome page fires Meta's CompleteRegistration once.
  return go(withQuery(after ?? "/", { welcome: "1", signup: result.signup }));
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const token = searchParams.get("token");
  const tokenHash = searchParams.get("token_hash");
  const next = safeNextPath(searchParams.get("next"));
  // Every target is a dashboard page (or an /api link from `next`, kept as is),
  // opened in the seller's saved language: this handler has no locale segment.
  const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const go = (path: string) => NextResponse.redirect(`${origin}${savedLocaleHref(path, localeCookie)}`);

  const supabase = await createClient();

  // OAuth (and PKCE email confirmation) callback with a code
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return go("/login");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return finish(go, next, user);
  }

  // Email verification links that carry a token
  if (type && (token || tokenHash)) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError && userError.message.includes("Invalid")) {
      return go("/login");
    }
    if (user) return finish(go, next, user);

    // Verified, but no session in this browser: sign in to continue.
    return go("/login?verified=true");
  }

  return go("/login");
}
