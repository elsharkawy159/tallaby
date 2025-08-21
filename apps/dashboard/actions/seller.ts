"use server";

import { createClient } from "@/supabase/server";
import type { SellerStatus } from "@/lib/utils/seller";

export type SellerWithStatus = {
  id: string;
  businessName: string;
  displayName: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: SellerStatus;
  isVerified: boolean;
  supportEmail: string;
  supportPhone: string | null;
  storeRating: number | null;
  positiveRatingPercent: number | null;
  totalRatings: number;
  productCount: number;
  sellerLevel: string;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Get seller profile by user ID using Supabase client
 * @param userId - The user ID (which is the same as seller ID in our schema)
 * @returns Promise<SellerWithStatus | null>
 */
export const getSeller = async (
  userId: string
): Promise<SellerWithStatus | null> => {
  try {
    const supabase = await createClient();

    const { data: seller, error } = await supabase
      .from("sellers")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching seller:", error);
      return null;
    }

    if (!seller) {
      return null;
    }

    return {
      id: seller.id,
      businessName: seller.business_name,
      displayName: seller.display_name,
      slug: seller.slug,
      description: seller.description,
      logoUrl: seller.logo_url,
      bannerUrl: seller.banner_url,
      status: seller.status as SellerStatus,
      isVerified: seller.is_verified,
      supportEmail: seller.support_email,
      supportPhone: seller.support_phone,
      storeRating: seller.store_rating,
      positiveRatingPercent: seller.positive_rating_percent,
      totalRatings: seller.total_ratings,
      productCount: seller.product_count,
      sellerLevel: seller.seller_level,
      joinDate: seller.join_date,
      createdAt: seller.created_at,
      updatedAt: seller.updated_at,
    };
  } catch (error) {
    console.error("Error fetching seller:", error);
    return null;
  }
};

/**
 * Get current authenticated user's seller profile
 * @returns Promise<SellerWithStatus | null>
 */
export const getCurrentSeller = async (): Promise<SellerWithStatus | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return await getSeller(user.id);
  } catch (error) {
    console.error("Error fetching current seller:", error);
    return null;
  }
};

/**
 * Check if user has seller profile
 * @param userId - The user ID to check
 * @returns Promise<boolean>
 */
export const hasSellerProfile = async (userId: string): Promise<boolean> => {
  try {
    const seller = await getSeller(userId);
    return seller !== null;
  } catch (error) {
    console.error("Error checking seller profile:", error);
    return false;
  }
};
