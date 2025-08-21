"use server";

import bcrypt from "bcryptjs";
import { createClient } from "@/supabase/server";
import { db } from "@workspace/db";
import { users, userAddresses, wishlists, wishlistItems } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
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
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "Not authenticated",
      };
    }

    // Update user in database
    await db
      .update(users)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        phone: data.phone || null,
        timezone: data.timezone,
        preferredLanguage: data.preferredLanguage,
        defaultCurrency: data.defaultCurrency,
        receiveMarketingEmails: data.receiveMarketingEmails,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    // Revalidate profile pages
    revalidatePath("/profile");
    revalidatePath("/profile/addresses");
    revalidatePath("/profile/security");

    return {
      success: true,
      message: "Profile updated successfully!",
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
