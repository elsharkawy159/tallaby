import { formatCurrency } from '../utils/formatPrice'
import type { PlanPricing } from './types'

/**
 * Display label for a plan's price, or null when the admin hasn't configured
 * one. Callers render null as "Pricing will be discussed with our team" -
 * never "0 EGP" or "Free". An explicit amount (even 0) is shown as entered,
 * because only an admin can put it there.
 */
export function getPlanPricingLabel(
  pricing: PlanPricing | null | undefined,
  locale: string,
): string | null {
  if (!pricing) return null

  const isArabic = locale.startsWith('ar')
  const note = (isArabic ? pricing.noteAr : pricing.noteEn)?.trim() || null
  const hasAmount = typeof pricing.amount === 'number' && Number.isFinite(pricing.amount)

  if (!hasAmount) return note

  const amount = formatCurrency(pricing.amount as number, locale)
  const withUnit = pricing.unit ? `${amount} / ${pricing.unit}` : amount
  return note ? `${withUnit} · ${note}` : withUnit
}
