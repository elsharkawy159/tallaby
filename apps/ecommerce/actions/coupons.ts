"use server"

import { unstable_cache, revalidateTag } from "next/cache"
import { db, carts, cartItems, coupons, couponUsage, eq, and, sql, gte, lte, desc, or, isNull } from "@workspace/db"
import { getUser } from "./auth"
import { getCurrentUserId } from "@/lib/get-current-user-id"
import {
  calculateCouponDiscount,
  buildSummaryWithCoupon,
  type CouponData,
  type CartItemForCoupon,
  type CheckoutSummary
} from "@/lib/coupon-utils"

interface ValidationResult {
  success: boolean
  error?: string
  minimumPurchase?: number
  data?: {
    coupon: CouponData
    discountAmount: number
    shippingDiscount: number
    totalAfterDiscount: number
    summary: CheckoutSummary
  }
}

interface CartWithItems {
  id: string
  cartItems: Array<{
    id: string
    productId: string
    sellerId: string
    quantity: number
    price: string | number
    product?: {
      categoryId?: string
    }
  }>
}

/**
 * Validate a coupon code against all rules
 */
export async function validateCoupon(
  code: string,
  cart?: CartWithItems
): Promise<ValidationResult> {
  try {
    const user = await getUser()
    const userId = user?.user?.id
    const now = new Date().toISOString()
    const normalizedCode = code.trim().toUpperCase()

    // Find coupon with case-insensitive match
    const coupon = await db.query.coupons.findFirst({
      where: and(
        sql`UPPER(${coupons.code}) = ${normalizedCode}`,
        eq(coupons.isActive, true)
      )
    })

    if (!coupon) {
      return { success: false, error: "invalidCoupon" }
    }

    // Check time window
    const startsAt = new Date(coupon.startsAt)
    const expiresAt = new Date(coupon.expiresAt)
    const currentTime = new Date(now)

    if (currentTime < startsAt) {
      return { success: false, error: "couponNotYetActive" }
    }

    if (currentTime > expiresAt) {
      return { success: false, error: "expiredCoupon" }
    }

    // Check global usage limit
    if (coupon.usageLimit !== null && coupon.usageCount !== null) {
      if (coupon.usageCount >= coupon.usageLimit) {
        return { success: false, error: "couponUsageLimitReached" }
      }
    }

    // Check per-user limit (requires logged in user)
    if (userId && coupon.perUserLimit !== null) {
      const userUsageResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(couponUsage)
        .where(
          and(
            eq(couponUsage.couponId, coupon.id),
            eq(couponUsage.userId, userId)
          )
        )

      const userUsageCount = userUsageResult[0]?.count ?? 0
      if (userUsageCount >= coupon.perUserLimit) {
        return { success: false, error: "alreadyUsed" }
      }
    }

    // Check one-time use (treat as per_user_limit = 1)
    if (userId && coupon.isOneTimeUse) {
      const userUsageResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(couponUsage)
        .where(
          and(
            eq(couponUsage.couponId, coupon.id),
            eq(couponUsage.userId, userId)
          )
        )

      const userUsageCount = userUsageResult[0]?.count ?? 0
      if (userUsageCount > 0) {
        return { success: false, error: "alreadyUsed" }
      }
    }

    // If no cart provided, return basic validation success
    if (!cart) {
      return {
        success: true,
        data: {
          coupon: coupon as CouponData,
          discountAmount: 0,
          shippingDiscount: 0,
          totalAfterDiscount: 0,
          summary: {
            subtotal: 0,
            tax: 0,
            shippingCost: 0,
            total: 0,
            itemCount: 0,
            discountAmount: 0,
            shippingDiscount: 0,
            totalAfterDiscount: 0,
            appliedCoupon: {
              code: coupon.code,
              name: coupon.name,
              discountType: coupon.discountType
            }
          }
        }
      }
    }

    // Calculate cart totals
    const cartItemsForCoupon: CartItemForCoupon[] = cart.cartItems.map(item => ({
      id: item.id,
      productId: item.productId,
      sellerId: item.sellerId,
      categoryId: item.product?.categoryId,
      quantity: item.quantity,
      price: item.price
    }))

    const subtotal = cartItemsForCoupon.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    )

    // Check minimum purchase requirement
    if (coupon.minimumPurchase !== null) {
      const minPurchase = Number(coupon.minimumPurchase)
      if (subtotal < minPurchase) {
        return {
          success: false,
          error: "minPurchase",
          minimumPurchase: minPurchase
        }
      }
    }

    // Calculate discount
    const shippingCost = Number(process.env.NEXT_PUBLIC_SHIPPING_COST) || 50
    const calculationResult = calculateCouponDiscount(
      coupon as CouponData,
      cartItemsForCoupon,
      shippingCost,
      true // isGlobalShipping
    )

    if (calculationResult.error) {
      return { success: false, error: calculationResult.error }
    }

    const tax = 0
    const baseSummary = {
      subtotal,
      tax,
      shippingCost,
      total: subtotal + tax + shippingCost,
      itemCount: cart.cartItems.reduce((sum, i) => sum + i.quantity, 0)
    }

    const summary = buildSummaryWithCoupon(
      baseSummary,
      coupon as CouponData,
      calculationResult
    )

    return {
      success: true,
      data: {
        coupon: coupon as CouponData,
        discountAmount: calculationResult.discountAmount,
        shippingDiscount: calculationResult.shippingDiscount,
        totalAfterDiscount: calculationResult.totalAfterDiscount,
        summary
      }
    }
  } catch (error) {
    console.error("Error validating coupon:", error)
    return { success: false, error: "failedToValidateCoupon" }
  }
}

