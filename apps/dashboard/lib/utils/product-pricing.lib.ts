import { roundPriceUpToNearestFive } from '@workspace/lib'

export { roundPriceUpToNearestFive }

export interface SellerPricingSettings {
  commissionRate: number
  isCommissionExempt: boolean
  sellerFreeDelivery?: boolean
}

export const DEFAULT_COMMISSION_RATE = 10

export function getEffectiveCommissionRate(
  settings: SellerPricingSettings
): number {
  if (settings.isCommissionExempt) {
    return 0
  }

  const rate = settings.commissionRate ?? DEFAULT_COMMISSION_RATE
  return Math.max(0, rate) / 100
}

export function calculateProductFinalPrice(
  listPrice: number,
  discountValue: number | string | undefined,
  discountType: 'amount' | 'percent' | undefined,
  settings: SellerPricingSettings
): number {
  const numericList = typeof listPrice === 'number' ? listPrice : 0

  if (numericList <= 0) {
    return 0
  }

  const discountedPrice = applyDiscount(
    numericList,
    discountValue,
    discountType
  )
  const commissionRate = getEffectiveCommissionRate(settings)
  const withCommission = discountedPrice * (1 + commissionRate)

  return roundPriceUpToNearestFive(withCommission)
}

function applyDiscount(
  listPrice: number,
  discountValue: number | string | undefined,
  discountType: 'amount' | 'percent' | undefined
): number {
  let discountedPrice = listPrice

  if (discountValue && Number(discountValue) > 0) {
    if (discountType === 'percent') {
      discountedPrice =
        listPrice - (listPrice * Number(discountValue)) / 100
    } else {
      discountedPrice = listPrice - Number(discountValue)
    }

    if (discountedPrice < 0) {
      discountedPrice = 0
    }
  }

  return discountedPrice
}

export function calculateDiscountFromFinalPrice(
  listPrice: number,
  finalPrice: number | string | undefined,
  discountType: 'amount' | 'percent' | undefined,
  settings: SellerPricingSettings
): number {
  const numericList = typeof listPrice === 'number' ? listPrice : 0
  const numericFinal =
    typeof finalPrice === 'number'
      ? finalPrice
      : Number(finalPrice) || 0

  if (numericList <= 0 || numericFinal <= 0) {
    return 0
  }

  const commissionRate = getEffectiveCommissionRate(settings)
  const discountedPrice = numericFinal / (1 + commissionRate)
  const discountAmount = numericList - discountedPrice

  if (discountAmount <= 0) {
    return 0
  }

  if (discountType === 'percent') {
    return parseFloat(((discountAmount / numericList) * 100).toFixed(2))
  }

  return parseFloat(discountAmount.toFixed(2))
}

export function getFinalPriceHelpText(
  settings: SellerPricingSettings
): string {
  if (settings.isCommissionExempt) {
    return 'Product display price (no platform commission applied)'
  }

  const rate = settings.commissionRate ?? DEFAULT_COMMISSION_RATE
  return `Product display price (List Price + ${rate}% commission)`
}
