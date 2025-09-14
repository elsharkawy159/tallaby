"use server";

import { createClient } from "@/supabase/server";
import { db, users, eq, sellers } from "@workspace/db";
import { redirect } from "next/navigation";

export const getUser = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

// Check if user is eligible to access seller dashboard before authentication
export const checkUserEligibility = async (email: string) => {
  // First, find user by email in the users table
  const userProfile = await db.query.users.findFirst({
    where: eq(users.email, email),
    select: {
      id: true,
      role: true,
      email: true,
    },
  } as any);

  if (!userProfile) {
    throw new Error("No account found with this email address");
  }

  // Check if user has seller role
  if (userProfile.role !== "seller") {
    throw new Error("Access denied: Only sellers can access the dashboard");
  }

  // Check if seller profile exists
  const sellerProfile = await db.query.sellers.findFirst({
    where: eq(sellers.id, userProfile.id),
    select: {
      id: true,
    },
  } as any);

  if (!sellerProfile) {
    throw new Error(
      "Seller profile not found. Please complete your seller registration."
    );
  }

  switch (sellerProfile.status) {
    case "pending":
      throw new Error("Seller profile is pending. Please wait for approval.");
    case "suspended":
      throw new Error(
        "Seller profile is suspended. Please contact support for assistance."
      );
    case "restricted":
      throw new Error(
        "Seller profile is restricted. Please contact support for more information."
      );
    // You can add more cases if needed
  }

  return { userProfile, sellerProfile };
};

export const login = async (email: string, password: string) => {
  // Pre-authentication checks
  await checkUserEligibility(email);

  // Proceed with authentication
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Verify user exists in response
  const user = data.user;
  if (!user) {
    throw new Error("Authentication failed: user not found.");
  }

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
