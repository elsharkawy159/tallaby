'use client'

import { useState, useTransition } from 'react'
import { Link } from '@/i18n/navigation'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Separator } from '@workspace/ui/components/separator'
import { formatPrice, FREE_DELIVERY_MIN_SUBTOTAL } from '@workspace/lib'
import { useLocale, useTranslations } from 'next-intl'
import { Ticket, X, Loader2, LogIn, Truck } from 'lucide-react'
import { applyCouponToCart, removeCouponFromCart } from '@/actions/coupons'
import { toast } from 'sonner'
import { formatVariantTitle } from '@/lib/variant-utils'
import posthog from 'posthog-js'
import { cn } from '@workspace/ui/lib/utils'
import type {
  AppliedCouponInfo,
  OrderSummaryItem,
  OrderSummaryTotals,
} from './order-summary.types'
import type { CheckoutSummary } from '@/lib/coupon-utils'

interface OrderSummaryLineItemsProps {
  items: OrderSummaryItem[]
}

export function OrderSummaryLineItems ({ items }: OrderSummaryLineItemsProps) {
  const locale = useLocale()
  const tCommon = useTranslations('common')

  return (
    <div className='space-y-0 mb-2 md:mb-3'>
      {items.map((item) => {
        const unit = Number(item.price) || 0
        const lineTotal = unit * item.quantity
        const variantTitle = item.variant
          ? formatVariantTitle(item.variant)
          : null

        return (
          <div
            key={item.id}
            className='flex items-start justify-between gap-2 md:gap-4 py-2 md:py-3 border-b border-gray-100 last:border-0'
          >
            <div className='flex-1 min-w-0'>
              <p className='text-xs md:text-sm font-medium text-gray-900 truncate'>
                {item.product.title}
              </p>
              {variantTitle && (
                <p className='text-xs text-muted-foreground mt-0.5'>
                  {variantTitle}
                </p>
              )}
              <p className='text-xs text-muted-foreground mt-0.5'>
                {tCommon('quantity')}: {item.quantity}
                {' × '}
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatPrice(unit, locale),
                  }}
                />
              </p>
            </div>
            <div
              className='text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap'
              dangerouslySetInnerHTML={{
                __html: formatPrice(lineTotal, locale),
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

interface FreeDeliveryProgressProps {
  subtotal: number
}

export function FreeDeliveryProgress ({ subtotal }: FreeDeliveryProgressProps) {
  const locale = useLocale()
  const t = useTranslations('checkout')

  const threshold = FREE_DELIVERY_MIN_SUBTOTAL
  const progress = Math.min(100, Math.max(0, (subtotal / threshold) * 100))
  const isUnlocked = subtotal >= threshold
  const remaining = Math.max(0, threshold - subtotal)
  const remainingLabel = formatPrice(remaining, locale).replace(/<[^>]*>/g, '')

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5 md:px-3.5 md:py-3 transition-colors duration-300',
        isUnlocked
          ? 'border-primary/30 bg-primary/5'
          : 'border-gray-200 bg-gray-50/80',
      )}
    >
      <div className='mb-1.5 flex items-center justify-between gap-2'>
        {isUnlocked ? (
          <p className='free-delivery-celebrate flex items-center gap-1.5 text-xs font-semibold text-primary md:text-sm'>
            <Truck className='h-3.5 w-3.5 shrink-0' aria-hidden />
            {t('freeDeliveryUnlocked')}
          </p>
        ) : (
          <p className='text-[11px] text-muted-foreground md:text-xs'>
            {t('addAmountForFreeDelivery', { amount: remainingLabel })}
          </p>
        )}
      </div>

      <div
        className='relative h-2 w-full overflow-hidden rounded-full bg-gray-200'
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={threshold}
        aria-valuenow={Math.min(subtotal, threshold)}
        aria-label={
          isUnlocked
            ? t('freeDeliveryUnlocked')
            : t('addAmountForFreeDelivery', { amount: remainingLabel })
        }
      >
        <div
          className={cn(
            'h-full rounded-full bg-primary transition-[width] duration-500 ease-out',
            isUnlocked && 'free-delivery-bar-shimmer',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className='mt-1 flex items-center justify-between text-[10px] tabular-nums text-muted-foreground md:text-[11px]'>
        <span>{t('freeDeliveryProgressStart')}</span>
        <span>{t('freeDeliveryProgressEnd')}</span>
      </div>
    </div>
  )
}

interface OrderSummaryCostRowsProps {
  summary: OrderSummaryTotals
  showShipping?: boolean
  isRecalculatingShipping?: boolean
}

export function OrderSummaryCostRows ({
  summary,
  showShipping = false,
  isRecalculatingShipping = false,
}: OrderSummaryCostRowsProps) {
  const locale = useLocale()
  const t = useTranslations('checkout')

  const tax = summary.tax ?? 0
  const discountAmount = summary.discountAmount ?? 0
  const shippingDiscount = summary.shippingDiscount ?? 0

  return (
    <>
      <div className='flex items-center justify-between text-xs md:text-sm'>
        <span className='text-gray-600'>{t('subtotal')}</span>
        <span
          className='font-medium text-gray-900'
          dangerouslySetInnerHTML={{
            __html: formatPrice(summary.subtotal ?? 0, locale),
          }}
        />
      </div>

      {showShipping &&
        ((summary.shippingCost != null && summary.shippingCost > 0) ||
          isRecalculatingShipping) && (
          <div className='flex items-center justify-between text-xs md:text-sm'>
            <span className='text-gray-600'>{t('shipping')}</span>
            {isRecalculatingShipping ? (
              <Loader2 className='h-3 w-3 animate-spin text-gray-500' />
            ) : (
              <span
                className='font-medium text-gray-900'
                dangerouslySetInnerHTML={{
                  __html: formatPrice(summary.shippingCost ?? 0, locale),
                }}
              />
            )}
          </div>
        )}

      {tax > 0 && (
        <div className='flex items-center justify-between text-xs md:text-sm'>
          <span className='text-gray-600'>{t('tax')}</span>
          <span
            className='font-medium text-gray-900'
            dangerouslySetInnerHTML={{
              __html: formatPrice(tax, locale),
            }}
          />
        </div>
      )}

      {discountAmount > 0 && (
        <div className='flex items-center justify-between text-xs md:text-sm'>
          <span className='text-green-600 flex items-center gap-1'>
            <Ticket className='h-3 w-3' />
            {t('discount')}
            {summary.appliedCoupon && (
              <Badge
                variant='secondary'
                className='bg-green-100 text-green-700 font-mono text-[10px] px-1 py-0'
              >
                {summary.appliedCoupon.code}
              </Badge>
            )}
          </span>
          <span
            className='font-medium text-green-600'
            dangerouslySetInnerHTML={{
              __html: `-${formatPrice(discountAmount, locale)}`,
            }}
          />
        </div>
      )}

      {shippingDiscount > 0 && (
        <div className='flex items-center justify-between text-xs md:text-sm'>
          <span className='text-green-600'>{t('freeShipping')}</span>
          <span
            className='font-medium text-green-600'
            dangerouslySetInnerHTML={{
              __html: `-${formatPrice(shippingDiscount, locale)}`,
            }}
          />
        </div>
      )}
    </>
  )
}

interface OrderSummaryTotalRowProps {
  total: number
}

export function OrderSummaryTotalRow ({ total }: OrderSummaryTotalRowProps) {
  const locale = useLocale()
  const t = useTranslations('checkout')

  return (
    <>
      <Separator className='bg-gray-200' />
      <div className='flex items-center justify-between pt-1'>
        <span className='text-sm md:text-base font-bold text-gray-900'>
          {t('total')}
        </span>
        <span
          className='text-base md:text-xl font-bold text-primary'
          dangerouslySetInnerHTML={{
            __html: formatPrice(total, locale),
          }}
        />
      </div>
    </>
  )
}

interface OrderSummaryCouponProps {
  isLoggedIn: boolean
  shippingAddressId?: string
  itemCount: number
  appliedCoupon?: AppliedCouponInfo | null
  onCouponApplied?: (data: {
    coupon: AppliedCouponInfo
    summary: CheckoutSummary
  }) => void
  onCouponRemoved?: (summary: CheckoutSummary) => void
}

export function OrderSummaryCoupon ({
  isLoggedIn,
  shippingAddressId,
  itemCount,
  appliedCoupon,
  onCouponApplied,
  onCouponRemoved,
}: OrderSummaryCouponProps) {
  const t = useTranslations('checkout')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleApplyCoupon = () => {
    if (!code.trim()) return

    setError(null)
    startTransition(async () => {
      const result = await applyCouponToCart({
        code: code.trim(),
        shippingAddressId,
      })

      if (result.success && result.data) {
        posthog.capture('coupon_applied', { item_count: itemCount })
        toast.success(t('couponApplied'))
        setCode('')
        onCouponApplied?.({
          coupon: result.data.summary.appliedCoupon!,
          summary: result.data.summary,
        })
      } else {
        const errorKey =
          'error' in result && result.error ? result.error : 'invalidCoupon'

        if (
          errorKey === 'minPurchase' &&
          'minimumPurchase' in result &&
          result.minimumPurchase
        ) {
          const formattedAmount = formatPrice(result.minimumPurchase, locale)
          const rawText = formattedAmount.replace(/<[^>]*>/g, '')
          setError(t('minPurchaseWithAmount', { amount: rawText }))
        } else {
          setError(t(errorKey))
        }
      }
    })
  }

  const handleRemoveCoupon = () => {
    startTransition(async () => {
      const result = await removeCouponFromCart({ shippingAddressId })

      if (result.success && result.data) {
        posthog.capture('coupon_removed', { item_count: itemCount })
        toast.success(t('couponRemoved'))
        onCouponRemoved?.(result.data.summary)
      } else {
        toast.error(t('failedToRemoveCoupon'))
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApplyCoupon()
    }
  }

  if (!isLoggedIn) {
    return (
      <Button
        asChild
        variant='ghost'
        size='sm'
        className='w-full h-8 text-xs text-muted-foreground hover:text-primary'
      >
        <Link
          href='/auth?redirect=/cart/checkout'
          className='flex items-center justify-center gap-1.5'
        >
          <LogIn className='h-3 w-3' />
          {t('loginToUseCoupon')}
        </Link>
      </Button>
    )
  }

  if (appliedCoupon) {
    return (
      <div className='flex items-center justify-between gap-2 p-2 bg-green-50 rounded-lg'>
        <div className='flex items-center gap-1.5 min-w-0'>
          <Ticket className='h-3 w-3 text-green-600 shrink-0' />
          <Badge
            variant='secondary'
            className='bg-green-100 text-green-700 font-mono text-[10px] px-1.5 py-0'
          >
            {appliedCoupon.code}
          </Badge>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleRemoveCoupon}
          disabled={isPending}
          className='h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50'
          aria-label={tCommon('remove')}
        >
          {isPending ? (
            <Loader2 className='h-3 w-3 animate-spin' />
          ) : (
            <X className='h-3 w-3' />
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-1.5'>
      <div className='flex gap-1.5'>
        <Input
          type='text'
          placeholder={t('enterCouponCode')}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          className='h-8 text-xs font-mono uppercase flex-1'
          aria-label={t('couponCode')}
        />
        <Button
          type='button'
          size='sm'
          onClick={handleApplyCoupon}
          disabled={isPending || !code.trim()}
          className='h-8 px-3 text-xs'
        >
          {isPending ? (
            <Loader2 className='h-3 w-3 animate-spin' />
          ) : (
            tCommon('apply')
          )}
        </Button>
      </div>
      {error && <p className='text-[10px] text-red-500'>{error}</p>}
    </div>
  )
}
