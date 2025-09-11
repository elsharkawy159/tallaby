"use server";

import { createClient } from "@/supabase/server";
import { db, users, sellers } from "@workspace/db";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import {
  signInSchema,
  forgotPasswordSchema,
  type SignInFormData,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth-schemas";

export async function getUser() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getUserProfile() {
  try {
    const session = await getUser();
    if (!session?.user.id) {
      return null;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function getUserWithAddresses() {
  try {
    const session = await getUser();
    if (!session?.user.id) {
      return null;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      with: {
        userAddresses: {
          orderBy: (addresses, { desc }) => [desc(addresses.isDefault)],
        },
        paymentMethods: {
          where: (methods, { eq }) => eq(methods.isDefault, true),
          limit: 1,
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Error fetching user with addresses:", error);
    return null;
  }
}

// Return the current Supabase auth user (or null)

// Sign in with email + password
export async function signInAction({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, message: "Signed in successfully" };
}

// Send password reset email
export async function forgotPasswordAction(raw: unknown) {
  try {
    const parsed = forgotPasswordSchema.safeParse(
      raw as ForgotPasswordFormData
    );
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const supabase = await createClient();
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const origin = `${protocol}://${host}`;
    const redirectTo = `${origin}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo,
      }
    );
    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: "Password reset instructions sent to your email",
    };
  } catch (err) {
    console.error("forgotPasswordAction error:", err);
    return { success: false, message: "Failed to send reset instructions" };
  }
}

// Complete password reset when in recovery session
export async function resetPasswordAction(input: { password: string }) {
  try {
    if (!input?.password || input.password.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters",
      };
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: input.password,
    });
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: "Password has been updated" };
  } catch (err) {
    console.error("resetPasswordAction error:", err);
    return { success: false, message: "Failed to update password" };
  }
}

// Sign out current user
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

// Get Supabase user and matched seller profile
export async function getUserWithSellerProfile() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return { user: null, seller: null, error };
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, data.user.id),
    });

    return { user: data.user, seller: seller ?? null, error: null };
  } catch (err) {
    console.error("getUserWithSellerProfile error:", err);
    return { user: null, seller: null, error: err };
  }
}

export async function checkIfSeller() {
  try {
    const user = await getUserProfile();
    if (!user) return false;

    if (user.role === "seller" || user.role === "admin") {
      const seller = await db.query.sellers.findFirst({
        where: eq(sellers.id, user.id),
        columns: {
          id: true,
          status: true,
          isVerified: true,
        },
      });

      return seller && seller.status === "approved";
    }

    return false;
  } catch (error) {
    console.error("Error checking seller status:", error);
    return false;
  }
}

export async function getSessionId() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return sessionId;
}

export async function signUpUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  referralCode?: string;
  password?: string; // Supabase requires a password for sign up
}) {
  const supabase = await createClient();

  try {
    // Supabase signUp requires a password, so make sure it's provided
    if (!data.password) {
      return { success: false, error: "Password is required" };
    }

    // Prepare user metadata
    const userMetadata: Record<string, any> = {
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
    };
    if (data.phone) userMetadata.phone = data.phone;
    if (data.referralCode) userMetadata.referralCode = data.referralCode;

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: userMetadata,
      },
    });

    if (error) {
      // If user already exists, Supabase returns a specific error
      return { success: false, error: error.message };
    }

    return { success: true, data: signUpData.user };
  } catch (error) {
    console.error("Error creating user with Supabase:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUserProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferredLanguage?: string;
  defaultCurrency?: string;
  receiveMarketingEmails?: boolean;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const fullName =
      data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`
        : undefined;

    const updatedUser = await db
      .update(users)
      .set({
        ...data,
        ...(fullName && { fullName }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.user.id))
      .returning();

    return { success: true, data: updatedUser[0] };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
