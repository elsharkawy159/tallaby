"use server";

import { createClient } from "@/supabase/server";
import { getSellerAccess } from "@/lib/auth/seller-access";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const getUser = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const login = async (email: string, password: string) => {
  // Proceed with authentication
  const supabase = await createClient();
  const t = await getTranslations("auth.errors");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      throw new Error(t("invalidCredentials"));
    }
    if (error.message.includes("Email not confirmed")) {
      throw new Error(t("emailNotConfirmed"));
    }
    throw new Error(error.message);
  }

  // Verify user exists in response
  const user = data.user;
  if (!user) {
    throw new Error(t("userNotFound"));
  }

  // Access is decided by the sellers row (see lib/auth/seller-access.ts), not
  // by user_metadata.is_seller. Pending/suspended sellers may sign in; the
  // dashboard layout shows them a status screen instead of the dashboard.
  const access = await getSellerAccess(user.id);
  if (!access.allowed && access.reason === "no_seller") {
    await supabase.auth.signOut();
    throw new Error(t("noSellerAccount"));
  }

  return data;
};

export const resetPassword = async (email: string) => {
  const supabase = await createClient();
  const t = await getTranslations("auth.errors");

  // Add custom redirect URL for password reset
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login?reset=true`,
  });

  if (error) {
    // Provide more specific error messages
    if (error.message.includes("Invalid email")) {
      throw new Error(t("invalidEmail"));
    } else if (error.message.includes("rate limit")) {
      throw new Error(t("rateLimited"));
    } else if (error.message.includes("not found")) {
      throw new Error(t("accountNotFound"));
    } else {
      throw new Error(error.message);
    }
  }

  return data;
};

export const logout = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
};
