import { BASE_URL } from "@/lib/constants";
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Fallback to request origin if BASE_URL is not set
  const origin = BASE_URL || requestUrl.origin;

  console.log("[OAuth Callback] Received request:", {
    code: code ? "present" : "missing",
    next,
    origin,
    searchParams: Object.fromEntries(searchParams.entries()),
  });

  if (!code) {
    console.error("[OAuth Callback] No code provided in callback");
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  try {
    const supabase = await createClient();

    console.log("[OAuth Callback] Exchanging code for session...");
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[OAuth Callback] Error exchanging code:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`
      );
    }

    if (!data.session) {
      console.error("[OAuth Callback] No session returned after code exchange");
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=no_session`
      );
    }

    console.log("[OAuth Callback] Successfully authenticated user:", {
      userId: data.user?.id,
      email: data.user?.email,
    });

    revalidatePath("/", "layout");
    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("[OAuth Callback] Unexpected error:", err);
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=unexpected_error`
    );
  }
}
