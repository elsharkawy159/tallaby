"use server";

import bcrypt from "bcryptjs";
import { createClient } from "@/supabase/server";
import { db, eq, desc, and } from "@workspace/db";
import { userAddresses, wishlists, users } from "@workspace/db";
import { revalidatePath } from "next/cache";
import type {
  ProfileFormData,
  AddressFormData,
  SecurityFormData,
  UserAddress,
  Wishlist,
  AddressType,
} from "./profile.types";

// Server action result type
type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  data?: any;
};

/* Update user profile */
export const updateUserProfile = async (
  data: ProfileFormData
): Promise<ActionResult> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: data.fullName,
        phone: data.phone || null,
        timezone: data.timezone,
        preferredLanguage: data.preferredLanguage,
        defaultCurrency: data.defaultCurrency,
        receiveMarketingEmails: data.receiveMarketingEmails,
        // OAuth compatibility fields
        name: data.fullName,
      },
    });

    if (authUpdateError) {
      console.error("Update user_metadata error:", authUpdateError);
      return {
        success: false,
        message: "Failed to update profile in authentication provider.",
      };
    }

    // Revalidate profile pages
    revalidatePath("/profile");

    return {
      success: true,
      message: "", // Message will be handled by client-side translation
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return {
      success: false,
      message: "Failed to update profile. Please try again.",
    };
  }
};

/* Get user addresses */
export const getUserAddresses = async (): Promise<UserAddress[]> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get addresses from database
    const addresses = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, user.id))
      .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));

    // Transform the addresses to match our types
    return addresses.map((address) => ({
      id: address.id,
      userId: address.userId,
      addressType: (address.addressType || "both") as AddressType,
      fullName: address.fullName,
      phone: address.phone,
      company: address.company,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: Boolean(address.isDefault),
      isBusinessAddress: Boolean(address.isBusinessAddress),
      deliveryInstructions: address.deliveryInstructions,
      accessCode: address.accessCode,
      latitude: address.latitude,
      longitude: address.longitude,
      createdAt: address.createdAt || new Date().toISOString(),
      updatedAt: address.updatedAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Get addresses error:", error);
    return [];
  }
};

/* Create new address */
export const createAddress = async (
  data: AddressFormData
): Promise<ActionResult> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Check address limit (10 addresses max)
    const existingAddresses = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, user.id));

    if (existingAddresses.length >= 10) {
      return {
        success: false,
        message: "You can only have up to 10 addresses",
      };
    }

    // If this is set as default, remove default from other addresses
    if (data.isDefault) {
      await db
        .update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, user.id));
    }

    // Create new address
    const [newAddress] = await db
      .insert(userAddresses)
      .values({
        userId: user.id,
        addressType: data.addressType,
        fullName: data.fullName,
        phone: data.phone,
        company: data.company || null,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault,
        isBusinessAddress: data.isBusinessAddress,
        deliveryInstructions: data.deliveryInstructions || null,
        accessCode: data.accessCode || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Revalidate addresses pages
    revalidatePath("/profile");
    revalidatePath("/profile/addresses");

    return {
      success: true,
      message: "Address added successfully!",
      data: newAddress,
    };
  } catch (error) {
    console.error("Create address error:", error);
    return {
      success: false,
      message: "Failed to add address. Please try again.",
    };
  }
};

/* Update existing address */
export const updateAddress = async (
  addressId: string,
  data: AddressFormData
): Promise<ActionResult> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Verify address belongs to user
    const existingAddress = await db
      .select()
      .from(userAddresses)
      .where(
        and(eq(userAddresses.id, addressId), eq(userAddresses.userId, user.id))
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return {
        success: false,
        message: "Address not found",
      };
    }

    // If this is set as default, remove default from other addresses
    if (data.isDefault) {
      await db
        .update(userAddresses)
        .set({ isDefault: false })
        .where(
          and(
            eq(userAddresses.userId, user.id),
            eq(userAddresses.id, addressId)
          )
        );
    }

    // Update address
    const [updatedAddress] = await db
      .update(userAddresses)
      .set({
        addressType: data.addressType,
        fullName: data.fullName,
        phone: data.phone,
        company: data.company || null,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault,
        isBusinessAddress: data.isBusinessAddress,
        deliveryInstructions: data.deliveryInstructions || null,
        accessCode: data.accessCode || null,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(eq(userAddresses.id, addressId), eq(userAddresses.userId, user.id))
      )
      .returning();

    // Revalidate addresses pages
    revalidatePath("/profile");
    revalidatePath("/profile/addresses");

    return {
      success: true,
      message: "Address updated successfully!",
      data: updatedAddress,
    };
  } catch (error) {
    console.error("Update address error:", error);
    return {
      success: false,
      message: "Failed to update address. Please try again.",
    };
  }
};

/* Delete address */
export const deleteAddress = async (
  addressId: string
): Promise<ActionResult> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Verify address belongs to user and delete
    const deletedAddress = await db
      .delete(userAddresses)
      .where(
        and(eq(userAddresses.id, addressId), eq(userAddresses.userId, user.id))
      )
      .returning();

    if (deletedAddress.length === 0) {
      return {
        success: false,
        message: "Address not found",
      };
    }

    // Revalidate addresses pages
    revalidatePath("/profile");
    revalidatePath("/profile/addresses");

    return {
      success: true,
      message: "Address deleted successfully!",
    };
  } catch (error) {
    console.error("Delete address error:", error);
    return {
      success: false,
      message: "Failed to delete address. Please try again.",
    };
  }
};

