import { BASE_URL } from "@/lib/constants";
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${BASE_URL}/auth/auth-code-error`);
    }

    revalidatePath("/", "layout");
    return NextResponse.redirect(`${BASE_URL}${next}`);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${BASE_URL}/auth/auth-code-error`);
}
