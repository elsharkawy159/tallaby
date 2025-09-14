"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
import { db, sellers, eq } from "@workspace/db";
import {
  sellerApplicationSchema,
  createSellerSchema,
  type SellerApplicationFormData,
  type CreateSellerData,
} from "./become-seller.dto";
import type { SellerApplicationResult } from "./become-seller.types";
import { createDisplayName, generateSlug } from "./become-seller.lib";

export const submitSellerApplication = async (
  formData: SellerApplicationFormData
): Promise<SellerApplicationResult> => {
  try {
    // 1. Validate form data on server (double validation)
    const validatedData = sellerApplicationSchema.parse(formData);

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "You must be logged in to submit a seller application",
      };
    }

    // 3. Check if user is already a seller
    const existingSeller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.id, user.id))
      .limit(1);

    if (existingSeller.length > 0) {
      return {
        success: false,
        message:
          "You already have a seller account. Please check your dashboard.",
      };
    }

    // 4. Generate unique slug for business
    const baseSlug = generateSlug(validatedData.businessName);
    let uniqueSlug = baseSlug;
    let counter = 1;

    // Check for slug uniqueness
    while (true) {
      const existingSlugSeller = await db
        .select()
        .from(sellers)
        .where(eq(sellers.slug, uniqueSlug))
        .limit(1);

      if (existingSlugSeller.length === 0) break;

      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 5. Create seller profile - SIMPLIFIED
    const displayName = createDisplayName(validatedData.businessName);

    const sellerData: CreateSellerData = {
      userId: user.id,
      businessName: validatedData.businessName,
      displayName,
      slug: uniqueSlug,
      businessType: validatedData.businessType,
      legalAddress: {
        street: validatedData.addressLine1,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
      },
      supportEmail: validatedData.supportEmail,
    };

    // Validate seller data before insertion
    const validatedSellerData = createSellerSchema.parse(sellerData);

    // Insert seller record - SIMPLIFIED
    const newSeller = await db
      .insert(sellers)
      .values({
        id: user.id, // Foreign key to users.id
        businessName: validatedSellerData.businessName,
        displayName: validatedSellerData.displayName,
        slug: validatedSellerData.slug,
        businessType: validatedSellerData.businessType,
        legalAddress: validatedSellerData.legalAddress,
        supportEmail: validatedSellerData.supportEmail,
        // All other fields will use defaults or null
      })
      .returning({ id: sellers.id });

    // 6. Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/become-seller");

    // 7. Return success response
    const successResponse = {
      success: true,
      message:
        "🎉 Seller account created successfully! Pending approval from admin.",
      data: {
        sellerId: newSeller[0]?.id || user.id,
      },
    };

    return successResponse;
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const field = err.path.join(".");
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(err.message);
      });

      const zodErrorResponse = {
        success: false,
        message: "Please fix the validation errors and try again",
        errors: fieldErrors,
      };

      return zodErrorResponse;
    }

    // Handle database constraint errors
    if (error instanceof Error) {
      if (error.message.includes("unique constraint")) {
        if (error.message.includes("slug")) {
          const slugErrorResponse = {
            success: false,
            message:
              "A business with this name already exists. Please choose a different business name.",
          };
          return slugErrorResponse;
        }
        if (error.message.includes("email")) {
          const emailErrorResponse = {
            success: false,
            message:
              "This email is already associated with another seller account.",
          };
          return emailErrorResponse;
        }
      }
    }

    // Generic error fallback
    const genericErrorResponse = {
      success: false,
      message:
        "Something went wrong while processing your application. Please try again later.",
    };

    return genericErrorResponse;
  }
};

/**
 * Checks if a business name slug is available
 * @param businessName - The business name to check
 * @returns Promise<boolean>
 */
export const checkBusinessNameAvailability = async (
  businessName: string
): Promise<boolean> => {
  try {
    if (!businessName.trim()) return false;

    const slug = generateSlug(businessName);
    const existingSeller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.slug, slug))
      .limit(1);

    return existingSeller.length === 0;
  } catch (error) {
    return false;
  }
};

/**
 * Gets seller application status for current user
 * @returns Promise<{ exists: boolean; status?: string; businessName?: string }>
 */
export const getSellerApplicationStatus = async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { exists: false, user: null };
    }

    const seller = await db
      .select({
        status: sellers.status,
        businessName: sellers.businessName,
      })
      .from(sellers)
      .where(eq(sellers.id, user.id))
      .limit(1);

    if (seller.length === 0) {
      return { exists: false, user: true };
    }

    const statusResult = {
      exists: true,
      status: seller[0]?.status,
      businessName: seller[0]?.businessName,
      user: user,
    };

    return statusResult;
  } catch (error) {
    return { exists: false };
  }
};