/* Get user wishlists */
export const getUserWishlists = async (): Promise<Wishlist[]> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get wishlists from database
    const userWishlists = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.userId, user.id))
      .orderBy(desc(wishlists.createdAt));

    // Transform the wishlists to match our types
    return userWishlists.map((wishlist) => ({
      id: wishlist.id,
      userId: wishlist.userId,
      name: wishlist.name,
      description: wishlist.description,
      isDefault: Boolean(wishlist.isDefault),
      isPublic: Boolean(wishlist.isPublic),
      shareUrl: wishlist.shareUrl,
      createdAt: wishlist.createdAt || new Date().toISOString(),
      updatedAt: wishlist.updatedAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Get wishlists error:", error);
    return [];
  }
};

/* Create new wishlist */
export const createWishlist = async (name: string): Promise<ActionResult> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Check wishlist limit (5 wishlists max)
    const existingWishlists = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.userId, user.id));

    if (existingWishlists.length >= 5) {
      return {
        success: false,
        message: "You can only have up to 5 wishlists",
      };
    }

    // Create new wishlist
    const [newWishlist] = await db
      .insert(wishlists)
      .values({
        userId: user.id,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Revalidate wishlist pages
    revalidatePath("/profile");
    revalidatePath("/wishlist");

    return {
      success: true,
      message: "Wishlist created successfully!",
      data: newWishlist,
    };
  } catch (error) {
    console.error("Create wishlist error:", error);
    return {
      success: false,
      message: "Failed to create wishlist. Please try again.",
    };
  }
};

/**
 * Generate a unique referral code using timestamp and random characters
 * Format: 4 chars (timestamp base36) + 4 chars (random) = 8 chars total
 */
function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  // Get current timestamp and convert to base36 (compact representation)
  const timestamp = Date.now();
  const timestampBase36 = timestamp.toString(36).toUpperCase();

  // Take the last 4 characters from timestamp (most unique part)
  const timestampPart = timestampBase36.slice(-4).padStart(4, "0");

  // Generate 4 random characters
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Combine: timestamp part + random part
  return timestampPart + randomPart;
}

/* Generate and store referral code in user_metadata */
export const generateUserReferralCode = async (): Promise<ActionResult> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Check if user already has a referral code in user_metadata
    if (user.user_metadata?.referral_code) {
      return {
        success: true,
        message: "Referral code already exists",
        data: { referralCode: user.user_metadata.referral_code },
      };
    }

    // Generate a unique referral code
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      referralCode = generateReferralCode();

      // Check if code exists in database
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, referralCode))
        .limit(1);

      if (existingUser.length === 0) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      return {
        success: false,
        message: "Failed to generate unique referral code. Please try again.",
      };
    }

    // Update user_metadata with referral code
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        referral_code: referralCode!,
      },
    });

    if (authUpdateError) {
      console.error("Update user_metadata error:", authUpdateError);
      return {
        success: false,
        message: "Failed to save referral code",
      };
    }

    // Revalidate profile pages
    revalidatePath("/profile");

    return {
      success: true,
      message: "Referral code generated successfully!",
      data: { referralCode: referralCode! },
    };
  } catch (error) {
    console.error("Generate referral code error:", error);
    return {
      success: false,
      message: "Failed to generate referral code. Please try again.",
    };
  }
};

/* Get user's total points from database */
export const getUserPoints = async (): Promise<number | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("user_points")
      .select("total_points")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      // If no record exists, return 0 instead of null
      return 0;
    }

    return data.total_points ?? 0;
  } catch (error) {
    console.error("Get user points error:", error);
    return 0;
  }
};

/* Get user's referredBy status from database */
export const getUserReferredBy = async (): Promise<string | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const userRecord = await db
      .select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    return userRecord.length > 0 && userRecord[0]?.referredBy
      ? userRecord[0].referredBy
      : null;
  } catch (error) {
    console.error("Get user referredBy error:", error);
    return null;
  }
};

/* Apply referral code (referred_by will be updated in users table via trigger/function) */
export const applyReferralCode = async (
  referralCode: string
): Promise<ActionResult> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Check if user already has a referredBy value in database
    const userRecord = await db
      .select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length > 0 && userRecord[0]?.referredBy) {
      return {
        success: false,
        message: "You have already used a referral code",
      };
    }

    // Normalize the referral code (uppercase, trim)
    const normalizedCode = referralCode.toUpperCase().trim();

    if (!normalizedCode) {
      return {
        success: false,
        message: "Please enter a valid referral code",
      };
    }

    // Find user with this referral code in database
    const referringUser = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, normalizedCode))
      .limit(1);

    if (referringUser.length === 0 || !referringUser[0]) {
      return {
        success: false,
        message: "Invalid referral code",
      };
    }

    const referrerId = referringUser[0].id;

    // Can't refer yourself
    if (referrerId === user.id) {
      return {
        success: false,
        message: "You cannot use your own referral code",
      };
    }

    // Update referred_by in users table
    try {
      await db
        .update(users)
        .set({
          referredBy: referrerId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, user.id));
    } catch (dbError) {
      console.error("Database update error:", dbError);
      return {
        success: false,
        message: "Failed to apply referral code. Please try again.",
      };
    }

    // Revalidate profile pages
    revalidatePath("/profile");

    return {
      success: true,
      message: "Referral code applied successfully!",
    };
  } catch (error) {
    console.error("Apply referral code error:", error);
    return {
      success: false,
      message: "Failed to apply referral code. Please try again.",
    };
  }
};
