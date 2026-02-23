/**
 * Coupon calculation utilities
 * Handles discount computation for various coupon types
 */

export interface CouponData {
  id: string
  sellerId: string | null
  code: string
  name: string
  description: string | null
  discountType: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping'
  discountValue: string
  minimumPurchase: string | null
  maximumDiscount: string | null
  isActive: boolean
  isOneTimeUse: boolean
  usageLimit: number | null
  usageCount: number
  perUserLimit: number | null
  applicableTo: ApplicableToRules | null
  excludeItems: ExcludeItemsRules | null
  startsAt: string
  expiresAt: string
}

export interface ApplicableToRules {
  productIds?: string[]
  categoryIds?: string[]
  sellerIds?: string[]
  buy?: number
  get?: number
}

export interface ExcludeItemsRules {
  productIds?: string[]
  categoryIds?: string[]
}

export interface CartItemForCoupon {
  id: string
  productId: string
  sellerId: string
  categoryId?: string
  quantity: number
  price: string | number
}

export interface CouponCalculationResult {
  discountAmount: number
  shippingDiscount: number
  applicableSubtotal: number
  totalAfterDiscount: number
  error?: string
}

export interface CheckoutSummary {
  subtotal: number
  tax: number
  shippingCost: number
  total: number
  discountAmount?: number
  shippingDiscount?: number
  totalAfterDiscount?: number
  itemCount: number
  appliedCoupon?: {
    code: string
    name: string
    discountType: string
  } | null
}

/**
 * Get applicable items based on coupon rules
 */
function getApplicableItems(
  items: CartItemForCoupon[],
  coupon: CouponData
): CartItemForCoupon[] {
  let applicableItems = [...items]

  // Filter by seller if seller-specific coupon
  if (coupon.sellerId) {
    applicableItems = applicableItems.filter(
      item => item.sellerId === coupon.sellerId
    )
  }

  // Filter by applicable_to rules
  if (coupon.applicableTo) {
    const rules = coupon.applicableTo

    if (rules.productIds && rules.productIds.length > 0) {
      applicableItems = applicableItems.filter(item =>
        rules.productIds!.includes(item.productId)
      )
    }

    if (rules.categoryIds && rules.categoryIds.length > 0) {
      applicableItems = applicableItems.filter(
        item => item.categoryId && rules.categoryIds!.includes(item.categoryId)
      )
    }

    if (rules.sellerIds && rules.sellerIds.length > 0) {
      applicableItems = applicableItems.filter(item =>
        rules.sellerIds!.includes(item.sellerId)
      )
    }
  }

  // Exclude items based on exclude_items rules
  if (coupon.excludeItems) {
    const excludeRules = coupon.excludeItems

    if (excludeRules.productIds && excludeRules.productIds.length > 0) {
      applicableItems = applicableItems.filter(
        item => !excludeRules.productIds!.includes(item.productId)
      )
    }

    if (excludeRules.categoryIds && excludeRules.categoryIds.length > 0) {
      applicableItems = applicableItems.filter(
        item =>
          !item.categoryId ||
          !excludeRules.categoryIds!.includes(item.categoryId)
      )
    }
  }

  return applicableItems
}

/**
 * Calculate subtotal for a list of items
 */
function calculateSubtotal(items: CartItemForCoupon[]): number {
  return items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  )
}

/**
 * Calculate percentage discount
 */
function calculatePercentageDiscount(
  subtotal: number,
  discountValue: number,
  maximumDiscount: number | null
): number {
  let discount = subtotal * (discountValue / 100)

  if (maximumDiscount !== null && discount > maximumDiscount) {
    discount = maximumDiscount
  }

  return Math.min(discount, subtotal)
}

/**
 * Calculate fixed amount discount
 */
function calculateFixedDiscount(
  subtotal: number,
  discountValue: number,
  maximumDiscount: number | null
): number {
  let discount = discountValue

  if (maximumDiscount !== null && discount > maximumDiscount) {
    discount = maximumDiscount
  }

  return Math.min(discount, subtotal)
}

