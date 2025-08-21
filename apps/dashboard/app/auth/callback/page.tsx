import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; redirectTo?: string }>;
}) {
  const { code, redirectTo } = await searchParams;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      redirect("/auth?error=callback_failed");
    }
  }

  // Redirect to the intended destination or default to dashboard
  const destination = redirectTo || "/";
  redirect(destination);
}
