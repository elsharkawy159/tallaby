'use client'

import { useTranslations } from 'next-intl'
import { cartQualifiesForProductFreeDelivery } from '@/lib/shipping'
import {
  OrderSummaryCoupon,
  OrderSummaryCostRows,
  OrderSummaryLineItems,
  OrderSummaryTotalRow,
} from './order-summary.chunks'
import type { OrderSummaryProps } from './order-summary.types'

export type { OrderSummaryProps, OrderSummaryItem, OrderSummaryTotals } from './order-summary.types'

export function OrderSummary ({
  items,
  summary,
  children,
  showShipping = false,
  isRecalculatingShipping = false,
  enableCoupons = false,
  isLoggedIn = false,
  shippingAddressId,
  appliedCoupon,
  onCouponApplied,
  onCouponRemoved,
}: OrderSummaryProps) {
  const t = useTranslations('checkout')

  const qualifiesForProductFreeDelivery =
    showShipping && cartQualifiesForProductFreeDelivery(items)
  const showProductFreeDeliveryMessage =
    showShipping &&
    summary.shippingCost === 0 &&
    (summary.shippingDiscount ?? 0) === 0 &&
    qualifiesForProductFreeDelivery

  const displayTotal = summary.totalAfterDiscount ?? summary.total ?? 0
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className='bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm overflow-hidden'>
      <div className='bg-gradient-to-r from-gray-50 to-gray-100 px-4 md:px-6 py-3 md:py-5 border-b border-gray-200'>
        <h2 className='text-sm md:text-xl font-bold text-gray-900'>
          {t('orderSummary')}
        </h2>
      </div>

      <div className='p-3 md:p-5 pt-2 md:pt-3'>
        <OrderSummaryLineItems items={items} />

        <div className='space-y-2 md:space-y-3 pt-3 md:pt-4 border-t-2 border-gray-200'>
          <OrderSummaryCostRows
            summary={summary}
            showShipping={showShipping}
            isRecalculatingShipping={isRecalculatingShipping}
            showProductFreeDeliveryMessage={showProductFreeDeliveryMessage}
          />

          {enableCoupons && onCouponApplied && (
            <div className='pt-2'>
              <OrderSummaryCoupon
                isLoggedIn={isLoggedIn}
                shippingAddressId={shippingAddressId}
                itemCount={itemCount}
                appliedCoupon={appliedCoupon}
                onCouponApplied={onCouponApplied}
                onCouponRemoved={onCouponRemoved}
              />
            </div>
          )}

          <OrderSummaryTotalRow total={displayTotal} />
        </div>
      </div>

      {children && (
        <div className='px-4 md:px-6 pb-4 md:pb-6 space-y-3 md:space-y-4'>
          {children}
        </div>
      )}
    </div>
  )
}
