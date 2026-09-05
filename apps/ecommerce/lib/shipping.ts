import {
  calculateLocationShippingCost,
  cartHasFreeDeliveryOffer,
  cartHasPhysicalItems,
  cartQualifiesForProductFreeDelivery,
  cartQualifiesForThresholdFreeShipping,
  FREE_DELIVERY_MIN_SUBTOTAL,
  getThresholdShippingDiscount,
  resolveCartSubtotal,
} from '@workspace/lib/shipping'

export {
  cartHasFreeDeliveryOffer,
  cartHasPhysicalItems,
  cartQualifiesForProductFreeDelivery,
  cartQualifiesForThresholdFreeShipping,
  FREE_DELIVERY_MIN_SUBTOTAL,
  getThresholdShippingDiscount,
}

export function getFlatShippingCost (): number {
  return Number(process.env.NEXT_PUBLIC_SHIPPING_COST) || 50
}

export interface CalculateOrderShippingOptions {
  destinationState?: string | null
  cartSubtotal?: number
}

export interface OrderShippingCartItem {
  quantity: number
  price?: string | number | null
  sellerId?: string | null
  product?: {
    productType?: string | null
    freeDelivery?: boolean | null
    dimensions?: unknown
    sellerId?: string | null
    seller?: {
      freeDelivery?: boolean | null
    } | null
  } | null
}

export function calculateOrderShippingCost (
  items: OrderShippingCartItem[],
  options: CalculateOrderShippingOptions = {},
): number | null {
  const envFallback = Number(process.env.NEXT_PUBLIC_SHIPPING_FALLBACK_BASE)
  const fallbackBaseRate = Number.isFinite(envFallback) ? envFallback : undefined
  const cartSubtotal = resolveCartSubtotal(items, options.cartSubtotal)

  return calculateLocationShippingCost({
    items,
    destinationState: options.destinationState,
    cartSubtotal,
    ...(fallbackBaseRate !== undefined ? { fallbackBaseRate } : {}),
  })
}
