import {
  db,
  orders,
  sellers,
  orderItems,
  userAddresses,
  couponUsage,
  coupons,
  carts,
  cartItems,
  payments,
  eq,
  and,
  sql,
  inArray,
} from '@workspace/db'
import {
  decrementStock,
  InsufficientStockError,
  type StockLine,
} from '@workspace/db/inventory'
import { claimCouponUsage } from '@workspace/db/coupons'
import {
  getOrCreateUserWallet,
  postWalletTransaction,
  WALLET_REFERENCE_TYPES,
  InsufficientWalletBalanceError,
  WalletNotActiveError,
  WalletNotFoundError,
} from '@workspace/db/wallet'
import {
  resolveAffiliateForCoupon,
  createPendingAffiliateCommission,
} from '@workspace/db/affiliates'
import {
  calculateLocationShippingCost,
  calculateSellerFreeDeliveryDiscount,
  getThresholdShippingDiscount,
} from '../shipping/shipping.lib'
import {
  allocateDiscountAcrossLines,
  isCouponAllowedOnChannel,
  isLineEligibleForCoupon,
} from './coupon-scope.lib'
import {
  formatDecimal,
  formatVariantTitleFromCart,
  generateOrderNumber,
  pickProductTitle,
} from './place-order.lib'
import {
  buildOrderDiscountLines,
  type OrderDiscountLine,
} from './order-discounts'
import { sendOrderConfirmationEmail, sendOrderEventEmail } from './notify'
import { computeOrderLineFees, type PlatformFeeSnapshot } from './platform-fee.lib'
import { isCodEligibleForShipping, parseWalletPartialPaymentMethod } from './payment.lib'
import {
  isStorefrontCheckoutMethodAllowed,
  sellerTransferFor,
  storeShippingCollector,
  type StorefrontCheckoutPayments,
} from '../payments/store-methods'
import {
  resolveStorefrontShipping,
  zoneSellerFreeDeliveryDiscount,
  type StorefrontShipping,
} from '../shipping/store-quote'
import { getStorefrontShippingContext } from '../stores/shipping-context.server'
import { isStorePhoneBlocked } from '../stores/blocked-phones.server'

/**
 * Snapshot on every store-website order placed while the store delivers itself
 * (store shipping spec §6.5): how the shipping was priced and what the
 * customer paid for it. Drives the seller shipping credit (§6.8).
 */
export interface StoreShippingSnapshot {
  method: 'own'
  pricedBy: 'zone' | 'tallaby_rates'
  zoneId?: string
  zoneName?: { ar: string; en: string | null }
  place: string | null
  billedPiastres: number
  /**
   * Who collects the customer's money (`storeShippingCollector`). The seller
   * shipping credit is posted only for `tallaby`; cash paid to the deliverer
   * (COD) is `seller` (the seller already holds the shipping).
   */
  collector: 'tallaby' | 'seller'
}

/** Internal control-flow signal: coupon lost a concurrent usage-limit race. */
class CouponClaimFailedError extends Error {}

export type OrderSource = 'website' | 'external' | 'storefront'

export interface PaymentOverrides {
  paymentMethod: string
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'collected'
  status:
    | 'pending'
    | 'payment_processing'
    | 'confirmed'
    | 'shipping_soon'
    | 'shipped'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'refund_requested'
    | 'refunded'
    | 'returned'
  paidAt?: string
  /** When true, inserts a payments row after order creation (external paid flow). */
  recordPayment?: boolean
}

/**
 * Admin-entered replacements for the automatically calculated money fields.
 * Used by the external-order desk, where the operator agrees a shipping fee or
 * a discount with the customer by phone that the rate table cannot know about.
 */
export interface OrderPricingOverrides {
  /** Replaces the calculated shipping cost (EGP). */
  shippingCost?: number
  /** Replaces the total order discount (EGP); recorded as a manual line. */
  discountAmount?: number
}

