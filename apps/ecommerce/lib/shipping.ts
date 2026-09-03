import {
  calculateLocationShippingCost,
  cartQualifiesForProductFreeDelivery,
} from '@workspace/lib/shipping'

export { cartQualifiesForProductFreeDelivery }

export function getFlatShippingCost(): number {
  return Number(process.env.NEXT_PUBLIC_SHIPPING_COST) || 50
}

export interface CalculateOrderShippingOptions {
  destinationState?: string | null
}

export interface OrderShippingCartItem {
  quantity: number
  product?: {
    productType?: string | null
    freeDelivery?: boolean | null
    dimensions?: unknown
  } | null
}

export function calculateOrderShippingCost(
  items: OrderShippingCartItem[],
  options: CalculateOrderShippingOptions = {},
): number | null {
  const envFallback = Number(process.env.NEXT_PUBLIC_SHIPPING_FALLBACK_BASE)
  const fallbackBaseRate = Number.isFinite(envFallback) ? envFallback : undefined

  return calculateLocationShippingCost({
    items,
    destinationState: options.destinationState,
    ...(fallbackBaseRate !== undefined ? { fallbackBaseRate } : {}),
  })
}
