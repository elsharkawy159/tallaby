"use server";

import { unstable_cache } from "next/cache";
import { cartItems, carts, db } from "@workspace/db";
import {
  coupons,
  couponUsage,
  eq,
  and,
  sql,
  gte,
  lte,
  desc,
} from "@workspace/db";
import { getUser } from "./auth";

export async function validateCoupon(code: string, cart?: any) {
  // NOT CACHED: Real-time data - checks usage limits and cart totals that change frequently
  try {
    const user = await getUser();
    const now = new Date().toISOString();

    // Find coupon
    const coupon = await db.query.coupons.findFirst({
      where: and(
        eq(coupons.code, code),
        eq(coupons.isActive, true),
        lte(coupons.startsAt, now),
        gte(coupons.expiresAt, now)
      ),
    });

    if (!coupon) {
      return { success: false, error: "Invalid or expired coupon" };
    }

    // Check usage limit
    if (
      coupon.usageLimit &&
      coupon.usageCount &&
      coupon.usageCount >= coupon.usageLimit
    ) {
      return { success: false, error: "Coupon usage limit reached" };
    }

    // Check per-user limit
    if (user && coupon.perUserLimit) {
      const userUsage = await db
        .select({ count: sql<number>`count(*)` })
        .from(couponUsage)
        .where(
          and(
            eq(couponUsage.couponId, coupon.id),
            eq(couponUsage.userId, user.user.id)
          )
        );

      if (userUsage[0]?.count && userUsage[0].count >= coupon.perUserLimit) {
        return { success: false, error: "You have already used this coupon" };
      }
    }

    // Check minimum purchase if cart provided
    if (cart) {
      const subtotal = cart.cartItems.reduce(
        (sum: number, item: any) => sum + Number(item.price) * item.quantity,
        0
      );

      if (coupon.minimumPurchase && subtotal < Number(coupon.minimumPurchase)) {
        return {
          success: false,
          error: `Minimum purchase of ${coupon.minimumPurchase} required`,
        };
      }

      // Check applicable products/categories if specified
      if (coupon.applicableTo) {
        // Implementation for product/category restrictions
        // This would need to be customized based on your applicableTo structure
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discountType === "percentage") {
        discountAmount = subtotal * (Number(coupon.discountValue) / 100);
      } else if (coupon.discountType === "fixed_amount") {
        discountAmount = Number(coupon.discountValue);
      }

      // Apply maximum discount if set
      if (
        coupon.maximumDiscount &&
        discountAmount > Number(coupon.maximumDiscount)
      ) {
        discountAmount = Number(coupon.maximumDiscount);
      }

      return {
        success: true,
        data: {
          coupon,
          discountAmount,
          finalAmount: subtotal - discountAmount,
        },
      };
    }

    return { success: true, data: coupon };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { success: false, error: "Failed to validate coupon" };
  }
}

export async function getAvailableCoupons() {
  // CACHED: Semi-dynamic public data - available coupons change infrequently
  // Note: User-specific filtering happens after cache retrieval
  const user = await getUser();
  const cacheKey = `available-coupons${user?.user.id || ""}`;

  return unstable_cache(
    async () => {
      try {
        const now = new Date().toISOString();

        const conditions = [
          eq(coupons.isActive, true),
          lte(coupons.startsAt, now),
          gte(coupons.expiresAt, now),
        ];

        // If no seller ID (platform-wide coupons)
        conditions.push(sql`${coupons.sellerId} IS NULL`);

        const availableCoupons = await db.query.coupons.findMany({
          where: and(...conditions),
          orderBy: [desc(coupons.discountValue)],
        });

        // Filter out coupons user has already maxed out
        if (user) {
          const filteredCoupons = [];
          for (const coupon of availableCoupons) {
            if (coupon.perUserLimit) {
              const usage = await db
                .select({ count: sql<number>`count(*)` })
                .from(couponUsage)
                .where(
                  and(
                    eq(couponUsage.couponId, coupon.id),
                    eq(couponUsage.userId, user.user.id)
                  )
                );

              if (usage[0]?.count && usage[0].count < coupon.perUserLimit) {
                filteredCoupons.push(coupon);
              }
            } else {
              filteredCoupons.push(coupon);
            }
          }
          return { success: true, data: filteredCoupons };
        }

        return { success: true, data: availableCoupons };
      } catch (error) {
        console.error("Error fetching coupons:", error);
        return { success: false, error: "Failed to fetch coupons" };
      }
    },
    [cacheKey],
    {
      tags: ["coupons", "available-coupons"],
      revalidate: 1800, // 30 minutes - available coupons change infrequently
    }
  )();
}

export async function getSellerCoupons(sellerId: string) {
  // CACHED: Semi-dynamic public data - seller coupons change infrequently
  return unstable_cache(
    async () => {
      try {
        const now = new Date().toISOString();

        const sellerCoupons = await db.query.coupons.findMany({
          where: and(
            eq(coupons.sellerId, sellerId),
            eq(coupons.isActive, true),
            lte(coupons.startsAt, now),
            gte(coupons.expiresAt, now)
          ),
          orderBy: [desc(coupons.discountValue)],
        });

        return { success: true, data: sellerCoupons };
      } catch (error) {
        console.error("Error fetching seller coupons:", error);
        return { success: false, error: "Failed to fetch coupons" };
      }
    },
    [`seller-coupons-${sellerId}`],
    {
      tags: ["coupons", `seller-${sellerId}`],
      revalidate: 1800, // 30 minutes - seller coupons change infrequently
    }
  )();
}

export async function applyCouponToCart(cartId: string, couponCode: string) {
  // NOT CACHED: Mutation - applies coupon to user's cart
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Get cart
    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.id, cartId), eq(carts.userId, user.user.id)),
      with: {
        cartItems: {
          where: eq(cartItems.savedForLater, false),
        },
      },
    });

    if (!cart) {
      return { success: false, error: "Cart not found" };
    }

    // Validate coupon
    const validation = await validateCoupon(couponCode, cart);
    if (!validation.success) {
      return validation;
    }

    // Store coupon code in session or cart metadata
    // This would be used during order creation

    return {
      success: true,
      data: validation.data,
      message: "Coupon applied successfully",
    };
  } catch (error) {
    console.error("Error applying coupon:", error);
    return { success: false, error: "Failed to apply coupon" };
  }
}
