import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const { code, error } = await searchParams;

  if (error) {
    console.error("Auth callback error:", error);
    redirect("/auth?error=callback_error");
  }

  if (code) {
    const supabase = await createClient();

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError);
      redirect("/auth?error=exchange_error");
    }
  }

  // Successful authentication, redirect to home
  redirect("/");
}

export const metadata = {
  title: "Authenticating... | Multi-Vendor Commerce",
  description: "Processing your authentication...",
};
