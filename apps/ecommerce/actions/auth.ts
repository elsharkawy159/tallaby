"use server";

import { createClient } from "@/supabase/server";
import { db, users, sellers, eq } from "@workspace/db";
import { cookies, headers } from "next/headers";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth-schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getAuthUser, getAuthUserDisplay } from "@/lib/auth/current-user";
import type { AuthenticatedUserDisplay } from "@/lib/auth/auth-user.types";

/**
 * Sourced from getAuthUser() (React cache()-deduplicated per request) so
 * every one of this function's callers across the app shares a single
 * supabase.auth.getUser() network round-trip per request, instead of each
 * issuing its own.
 */
export async function getUser() {
  try {
    const user = await getAuthUser();
    return user ? { user } : null;
  } catch {
    return null;
  }
}

/**
 * The navbar's (and every other client component's) single source of truth for
 * the current viewer.
 *
 * Routes under (main) are ISR-rendered (`revalidate = 60` and up), so the
 * layout that hosts the header cannot read cookies without turning the whole
 * storefront dynamic. The viewer is therefore resolved after hydration — but
 * through this one server action rather than by each component calling
 * Supabase from the browser, so the answer is computed with the server client,
 * includes the application profile row, and is fetched exactly once per page.
 */
export async function getCurrentUserDisplay(): Promise<AuthenticatedUserDisplay | null> {
  try {
    const display = await getAuthUserDisplay();
    // #region agent log
    fetch('http://127.0.0.1:7624/ingest/6c4132ee-ad2b-461c-81f7-d283121d1f71',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7135eb'},body:JSON.stringify({sessionId:'7135eb',runId:'pre-fix',hypothesisId:'A',location:'actions/auth.ts:getCurrentUserDisplay',message:'getCurrentUserDisplay resolved',data:{hasUser:Boolean(display),userIdPrefix:display?.id?.slice(0,8)??null,hasAvatar:Boolean(display?.avatarUrl),isSeller:display?.isSeller??false},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return display;
  } catch (error) {
    console.error("getCurrentUserDisplay error:", error);
    // #region agent log
    fetch('http://127.0.0.1:7624/ingest/6c4132ee-ad2b-461c-81f7-d283121d1f71',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7135eb'},body:JSON.stringify({sessionId:'7135eb',runId:'pre-fix',hypothesisId:'A',location:'actions/auth.ts:getCurrentUserDisplay:error',message:'getCurrentUserDisplay threw',data:{errorName:error instanceof Error?error.name:'unknown'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return null;
  }
}

export async function getUserProfile() {
  try {
    const session = await getUser();
    if (!session?.user.id) {
      return { error: "User not found" };
    }

    // Get user data from database (this is our source of truth)
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return { error: "User profile not found" };
    }

    // Return the user data directly from database
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    return { error: error };
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // #region agent log
    fetch('http://127.0.0.1:7624/ingest/6c4132ee-ad2b-461c-81f7-d283121d1f71',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'7135eb'},body:JSON.stringify({sessionId:'7135eb',runId:'pre-fix',hypothesisId:'D',location:'actions/auth.ts:signInAction:error',message:'signInAction failed',data:{errorCode:error.code??null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { success: false, message: error.message };
  }

  // Merge guest account data if guest was using the app
  try {
    const { mergeGuestAccount } = await import("./merge-guest-account");
    await mergeGuestAccount();
  } catch (mergeError) {
    // Log but don't fail sign in if merge fails
    console.error("Failed to merge guest account:", mergeError);
  }

  // Resolve the display model in the same request that wrote the session
  // cookies, so the client can paint the navbar immediately without waiting
  // for a follow-up /api/auth/me round-trip that might still miss cookies.
  const displayUser = await getAuthUserDisplay();

  // #region agent log
  fetch("http://127.0.0.1:7624/ingest/6c4132ee-ad2b-461c-81f7-d283121d1f71", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "7135eb",
    },
    body: JSON.stringify({
      sessionId: "7135eb",
      runId: "post-fix",
      hypothesisId: "D",
      location: "actions/auth.ts:signInAction:success",
      message: "signInAction succeeded",
      data: {
        hasSession: Boolean(data.session),
        userIdPrefix: data.user?.id?.slice(0, 8) ?? null,
        hasDisplayUser: Boolean(displayUser),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    success: true,
    message: "Signed in successfully",
    user: displayUser,
  };
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
  const locale = await getLocale();
  redirect({ href: "/", locale });
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

    const user = await db.query.users.findFirst({
      where: eq(users.id, data.user.id),
    });

    return {
      user: { ...data.user, user: user },
      seller: seller ?? null,
      error: null,
    };
  } catch (err) {
    console.error("getUserWithSellerProfile error:", err);
    return { user: null, seller: null, error: err };
  }
}

export async function checkIfSeller() {
  try {
    const userResult = await getUserProfile();
    if (!userResult || "error" in userResult) return false;

    // Type assertion since we've already checked it's not an error
    const user = userResult as any;
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
  fullName: string;
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
      full_name: data.fullName,
    };
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

export async function uploadAvatar(file: File) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading file:", error);
      return { success: false, error: "Failed to upload avatar" };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return {
      success: true,
      data: {
        path: filePath,
        url: publicUrl,
      },
      message: "Avatar uploaded successfully",
    };
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return { success: false, error: "Failed to upload avatar" };
  }
}

export async function deleteAvatar(filePath: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Delete file from Supabase Storage
    const { error } = await supabase.storage.from("avatars").remove([filePath]);

    if (error) {
      console.error("Error deleting file:", error);
      return { success: false, error: "Failed to delete avatar" };
    }

    return {
      success: true,
      message: "Avatar deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return { success: false, error: "Failed to delete avatar" };
  }
}

export async function updateUserProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar_url?: string;
  timezone?: string;
  preferredLanguage?: string;
  defaultCurrency?: string;
  receiveMarketingEmails?: boolean;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createClient();

    // Prepare data for Supabase auth metadata
    const authMetadata: Record<string, any> = {};

    // Add fields that can be stored in Supabase auth metadata
    if (data.firstName !== undefined) authMetadata.firstName = data.firstName;
    if (data.lastName !== undefined) authMetadata.lastName = data.lastName;
    if (data.phone !== undefined) authMetadata.phone = data.phone;
    if (data.avatar_url !== undefined)
      authMetadata.avatar_url = data.avatar_url;

    // Update fullName if firstName or lastName changed
    if (data.firstName !== undefined || data.lastName !== undefined) {
      const currentUser = user.user;
      const firstName =
        data.firstName !== undefined
          ? data.firstName
          : currentUser.user_metadata?.firstName || "";
      const lastName =
        data.lastName !== undefined
          ? data.lastName
          : currentUser.user_metadata?.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();

      if (fullName) {
        authMetadata.full_name = fullName;
      }
    }

    // Update Supabase auth metadata
    const { data: updatedUser, error: authError } =
      await supabase.auth.updateUser({
        data: authMetadata,
      });

    if (authError) {
      console.error("Error updating auth metadata:", authError);
      return {
        success: false,
        error: "Failed to update profile",
      };
    }

    // Mirror the profile fields the `users` table owns.
    //
    // Auth metadata alone used to be the only place an uploaded avatar landed,
    // so `users.avatar_url` — the column review authors and seller pages read —
    // stayed null forever and the same person appeared with an avatar in the
    // navbar and without one on their reviews. Writing both keeps the profile
    // row canonical while metadata remains the OAuth fallback.
    const profileUpdate: Partial<typeof users.$inferInsert> = {};
    if (data.avatar_url !== undefined) profileUpdate.avatarUrl = data.avatar_url;
    if (data.phone !== undefined) profileUpdate.phone = data.phone;
    if (typeof authMetadata.full_name === "string") {
      profileUpdate.fullName = authMetadata.full_name;
    }
    if (data.preferredLanguage !== undefined)
      profileUpdate.preferredLanguage = data.preferredLanguage;
    if (data.timezone !== undefined) profileUpdate.timezone = data.timezone;
    if (data.defaultCurrency !== undefined)
      profileUpdate.defaultCurrency = data.defaultCurrency;
    if (data.receiveMarketingEmails !== undefined)
      profileUpdate.receiveMarketingEmails = data.receiveMarketingEmails;

    if (Object.keys(profileUpdate).length > 0) {
      try {
        // Scoped to the caller's own id — never an id supplied by the client.
        await db
          .update(users)
          .set({ ...profileUpdate, updatedAt: new Date().toISOString() })
          .where(eq(users.id, user.user.id));
      } catch (dbError) {
        // Auth metadata already succeeded and is the read fallback, so a failed
        // mirror degrades rather than losing the change.
        console.error("Error mirroring profile to users table:", dbError);
      }
    }

    return {
      success: true,
      data: updatedUser.user,
      message: "Profile updated successfully",
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