/**
 * Apply a coupon to the current user's active cart
 */
export async function applyCouponToCart(data: { code: string }) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: "authenticationRequired" }
    }

    const normalizedCode = data.code.trim().toUpperCase()

    // Get the user's active cart with items
    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, userId), eq(carts.status, "active")),
      with: {
        cartItems: {
          where: eq(cartItems.savedForLater, false),
          with: {
            product: {
              columns: {
                categoryId: true
              }
            }
          }
        }
      }
    })

    if (!cart || cart.cartItems.length === 0) {
      return { success: false, error: "emptyCart" }
    }

    // Validate the coupon
    const validation = await validateCoupon(normalizedCode, cart)
    if (!validation.success) {
      return validation
    }

    // Store the applied coupon code in cart metadata
    // Since carts table doesn't have couponId, we'll return the validated data
    // The coupon code is passed during order creation
    revalidateTag("checkout")

    return {
      success: true,
      data: validation.data,
      message: "couponApplied"
    }
  } catch (error) {
    console.error("Error applying coupon:", error)
    return { success: false, error: "failedToApplyCoupon" }
  }
}

/**
 * Remove coupon from cart (clears coupon state)
 */
export async function removeCouponFromCart() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: "authenticationRequired" }
    }

    // Get the user's active cart
    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.userId, userId), eq(carts.status, "active")),
      with: {
        cartItems: {
          where: eq(cartItems.savedForLater, false)
        }
      }
    })

    if (!cart) {
      return { success: false, error: "cartNotFound" }
    }

    // Calculate totals without coupon
    const subtotal = cart.cartItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    )
    const tax = 0
    const shippingCost = Number(process.env.NEXT_PUBLIC_SHIPPING_COST) || 50
    const total = subtotal + tax + shippingCost

    const summary: CheckoutSummary = {
      subtotal,
      tax,
      shippingCost,
      total,
      itemCount: cart.cartItems.reduce((sum, i) => sum + i.quantity, 0),
      discountAmount: 0,
      shippingDiscount: 0,
      totalAfterDiscount: total,
      appliedCoupon: null
    }

    revalidateTag("checkout")

    return {
      success: true,
      data: { summary },
      message: "couponRemoved"
    }
  } catch (error) {
    console.error("Error removing coupon:", error)
    return { success: false, error: "failedToRemoveCoupon" }
  }
}

/**
 * Get available coupons for the current user
 */
export async function getAvailableCoupons() {
  const user = await getUser()
  const cacheKey = `available-coupons${user?.user.id || ""}`

  return unstable_cache(
    async () => {
      try {
        const now = new Date().toISOString()

        const conditions = [
          eq(coupons.isActive, true),
          lte(coupons.startsAt, now),
          gte(coupons.expiresAt, now)
        ]

        // Platform-wide coupons (no seller_id)
        conditions.push(isNull(coupons.sellerId))

        const availableCoupons = await db.query.coupons.findMany({
          where: and(...conditions),
          orderBy: [desc(coupons.discountValue)]
        })

        // Filter out coupons user has already maxed out
        if (user) {
          const filteredCoupons = []
          for (const coupon of availableCoupons) {
            if (coupon.perUserLimit) {
              const usage = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(couponUsage)
                .where(
                  and(
                    eq(couponUsage.couponId, coupon.id),
                    eq(couponUsage.userId, user.user.id)
                  )
                )

              if (usage[0]?.count && usage[0].count < coupon.perUserLimit) {
                filteredCoupons.push(coupon)
              }
            } else {
              filteredCoupons.push(coupon)
            }
          }
          return { success: true, data: filteredCoupons }
        }

        return { success: true, data: availableCoupons }
      } catch (error) {
        console.error("Error fetching coupons:", error)
        return { success: false, error: "failedToFetchCoupons" }
      }
    },
    [cacheKey],
    {
      tags: ["coupons", "available-coupons"],
      revalidate: 1800 // 30 minutes
    }
  )()
}

/**
 * Get seller-specific coupons
 */
export async function getSellerCoupons(sellerId: string) {
  return unstable_cache(
    async () => {
      try {
        const now = new Date().toISOString()

        const sellerCoupons = await db.query.coupons.findMany({
          where: and(
            eq(coupons.sellerId, sellerId),
            eq(coupons.isActive, true),
            lte(coupons.startsAt, now),
            gte(coupons.expiresAt, now)
          ),
          orderBy: [desc(coupons.discountValue)]
        })

        return { success: true, data: sellerCoupons }
      } catch (error) {
        console.error("Error fetching seller coupons:", error)
        return { success: false, error: "failedToFetchCoupons" }
      }
    },
    [`seller-coupons-${sellerId}`],
    {
      tags: ["coupons", `seller-${sellerId}`],
      revalidate: 1800 // 30 minutes
    }
  )()
}

/**
 * Record coupon usage when order is placed
 */
export async function recordCouponUsage(data: {
  couponId: string
  userId: string
  orderId: string
  discountAmount: number
}) {
  try {
    await db.insert(couponUsage).values({
      couponId: data.couponId,
      userId: data.userId,
      orderId: data.orderId,
      discountAmount: data.discountAmount.toString()
    })

    // Increment usage count on coupon
    await db
      .update(coupons)
      .set({
        usageCount: sql`${coupons.usageCount} + 1`
      })
      .where(eq(coupons.id, data.couponId))

    return { success: true }
  } catch (error) {
    console.error("Error recording coupon usage:", error)
    return { success: false, error: "failedToRecordUsage" }
  }
}
