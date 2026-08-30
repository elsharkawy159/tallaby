"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";

/**
 * Signs a user in and routes them to the surface their role belongs to.
 * The role check itself lives in the proxy and in lib/auth.ts guards — this
 * only decides where to land, and deliberately gives no hint about which roles
 * exist when the credentials are wrong.
 */
export async function login(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, isVerified:is_verified, isSuspended:is_suspended")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.isSuspended) {
    await supabase.auth.signOut();
    return { success: false, error: "This account cannot access the shipping app" };
  }

  if (profile.role === "driver") {
    return { success: true, redirectTo: "/rider" };
  }

  if (profile.role === "admin" && profile.isVerified) {
    return { success: true, redirectTo: "/" };
  }

  await supabase.auth.signOut();
  return { success: false, error: "This account cannot access the shipping app" };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
