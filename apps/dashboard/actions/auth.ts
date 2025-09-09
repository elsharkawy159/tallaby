"use server";

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

export const getUser = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const register = async (email: string, password: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const login = async (email: string, password: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // TODO: Add role checking logic here or in middleware
  // For now, just return the auth data
  return data;
};

export const resetPassword = async (email: string) => {
  const supabase = await createClient();

  // Add custom redirect URL for password reset
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login?reset=true`,
  });

  if (error) {
    // Provide more specific error messages
    if (error.message.includes("Invalid email")) {
      throw new Error("Please enter a valid email address");
    } else if (error.message.includes("rate limit")) {
      throw new Error(
        "Too many requests. Please wait a moment before trying again"
      );
    } else if (error.message.includes("not found")) {
      throw new Error("No account found with this email address");
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