/**
 * Calculate buy X get Y discount
 * MVP: Simple implementation where discount_value represents free units
 * or applicable_to contains { buy: X, get: Y }
 */
function calculateBuyXGetYDiscount(
  items: CartItemForCoupon[],
  coupon: CouponData
): { discount: number; error?: string } {
  const rules = coupon.applicableTo

  // Get buy/get values from rules or use discountValue as free units
  const buyX = rules?.buy
  const getY = rules?.get ?? Number(coupon.discountValue)

  if (!buyX || !getY) {
    return {
      discount: 0,
      error: 'unsupportedCouponType'
    }
  }

  // Calculate based on qualifying items
  let totalDiscount = 0

  for (const item of items) {
    const eligibleSets = Math.floor(item.quantity / (buyX + getY))
    const freeItems = eligibleSets * getY
    const itemPrice = Number(item.price)
    totalDiscount += freeItems * itemPrice
  }

  return { discount: totalDiscount }
}

/**
 * Main discount calculation function
 */
export function calculateCouponDiscount(
  coupon: CouponData,
  items: CartItemForCoupon[],
  shippingCost: number,
  isGlobalShipping: boolean = true
): CouponCalculationResult {
  const applicableItems = getApplicableItems(items, coupon)
  const applicableSubtotal = calculateSubtotal(applicableItems)
  const fullSubtotal = calculateSubtotal(items)

  let discountAmount = 0
  let shippingDiscount = 0
  let error: string | undefined

  const discountValue = Number(coupon.discountValue)
  const maximumDiscount = coupon.maximumDiscount
    ? Number(coupon.maximumDiscount)
    : null

  switch (coupon.discountType) {
    case 'percentage':
      discountAmount = calculatePercentageDiscount(
        applicableSubtotal,
        discountValue,
        maximumDiscount
      )
      break

    case 'fixed_amount':
      discountAmount = calculateFixedDiscount(
        applicableSubtotal,
        discountValue,
        maximumDiscount
      )
      break

    case 'free_shipping':
      // Free shipping only applies if:
      // - Global coupon (sellerId is null) and shipping is global
      // - Or seller coupon and shipping is per-seller (not implemented in this codebase)
      if (coupon.sellerId && isGlobalShipping) {
        error = 'sellerCouponGlobalShipping'
        break
      }
      shippingDiscount = shippingCost
      break

    case 'buy_x_get_y':
      const result = calculateBuyXGetYDiscount(applicableItems, coupon)
      discountAmount = result.discount
      error = result.error
      break

    default:
      error = 'unsupportedCouponType'
  }

  const totalAfterDiscount = Math.max(
    0,
    fullSubtotal - discountAmount + shippingCost - shippingDiscount
  )

  return {
    discountAmount,
    shippingDiscount,
    applicableSubtotal,
    totalAfterDiscount,
    error
  }
}

/**
 * Build updated checkout summary with coupon applied
 */
export function buildSummaryWithCoupon(
  baseSummary: {
    subtotal: number
    tax: number
    shippingCost: number
    total: number
    itemCount: number
  },
  coupon: CouponData | null,
  calculationResult: CouponCalculationResult | null
): CheckoutSummary {
  if (!coupon || !calculationResult) {
    return {
      ...baseSummary,
      discountAmount: 0,
      shippingDiscount: 0,
      totalAfterDiscount: baseSummary.total,
      appliedCoupon: null
    }
  }

  const totalAfterDiscount = Math.max(
    0,
    baseSummary.subtotal +
      baseSummary.tax +
      baseSummary.shippingCost -
      calculationResult.discountAmount -
      calculationResult.shippingDiscount
  )

  return {
    ...baseSummary,
    discountAmount: calculationResult.discountAmount,
    shippingDiscount: calculationResult.shippingDiscount,
    totalAfterDiscount,
    appliedCoupon: {
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType
    }
  }
}
