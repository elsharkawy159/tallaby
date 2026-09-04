import type { ReactNode } from 'react'
import type { CheckoutSummary } from '@/lib/coupon-utils'

export interface OrderSummaryItem {
  id: string
  quantity: number
  price: string | number
  variant?: {
    option1?: string | null
    option2?: string | null
    option3?: string | null
    title?: string | null
  } | null
  product: {
    id: string
    title: string
    productType?: string | null
    freeDelivery?: boolean | null
  }
}

export interface OrderSummaryTotals {
  subtotal: number
  tax?: number
  /** Null when destination address is not selected yet */
  shippingCost?: number | null
  total: number
  discountAmount?: number
  shippingDiscount?: number
  totalAfterDiscount?: number
  appliedCoupon?: {
    code: string
    name: string
    discountType: string
  } | null
}

export interface AppliedCouponInfo {
  code: string
  name: string
  discountType: string
}

export interface OrderSummaryProps {
  items: OrderSummaryItem[]
  summary: OrderSummaryTotals
  children?: ReactNode
  /** When true, show shipping / free-delivery rows (checkout). */
  showShipping?: boolean
  isRecalculatingShipping?: boolean
  /** Enable coupon apply/remove UI (checkout). */
  enableCoupons?: boolean
  isLoggedIn?: boolean
  shippingAddressId?: string
  appliedCoupon?: AppliedCouponInfo | null
  onCouponApplied?: (data: {
    coupon: AppliedCouponInfo
    summary: CheckoutSummary
  }) => void
  onCouponRemoved?: (summary: CheckoutSummary) => void
}
