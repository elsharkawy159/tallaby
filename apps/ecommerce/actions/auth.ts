"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import type { User } from "@supabase/supabase-js";

import type {
  SignInFormData,
  SignUpFormData,
  ForgotPasswordFormData,
} from "@/lib/validations/auth-schemas";

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

/* Sign up a new user */
export async function signUpAction(
  formData: SignUpFormData
): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`,
          role: "customer",
        },
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    revalidatePath("/");

    return {
      success: true,
      message: data.session
        ? "Account created successfully!"
        : "Account created! Please check your email to verify your account.",
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

/* Sign in an existing user */
export async function signInAction(
  formData: SignInFormData
): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: "Logged in successfully!",
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

/* Send password reset email */
export async function forgotPasswordAction(
  formData: ForgotPasswordFormData
): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(
      formData.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      }
    );

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: "Password reset instructions sent to your email.",
    };
  } catch (error) {
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}

/* Sign out the current user */
export async function signOutAction(): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    revalidatePath("/");
    redirect("/");
  } catch (error) {
    return {
      success: false,
      message: "Something went wrong during sign out.",
    };
  }
}

/* Get current user */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return null;

  return user;
}

export async function getUserWithSellerProfile() {
  const supabase = await createClient();

  // Get the current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      seller: null,
      error: userError || new Error("No user found"),
    };
  }

  // Fetch user data from 'users' table
  const { data: userData, error: userTableError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (userTableError) {
    return { user: null, seller: null, error: userTableError };
  }

  // Fetch seller profile from 'sellers' table
  const { data: sellerData, error: sellerError } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", user.id)
    .single();

  // sellerData can be null if user is not a seller
  return {
    user: userData,
    seller: sellerData,
    error: sellerError || null,
  };
}
