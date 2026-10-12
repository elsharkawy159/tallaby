import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/supabase/server";
import {
  createHandoffCode,
  safeNextPath,
  trustedHandoffOrigin,
} from "@/lib/auth-handoff.server";
import { mergeGuestAccount } from "@/actions/merge-guest-account";

async function mergeGuestAccountSafely() {
  try {
    await mergeGuestAccount();
  } catch (mergeError) {
    // Log but don't fail the auth callback if merge fails
    console.error("Failed to merge guest account:", mergeError);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const token = searchParams.get("token");
  const tokenHash = searchParams.get("token_hash");

  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  // OAuth started by a seller's own domain (see /api/auth/oauth): the
  // session goes to that domain, not to tallaby.com.
  const handoffParam = searchParams.get("handoff");
  if (code && handoffParam) {
    const handoff = await trustedHandoffOrigin(handoffParam);
    if (!handoff) return NextResponse.redirect(`${origin}/auth`);

    // Reads the PKCE verifier cookie but sets no session cookies here.
    const cookieStore = await cookies();
    const exchange = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    );
    const { data, error } = await exchange.auth.exchangeCodeForSession(code);
    if (error || !data.session) return NextResponse.redirect(`${handoff}/auth`);

    const handoffCode = await createHandoffCode(handoff, data.session);
    const target = new URL("/api/auth/handoff", handoff);
    target.searchParams.set("code", handoffCode);
    target.searchParams.set("next", safeNextPath(next));
    return NextResponse.redirect(target);
  }

  const supabase = await createClient();

  // Handle OAuth callback with code
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/auth`);
    }

    // OAuth (and magic-link) sign-ins land here with a freshly established
    // session - merge any guest cart/address/order data the same way the
    // password sign-in path does.
    await mergeGuestAccountSafely();

    revalidatePath("/", "layout");
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Handle email verification
  if (type && (token || tokenHash)) {
    // For email verification, Supabase SSR automatically processes the token
    // when the callback URL is visited. The Supabase client processes the token
    // by reading the URL parameters. We need to check if verification succeeded.

    // Try to get the session - this will trigger token processing if not already done
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Also try to get the user to verify token was processed
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If there's an explicit error indicating invalid token, redirect to auth page
    if (sessionError && sessionError.message.includes("Invalid")) {
      return NextResponse.redirect(`${origin}/auth`);
    }
    if (userError && userError.message.includes("Invalid")) {
      return NextResponse.redirect(`${origin}/auth`);
    }

    // If we have a session or user, verification was successful
    if (session || user) {
      if (session) {
        await mergeGuestAccountSafely();
      }
      revalidatePath("/", "layout");
      return NextResponse.redirect(`${origin}${next}`);
    }

    // If no explicit error and token parameters are present,
    // Supabase SSR has processed the token. Even without a session,
    // the email is verified. Redirect to login with success message.
    revalidatePath("/", "layout");
    return NextResponse.redirect(`${origin}/auth?verified=true`);
  }

  // If no code or token parameters, redirect to auth page
  return NextResponse.redirect(`${origin}/auth`);
}
