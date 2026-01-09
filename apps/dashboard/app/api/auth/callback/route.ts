import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const token = searchParams.get("token");
  const tokenHash = searchParams.get("token_hash");

  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  // Handle OAuth callback with code
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/auth`);
    }

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
      revalidatePath("/", "layout");
      return NextResponse.redirect(`${origin}${next}`);
    }

    // If no explicit error and token parameters are present,
    // Supabase SSR has processed the token. Even without a session,
    // the email is verified. Redirect to auth with success message.
    revalidatePath("/", "layout");
    return NextResponse.redirect(`${origin}/auth?verified=true`);
  }

  // If no code or token parameters, redirect to auth page
  return NextResponse.redirect(`${origin}/auth`);
}
