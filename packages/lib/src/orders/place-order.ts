import {
  db,
  orders,
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
import { calculateLocationShippingCost, getThresholdShippingDiscount } from '../shipping/shipping.lib'
import {
  formatDecimal,
  formatVariantTitleFromCart,
  generateOrderNumber,
  pickProductTitle,
} from './place-order.lib'
import { sendOrderConfirmationEmail } from './notify'
import { isCodEligibleForShipping } from './payment.lib'

/** Internal control-flow signal: coupon lost a concurrent usage-limit race. */
class CouponClaimFailedError extends Error {}

export type OrderSource = 'website' | 'external'

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
  locale?: string
  skipCoupons?: boolean
  /**
   * Send the customer their order-confirmation email once the order commits.
   * Defaults to true; set false for flows that intentionally stay silent.
   */
  sendConfirmationEmail?: boolean
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
    locale = 'en',
    skipCoupons = false,
    sendConfirmationEmail = true,
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

  let shippingAddress: { id: string; state: string } | undefined
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

  const computedShippingCost = calculateLocationShippingCost({
    items: shippingItems,
    destinationState: shippingAddress?.state,
    cartSubtotal,
  })

  // Address is required at place-order time; if state is missing, bill fallback rate
  const shippingCost =
    computedShippingCost ??
    calculateLocationShippingCost({
      items: shippingItems,
      destinationState: '__missing_state__',
      cartSubtotal,
    })!

  const orderItemsData = cart.cartItems.map((item) => {
    const itemSubtotal = Number(item.price) * item.quantity
    subtotal += itemSubtotal

    const itemCommission = itemSubtotal * 0.1
    const itemSellerEarning = itemSubtotal * 0.9

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
      commissionRate: 0.1,
      commissionAmount: formatDecimal(itemCommission),
      sellerEarning: formatDecimal(itemSellerEarning),
      currency: cart.currency || 'EGP',
      condition: item.product.condition,
      fulfillmentType: item.product.fulfillmentType,
      status: 'pending' as const,
    }
  })

  let discountAmount = 0
  let shippingDiscount = getThresholdShippingDiscount(subtotal, shippingCost)
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

      if (
        coupon.minimumPurchase &&
        subtotal < Number(coupon.minimumPurchase)
      ) {
        return {
          success: false,
          error: 'minPurchase',
          minimumPurchase: Number(coupon.minimumPurchase),
        }
      }

      if (coupon.discountType === 'percentage') {
        discountAmount = subtotal * (Number(coupon.discountValue) / 100)
      } else if (coupon.discountType === 'fixed_amount') {
        discountAmount = Number(coupon.discountValue)
      } else if (coupon.discountType === 'free_shipping') {
        shippingDiscount = Math.max(shippingDiscount, shippingCost)
      }

      if (
        coupon.maximumDiscount &&
        discountAmount > Number(coupon.maximumDiscount)
      ) {
        discountAmount = Number(coupon.maximumDiscount)
      }

      if (discountAmount > subtotal) {
        discountAmount = subtotal
      }

      appliedCoupon = coupon
    }
  }

  const totalDiscount = discountAmount + shippingDiscount
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

  const billedShipping = Math.max(0, shippingCost - shippingDiscount)

  if (
    resolvedPaymentMethod === 'cash_on_delivery' &&
    !isCodEligibleForShipping(billedShipping)
  ) {
    return {
      success: false,
      error:
        'Cash on delivery is not available when shipping cost exceeds 90 EGP',
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
          totalAmount: formatDecimal(totalAmount),
          currency: cart.currency || 'EGP',
          status: resolvedStatus,
          paymentStatus: resolvedPaymentStatus,
          paymentMethod: resolvedPaymentMethod,
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
          discountAmount: formatDecimal(totalDiscount),
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

      if (resolvedPaymentMethod === 'wallet') {
        const wallet = await getOrCreateUserWallet(tx, userId)
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
