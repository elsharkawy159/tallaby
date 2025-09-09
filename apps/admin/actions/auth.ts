"use server";

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

export const getAdminUser = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const register = async (
  email: string,
  password: string,
  adminCode?: string
) => {
  const supabase = await createClient();

  // Validate admin code if provided
  if (adminCode) {
    // You can implement admin code validation here
    // For now, we'll just check if it's not empty
    if (!adminCode || adminCode.length < 3) {
      throw new Error("Invalid admin code");
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // If registration is successful and admin code is provided,
  // create user profile with admin role
  if (data.user && adminCode) {
    const { error: profileError } = await supabase.from("users").insert({
      id: data.user.id,
      email: data.user.email,
      role: "admin", // Default to admin role for admin code registrations
      isVerified: false, // Will be verified after email confirmation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Don't throw error here as the user is already created
    }
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

  // First check if the email belongs to an admin user
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("email", email)
    .single();

  if (profileError || !userProfile) {
    throw new Error("No admin account found with this email address.");
  }

  const adminRoles = ["admin", "super_admin", "moderator"];
  if (!adminRoles.includes(userProfile.role)) {
    throw new Error("This email is not associated with an admin account.");
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const logout = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
};

export const updateAdminProfile = async (updates: {
  fullName?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  department?: string;
  phone?: string;
  notes?: string;
}) => {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // Check if user has permission to update profiles
  const { data: currentProfile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !currentProfile) {
    throw new Error("User profile not found");
  }

  // Only super_admin can update roles
  if (updates.role && currentProfile.role !== "super_admin") {
    throw new Error("Only super administrators can update user roles");
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