export interface PlaceOrderFromCartInput {
  userId: string
  cartId: string
  shippingAddressId?: string
  billingAddressId?: string
  paymentMethod: string
  couponCode?: string
  notes?: string
  isGift?: boolean
  giftMessage?: string
  orderSource?: OrderSource
  paymentOverrides?: PaymentOverrides
  pricingOverrides?: OrderPricingOverrides
  locale?: string
  skipCoupons?: boolean
  /**
   * Send the customer their order-confirmation email once the order commits.
   * Defaults to true; set false for flows that intentionally stay silent.
   */
  sendConfirmationEmail?: boolean
  /**
   * Storefront orders: the store's checkout methods (Store settings › Payment
   * methods). A method the store has not enabled, or COD above its max order,
   * is refused. Omit for the marketplace and admin flows.
   */
  storefrontPayments?: StorefrontCheckoutPayments
}

export interface PlaceOrderInventoryItem {
  snapshot: {
    id: string
    sellerId: string
    categoryId: string | null
    brandId: string | null
  }
  stockBoundaryCrossed: boolean
}

export type PlaceOrderFromCartResult =
  | {
      success: true
      data: {
        order: typeof orders.$inferSelect
        orderItems: (typeof orderItems.$inferSelect)[]
        inventoryItems: PlaceOrderInventoryItem[]
      }
    }
  | {
      success: false
      error: string
      minimumPurchase?: number
    }

/**
 * Forces the order's discount total to an admin-entered amount.
 *
 * Coupon-attributed lines are kept untouched so coupon_usage and affiliate
 * auditing still reconcile; the difference is carried by a single manual line,
 * which keeps the stored invariant "sum of discounts.amount == discount_amount"
 * true no matter what the operator typed.
 */
function applyDiscountOverride(
  lines: OrderDiscountLine[],
  totalDiscount: number,
  override: number | undefined,
  maxDiscount: number,
): { lines: OrderDiscountLine[]; totalDiscount: number } {
  if (override == null) return { lines, totalDiscount }

  const couponLines = lines.filter(
    (line) => line.type === 'coupon' || line.type === 'free_shipping_coupon',
  )
  const couponTotal = couponLines.reduce(
    (sum, line) => sum + Number(line.amount),
    0,
  )

  const target = Math.min(
    Math.max(override, couponTotal),
    Math.max(maxDiscount, couponTotal),
  )
  const manualAmount = target - couponTotal

  const nextLines = [...couponLines]
  if (manualAmount > 0.004) {
    nextLines.push({
      type: 'manual_adjustment',
      label: 'Discount (set by admin)',
      amount: formatDecimal(manualAmount),
    })
  }

  return {
    lines: nextLines,
    totalDiscount: nextLines.reduce((sum, line) => sum + Number(line.amount), 0),
  }
}

