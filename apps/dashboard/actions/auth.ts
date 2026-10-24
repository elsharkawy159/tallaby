"use server";

import { createClient } from "@/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Auth actions return their error text instead of throwing it: in production
 * Next.js replaces a thrown server-action message with a generic English one,
 * so a thrown "wrong password" never reached the seller.
 */
export type AuthActionResult = {
  error: string | null;
  /** Set when the account exists but its email is not confirmed yet (offer a resend). */
  code?: "emailNotConfirmed";
};

// Per instance (no shared Redis yet, PLAN.md A4).
const resendLimiter = createRateLimiter({ limit: 3, windowMs: 10 * 60_000 });

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export const getUser = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const login = async (email: string, password: string): Promise<AuthActionResult> => {
  const supabase = await createClient();
  const t = await getTranslations("auth.errors");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) return { error: t("invalidCredentials") };
    if (error.message.includes("Email not confirmed")) {
      return { error: t("emailNotConfirmed"), code: "emailNotConfirmed" };
    }
    if (/rate limit/i.test(error.message)) return { error: t("rateLimited") };
    return { error: t("generic") };
  }

  // Access is decided by the sellers row (see lib/auth/seller-access.ts), not
  // by user_metadata.is_seller. Pending/suspended sellers may sign in; the
  // dashboard layout shows them a status screen instead of the dashboard.
  // Users without a seller row (e.g. customers) stay signed in: the layout
  // sends them to /signup to create their store (PLAN.md P2-04).
  if (!data.user) return { error: t("userNotFound") };
  return { error: null };
};

export const resetPassword = async (email: string): Promise<AuthActionResult> => {
  const supabase = await createClient();
  const t = await getTranslations("auth.errors");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login?reset=true`,
  });

  if (error) {
    if (error.message.includes("Invalid email")) return { error: t("invalidEmail") };
    if (error.message.includes("rate limit")) return { error: t("rateLimited") };
    if (error.message.includes("not found")) return { error: t("accountNotFound") };
    return { error: t("generic") };
  }
  return { error: null };
};

/** Sends the signup confirmation email again (signup "check your email" screen, and login when unconfirmed). */
export const resendConfirmation = async (email: string): Promise<AuthActionResult> => {
  const t = await getTranslations("auth.errors");
  if (!resendLimiter.check(await clientKey())) return { error: t("rateLimited") };

  const address = String(email ?? "").trim().slice(0, 254);
  if (!address.includes("@")) return { error: t("invalidEmail") };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: address,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=/` },
  });
  if (error) return { error: /rate limit/i.test(error.message) ? t("rateLimited") : t("generic") };
  return { error: null };
};

export const logout = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
};
