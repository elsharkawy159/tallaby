import { roundPriceUpToNearestFive } from '@workspace/lib'

export { roundPriceUpToNearestFive }

export interface SellerPricingSettings {
  commissionRate: number
  isCommissionExempt: boolean
  sellerFreeDelivery?: boolean
}

export const DEFAULT_COMMISSION_RATE = 5

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

  return roundPriceUpToNearestFive(discountedPrice)
}

/** What the seller is paid for one unit sold at `sellingPrice`, after the platform commission. */
export function calculateSellerEarning(
  sellingPrice: number | string | undefined,
  settings: SellerPricingSettings
): number {
  const numericPrice = Number(sellingPrice) || 0

  if (numericPrice <= 0) {
    return 0
  }

  const commissionRate = getEffectiveCommissionRate(settings)
  return parseFloat((numericPrice * (1 - commissionRate)).toFixed(2))
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
  _settings: SellerPricingSettings
): number {
  const numericList = typeof listPrice === 'number' ? listPrice : 0
  const numericFinal =
    typeof finalPrice === 'number'
      ? finalPrice
      : Number(finalPrice) || 0

  if (numericList <= 0 || numericFinal <= 0) {
    return 0
  }

  const discountAmount = numericList - numericFinal

  if (discountAmount <= 0) {
    return 0
  }

  if (discountType === 'percent') {
    return parseFloat(((discountAmount / numericList) * 100).toFixed(2))
  }

  return parseFloat(discountAmount.toFixed(2))
}