export async function placeOrderFromCart(
  input: PlaceOrderFromCartInput,
): Promise<PlaceOrderFromCartResult> {
  const {
    userId,
    cartId,
    shippingAddressId,
    billingAddressId,
    paymentMethod,
    couponCode,
    notes,
    isGift,
    giftMessage,
    orderSource = 'website',
    paymentOverrides,
    pricingOverrides,
    locale = 'en',
    skipCoupons = false,
    sendConfirmationEmail = true,
    storefrontPayments,
  } = input

  const cart = await db.query.carts.findFirst({
    where: and(eq(carts.id, cartId), eq(carts.userId, userId)),
    with: {
      cartItems: {
        where: eq(cartItems.savedForLater, false),
        with: {
          product: {
            with: {
              productTranslations: true,
              seller: {
                columns: {
                  freeDelivery: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!cart || cart.cartItems.length === 0) {
    return { success: false, error: 'Cart is empty' }
  }

  const isDigitalOnlyCart = cart.cartItems.every(
    (item) => item.product.productType === 'digital',
  )

  let shippingAddress:
    | { id: string; state: string; city: string; country: string; addressLine1: string; phone: string }
    | undefined
  if (!isDigitalOnlyCart) {
    if (!shippingAddressId) {
      return { success: false, error: 'Shipping address is required' }
    }

    shippingAddress = await db.query.userAddresses.findFirst({
      where: and(
        eq(userAddresses.id, shippingAddressId),
        eq(userAddresses.userId, userId),
      ),
    })

    if (!shippingAddress) {
      return { success: false, error: 'Shipping address not found' }
    }
  }

  for (const item of cart.cartItems) {
    if (item.product.status !== 'active') {
      return {
        success: false,
        error: `Product is no longer available: ${item.product.sku ?? item.productId}`,
      }
    }
  }

  // Store websites: the seller blocked this shipping phone on the store
  // (ROADMAP.md F-02). Refused before any stock, coupon or money is touched.
  if (
    orderSource === 'storefront' &&
    cart.storeId &&
    shippingAddress &&
    (await isStorePhoneBlocked(cart.storeId, shippingAddress.phone))
  ) {
    return { success: false, error: 'storeCustomerBlocked' }
  }

  let subtotal = 0
  const tax = 0
  const hasDigitalItems = cart.cartItems.some(
    (item) => item.product.productType === 'digital',
  )

  const shippingItems = cart.cartItems.map((item) => ({
    quantity: item.quantity,
    price: item.price,
    sellerId: item.sellerId,
    product: {
      productType: item.product.productType,
      freeDelivery: item.product.freeDelivery,
      dimensions: item.product.dimensions,
      sellerId: item.product.sellerId,
      seller: item.product.seller,
    },
  }))

  const cartSubtotal = cart.cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  )

  // Address is required at place-order time; if state is missing, bill fallback rate
  const destinationState = shippingAddress?.state?.trim()
    ? shippingAddress.state
    : '__missing_state__'

  const tallabyShippingCost = calculateLocationShippingCost({
    items: shippingItems,
    destinationState,
    cartSubtotal,
  })!

  // Store websites: when the seller delivers, the store's own zones price the
  // order (store shipping spec §6.5); places no zone covers fall back to the
  // rate above or are refused. The marketplace, admin-set shipping and
  // digital-only carts keep the rate table untouched.
  let storeQuote: StorefrontShipping | null = null
  if (
    orderSource === 'storefront' &&
    cart.storeId &&
    pricingOverrides?.shippingCost == null &&
    !isDigitalOnlyCart &&
    shippingAddress
  ) {
    const context = await getStorefrontShippingContext(cart.storeId)
    if (context && context.settings.method === 'own') {
      storeQuote = resolveStorefrontShipping({
        settings: context.settings,
        zones: context.zones,
        address: shippingAddress,
        items: shippingItems,
        subtotal: cartSubtotal,
        tallabyRate: () => tallabyShippingCost,
      })
      if (storeQuote.kind === 'not_covered') {
        return { success: false, error: 'storeShippingNotCovered' }
      }
      if (storeQuote.kind === 'outside_egypt') {
        return { success: false, error: 'storeShippingOutsideEgypt' }
      }
    }
  }
  const zoneQuote = storeQuote?.kind === 'zone' ? storeQuote : null

  const calculatedShippingCost = zoneQuote
    ? zoneQuote.shippingCost
    : tallabyShippingCost

  // An admin-entered shipping fee replaces the rate table outright, and every
  // downstream waiver (threshold / seller free delivery) is then measured
  // against it so a discount can never exceed what is actually billed.
  const shippingCost =
    pricingOverrides?.shippingCost != null
      ? Math.max(0, pricingOverrides.shippingCost)
      : calculatedShippingCost

  // sellers.free_delivery waives that seller's shipment entirely — recorded as
  // a discount so the order still stores the real shipping cost.
  // On a zone-priced order the zone is one shipment, so the seller flag waives
  // all of it or nothing.
  const sellerFreeDeliveryDiscount = Math.min(
    shippingCost,
    zoneQuote
      ? zoneSellerFreeDeliveryDiscount(zoneQuote, shippingItems)
      : calculateSellerFreeDeliveryDiscount({
          items: shippingItems,
          destinationState,
          cartSubtotal,
        }),
  )

  const orderItemsData = cart.cartItems.map((item) => {
    const itemSubtotal = Number(item.price) * item.quantity
    subtotal += itemSubtotal

    const variant = item.variant as {
      id?: string
      sku?: string
      option1?: string | null
      option2?: string | null
      option3?: string | null
      title?: string | null
    } | null
    const variantTitle = formatVariantTitleFromCart(variant)

    const productName = pickProductTitle(
      item.product.productTranslations,
      locale,
      item.product.sku,
      item.productId,
    )

    return {
      productId: item.productId,
      variantId: variant?.id || null,
      sellerId: item.sellerId,
      sku: variant?.sku || item.product.sku,
      productName,
      variantName: variantTitle,
      quantity: item.quantity,
      price: item.price,
      subtotal: formatDecimal(itemSubtotal),
      tax: formatDecimal(tax),
      shippingCost: '0.00',
      total: formatDecimal(itemSubtotal),
      discountAmount: '0.00',
      // Set per seller once coupons are applied (platform fee, see below).
      commissionRate: 0,
      commissionAmount: '0.00',
      sellerEarning: formatDecimal(itemSubtotal),
      metadata: null as { platformFee: PlatformFeeSnapshot } | null,
      currency: cart.currency || 'EGP',
      condition: item.product.condition,
      fulfillmentType: item.product.fulfillmentType,
      status: 'pending' as const,
    }
  })

  let merchandiseDiscount = 0
  // Tallaby's cart threshold is a platform promotion; a zone has its own free-over.
  const thresholdShippingDiscount = zoneQuote
    ? 0
    : getThresholdShippingDiscount(subtotal, shippingCost)
  let shippingDiscount = Math.max(
    thresholdShippingDiscount,
    sellerFreeDeliveryDiscount,
  )
  let appliedCoupon: typeof coupons.$inferSelect | null = null

  if (!skipCoupons && couponCode) {
    const normalizedCode = couponCode.trim().toUpperCase()
    const coupon = await db.query.coupons.findFirst({
      where: and(
        sql`UPPER(${coupons.code}) = ${normalizedCode}`,
        eq(coupons.isActive, true),
        sql`(${coupons.startsAt} IS NULL OR ${coupons.startsAt} <= NOW())`,
        sql`(${coupons.expiresAt} IS NULL OR ${coupons.expiresAt} >= NOW())`,
      ),
    })

    if (coupon) {
      if (
        coupon.usageLimit &&
        coupon.usageCount &&
        coupon.usageCount >= coupon.usageLimit
      ) {
        return { success: false, error: 'Coupon usage limit reached' }
      }

      const channel = orderSource === 'storefront' ? 'storefront' : 'marketplace'
      if (!isCouponAllowedOnChannel(coupon, channel)) {
        return { success: false, error: 'couponNotForThisStore' }
      }

      // Seller coupons only ever touch that seller's products (and, when
      // set, the products the seller picked); platform coupons cover all.
      const eligibleItems = orderItemsData.filter((item) =>
        isLineEligibleForCoupon(coupon, item),
      )
      const eligibleSubtotal = eligibleItems.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0,
      )

      if (coupon.sellerId && eligibleSubtotal <= 0) {
        return { success: false, error: 'couponNoEligibleItems' }
      }

      if (
        coupon.minimumPurchase &&
        eligibleSubtotal < Number(coupon.minimumPurchase)
      ) {
        return {
          success: false,
          error: 'minPurchase',
          minimumPurchase: Number(coupon.minimumPurchase),
        }
      }

      if (coupon.discountType === 'percentage') {
        merchandiseDiscount =
          eligibleSubtotal * (Number(coupon.discountValue) / 100)
      } else if (coupon.discountType === 'fixed_amount') {
        merchandiseDiscount = Number(coupon.discountValue)
      } else if (
        coupon.discountType === 'free_shipping' &&
        !coupon.sellerId
      ) {
        shippingDiscount = Math.max(shippingDiscount, shippingCost)
      }

      if (
        coupon.maximumDiscount &&
        merchandiseDiscount > Number(coupon.maximumDiscount)
      ) {
        merchandiseDiscount = Number(coupon.maximumDiscount)
      }

      if (merchandiseDiscount > eligibleSubtotal) {
        merchandiseDiscount = eligibleSubtotal
      }

      // A seller-funded discount comes out of that seller's lines: each
      // eligible line carries its share, and the platform fee is taken on
      // what the customer actually pays for it.
      if (coupon.sellerId && merchandiseDiscount > 0) {
        const shares = allocateDiscountAcrossLines(
          merchandiseDiscount,
          eligibleItems.map((item) => Number(item.subtotal)),
        )
        eligibleItems.forEach((item, index) => {
          const lineDiscount = shares[index] ?? 0
          const net = Number(item.subtotal) - lineDiscount
          item.discountAmount = formatDecimal(lineDiscount)
          item.total = formatDecimal(net)
        })
      }

      appliedCoupon = coupon
    }
  }

  // Platform fee (PLAN.md §13.2, D1/D2/D22): a flat EGP 5 per seller, capped at
  // its line totals after its own coupon, 0 during the seller's 7-day trial
  // or when exempt. Snapshotted per line; never recomputed.
  const feeSellerIds = [...new Set(orderItemsData.map((item) => item.sellerId))]
  const feeProfiles = await db
    .select({
      id: sellers.id,
      feePlan: sellers.feePlan,
      feeTrialStartedAt: sellers.feeTrialStartedAt,
      feeTrialEndsAt: sellers.feeTrialEndsAt,
      isCommissionExempt: sellers.isCommissionExempt,
    })
    .from(sellers)
    .where(inArray(sellers.id, feeSellerIds))
  const lineFees = computeOrderLineFees(
    orderItemsData,
    new Map(feeProfiles.map((profile) => [profile.id, profile])),
  )
  orderItemsData.forEach((item, index) => {
    const fee = lineFees[index]!
    item.commissionRate = fee.commissionRate
    item.commissionAmount = fee.commissionAmount
    item.sellerEarning = fee.sellerEarning
    item.metadata = { platformFee: fee.platformFee }
  })

  const {
    lines: builtDiscountLines,
    totalDiscount: builtTotalDiscount,
    couponContribution,
  } = buildOrderDiscountLines({
    merchandiseDiscount,
    shippingDiscount,
    thresholdShippingDiscount,
    sellerFreeDeliveryDiscount,
    coupon: appliedCoupon
      ? {
          id: appliedCoupon.id,
          code: appliedCoupon.code,
          name: appliedCoupon.name,
          discountType: appliedCoupon.discountType,
          discountValue: appliedCoupon.discountValue,
        }
      : null,
  })

  const { lines: discountLines, totalDiscount } = applyDiscountOverride(
    builtDiscountLines,
    builtTotalDiscount,
    pricingOverrides?.discountAmount,
    subtotal + shippingCost,
  )

  const totalAmount = subtotal + shippingCost + tax - totalDiscount
  const orderNumber = generateOrderNumber()

  const stockLineMeta = new Map<string, (typeof cart.cartItems)[number]>()
  const stockLines: StockLine[] = cart.cartItems.map((item) => {
    const variant = item.variant as { id?: string } | null
    const line: StockLine = variant?.id
      ? { kind: 'variant', id: variant.id, quantity: item.quantity }
      : { kind: 'product', id: item.productId, quantity: item.quantity }
    stockLineMeta.set(`${line.kind}:${line.id}`, item)
    return line
  })

  const resolvedPaymentMethod =
    paymentOverrides?.paymentMethod ?? paymentMethod

  // A discount override can be smaller than the waiver the rate rules found,
  // in which case shipping really is billed again — so COD eligibility is
  // judged on the discount that actually made it onto the order.
  const effectiveShippingDiscount =
    pricingOverrides?.discountAmount != null
      ? Math.min(shippingDiscount, totalDiscount)
      : shippingDiscount
  const billedShipping = Math.max(0, shippingCost - effectiveShippingDiscount)

  // The 90 EGP cap is a Tallaby-rider rule; a seller zone decides COD itself.
  if (resolvedPaymentMethod === 'cash_on_delivery') {
    if (zoneQuote) {
      if (!zoneQuote.codEnabled) {
        return { success: false, error: 'storeShippingNoCod' }
      }
    } else if (!isCodEligibleForShipping(billedShipping)) {
      return {
        success: false,
        error:
          'Cash on delivery is not available when shipping cost exceeds 90 EGP',
      }
    }
  }

  // Storefront card payment through the seller's own gateway (ROADMAP.md
  // F-39): the money goes straight to the seller, so the order is
  // seller-collected (fee-only on delivery, PLAN.md §13.4) and keeps which
  // gateway it was placed with.
  const sellerGateway =
    storefrontPayments?.gateway && resolvedPaymentMethod === 'online_payment'
      ? storefrontPayments.gateway
      : null
  // Storefront InstaPay / Vodafone Cash / e& Cash: paid to the seller's own
  // details (owner, 2026-10-31; PLAN.md P3-07 Part B), so seller-collected
  // too, with a snapshot of what the customer was shown.
  const sellerTransfer = sellerTransferFor(storefrontPayments, resolvedPaymentMethod)
  const sellerCollected = Boolean(sellerGateway || sellerTransfer)

  const storeShipping: StoreShippingSnapshot | null =
    storeQuote && (storeQuote.kind === 'zone' || storeQuote.kind === 'tallaby_rates')
      ? {
          method: 'own',
          pricedBy: storeQuote.kind,
          ...(storeQuote.kind === 'zone'
            ? { zoneId: storeQuote.zoneId, zoneName: storeQuote.zoneName }
            : {}),
          place: storeQuote.place,
          billedPiastres: Math.round(billedShipping * 100),
          collector: sellerCollected
            ? 'seller'
            : storeShippingCollector(resolvedPaymentMethod),
        }
      : null
  const baseOrderMetadata: Record<string, unknown> | null =
    storeShipping || sellerCollected
      ? {
          ...(storeShipping && { storeShipping }),
          ...(sellerCollected && { paymentCollector: 'seller' }),
          ...(sellerGateway && {
            paymentGateway: {
              provider: sellerGateway.provider,
              integrationId: sellerGateway.integrationId,
            },
          }),
          ...(sellerTransfer && { sellerPayment: sellerTransfer }),
        }
      : null

  if (
    storefrontPayments &&
    !isStorefrontCheckoutMethodAllowed(
      storefrontPayments,
      resolvedPaymentMethod,
      totalAmount,
    )
  ) {
    return {
      success: false,
      error: 'This payment method is not available in this store',
    }
  }

  const resolvedStatus =
    paymentOverrides?.status ??
    (paymentMethod === 'online_payment' ? 'payment_processing' : 'pending')
  const resolvedPaymentStatus =
    paymentOverrides?.paymentStatus ?? 'pending'

  let newOrder: typeof orders.$inferSelect | undefined
  let createdOrderItems: (typeof orderItems.$inferSelect)[] = []
  let stockResults: Awaited<ReturnType<typeof decrementStock>> = []

  try {
    await db.transaction(async (tx) => {
      stockResults = await decrementStock(tx, stockLines)

      if (appliedCoupon) {
        const claimed = await claimCouponUsage(tx, appliedCoupon.id)
        if (!claimed) {
          throw new CouponClaimFailedError()
        }
      }

      const walletPartialRemainder =
        parseWalletPartialPaymentMethod(resolvedPaymentMethod)

      let insertPaymentMethod = resolvedPaymentMethod
      let insertMetadata: Record<string, unknown> | null = baseOrderMetadata
      let partialWalletAmount: string | null = null
      let upgradeToFullWallet = false
      let walletForPayment: Awaited<
        ReturnType<typeof getOrCreateUserWallet>
      > | null = null

      if (walletPartialRemainder) {
        walletForPayment = await getOrCreateUserWallet(tx, userId)
        if (walletForPayment.status !== 'active') {
          throw new WalletNotActiveError(
            walletForPayment.id,
            walletForPayment.status,
          )
        }

        const available =
          Number(walletForPayment.balance) -
          Number(walletForPayment.reservedBalance)

        if (available <= 0) {
          throw new InsufficientWalletBalanceError(walletForPayment.id)
        }

        if (available >= totalAmount) {
          upgradeToFullWallet = true
          insertPaymentMethod = 'wallet'
        } else {
          partialWalletAmount = formatDecimal(available)
          insertPaymentMethod = walletPartialRemainder
          insertMetadata = {
            ...baseOrderMetadata,
            walletPaidAmount: partialWalletAmount,
            paymentMix: 'wallet_partial',
          }
        }
      }

      ;[newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId,
          cartId,
          subtotal: formatDecimal(subtotal),
          shippingCost: formatDecimal(shippingCost),
          tax: formatDecimal(tax),
          discountAmount: formatDecimal(totalDiscount),
          discounts: discountLines,
          totalAmount: formatDecimal(totalAmount),
          currency: cart.currency || 'EGP',
          status: resolvedStatus,
          paymentStatus: resolvedPaymentStatus,
          paymentMethod: insertPaymentMethod,
          shippingAddressId: shippingAddressId || null,
          billingAddressId: billingAddressId || shippingAddressId || null,
          isGift: isGift || false,
          giftMessage,
          couponCode: skipCoupons ? undefined : couponCode,
          notes,
          hasDigitalItems,
          isDigitalOnly: isDigitalOnlyCart,
          orderSource,
          paidAt: paymentOverrides?.paidAt ?? null,
          metadata: insertMetadata,
        })
        .returning()

      createdOrderItems = await tx
        .insert(orderItems)
        .values(
          orderItemsData.map((item) => ({
            ...item,
            orderId: newOrder!.id,
          })) as (typeof orderItems.$inferInsert)[],
        )
        .returning()

      if (appliedCoupon) {
        await tx.insert(couponUsage).values({
          couponId: appliedCoupon.id,
          userId,
          orderId: newOrder!.id,
          discountAmount: formatDecimal(couponContribution),
        })

        // Affiliate attribution is resolved and snapshotted here, inside the
        // order's own transaction, rather than left to be inferred later from
        // the coupon table — see packages/db/src/affiliates/commission.ts for
        // why the commission is based on the pre-discount `subtotal`.
        const affiliate = await resolveAffiliateForCoupon(tx, appliedCoupon.id, userId)
        if (affiliate) {
          await createPendingAffiliateCommission(tx, {
            affiliate,
            orderId: newOrder!.id,
            orderEligibleAmount: formatDecimal(subtotal),
            shippingAmount: formatDecimal(shippingCost),
          })
        }
      }

      if (resolvedPaymentMethod === 'wallet' || upgradeToFullWallet) {
        const wallet =
          walletForPayment ?? (await getOrCreateUserWallet(tx, userId))
        await postWalletTransaction(tx, {
          walletId: wallet.id,
          userId,
          type: 'order_payment',
          amount: formatDecimal(totalAmount),
          direction: 'debit',
          referenceType: WALLET_REFERENCE_TYPES.order,
          referenceId: newOrder!.id,
          description: `Order ${orderNumber}`,
        })

        const paidNow = new Date().toISOString()
        ;[newOrder] = await tx
          .update(orders)
          .set({
            status: 'confirmed',
            paymentStatus: 'paid',
            paidAt: paidNow,
            updatedAt: paidNow,
            paymentMethod: 'wallet',
            metadata: baseOrderMetadata,
          })
          .where(eq(orders.id, newOrder!.id))
          .returning()

        await tx.insert(payments).values({
          orderId: newOrder!.id,
          amount: formatDecimal(totalAmount),
          method: 'wallet',
          currency: cart.currency || 'EGP',
          status: 'paid',
          capturedAt: paidNow,
        })
      } else if (partialWalletAmount != null && walletForPayment) {
        await postWalletTransaction(tx, {
          walletId: walletForPayment.id,
          userId,
          type: 'order_payment',
          amount: partialWalletAmount,
          direction: 'debit',
          referenceType: WALLET_REFERENCE_TYPES.order,
          referenceId: newOrder!.id,
          description: `Order ${orderNumber} (partial wallet)`,
        })

        const capturedAt = new Date().toISOString()
        await tx.insert(payments).values({
          orderId: newOrder!.id,
          amount: partialWalletAmount,
          method: 'wallet',
          currency: cart.currency || 'EGP',
          status: 'paid',
          capturedAt,
        })
      }

      if (paymentOverrides?.recordPayment) {
        await tx.insert(payments).values({
          orderId: newOrder!.id,
          amount: formatDecimal(totalAmount),
          method: resolvedPaymentMethod,
          currency: cart.currency || 'EGP',
          status: resolvedPaymentStatus,
          capturedAt: paymentOverrides.paidAt ?? new Date().toISOString(),
        })
      }

      await tx
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.cartId, cartId),
            eq(cartItems.savedForLater, false),
          ),
        )

      await tx
        .update(carts)
        .set({
          status: 'completed',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(carts.id, cartId))
    })
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return {
        success: false,
        error: `Insufficient stock for ${err.kind === 'variant' ? 'a selected option' : 'a product'} in your cart`,
      }
    }
    if (err instanceof CouponClaimFailedError) {
      return { success: false, error: 'Coupon usage limit reached' }
    }
    if (err instanceof InsufficientWalletBalanceError) {
      return { success: false, error: 'Insufficient wallet balance' }
    }
    if (err instanceof WalletNotActiveError || err instanceof WalletNotFoundError) {
      return { success: false, error: 'Wallet is not available for payment' }
    }
    throw err
  }

  // Past this point the order is committed. The confirmation email is
  // best-effort: it is never allowed to fail the order, and the backend
  // de-duplicates so a retried checkout cannot send a second email.
  if (sendConfirmationEmail) {
    const emailResult = await sendOrderConfirmationEmail({
      orderId: newOrder!.id,
      locale,
    })
    if (!emailResult.success) {
      console.error(
        'placeOrderFromCart: order confirmation email not sent for',
        newOrder!.orderNumber,
        emailResult.error,
      )
    }
    // Seller "new order" + low-stock mail. Orders awaiting an online payment
    // are skipped by the backend; the payment webhook sends them on confirm.
    await sendOrderEventEmail(newOrder!.id, 'placed')
  }

  const inventoryItems: PlaceOrderInventoryItem[] = stockResults.map((r) => {
    const item = stockLineMeta.get(`${r.kind}:${r.id}`)!
    return {
      snapshot: {
        id: item.productId,
        sellerId: item.sellerId,
        categoryId: item.product.categoryId,
        brandId: item.product.brandId,
      },
      stockBoundaryCrossed: r.stockBoundaryCrossed,
    }
  })

  return {
    success: true,
    data: {
      order: newOrder!,
      orderItems: createdOrderItems,
      inventoryItems,
    },
  }
}

export { InsufficientStockError }
