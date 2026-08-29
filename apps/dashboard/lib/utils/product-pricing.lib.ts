export interface SellerPricingSettings {
  commissionRate: number
  isCommissionExempt: boolean
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

  let discountedPrice = numericList

  if (discountValue && Number(discountValue) > 0) {
    if (discountType === 'percent') {
      discountedPrice =
        numericList - (numericList * Number(discountValue)) / 100
    } else {
      discountedPrice = numericList - Number(discountValue)
    }

    if (discountedPrice < 0) {
      discountedPrice = 0
    }
  }

  const commissionRate = getEffectiveCommissionRate(settings)

  return parseFloat((discountedPrice * (1 + commissionRate)).toFixed(2))
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
