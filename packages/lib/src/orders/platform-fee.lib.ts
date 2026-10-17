/**
 * Tallaby platform fee (PLAN.md §13, P6-01).
 *
 * fee = max(EGP 5, 2% of the seller's eligible subtotal), per seller per
 * order, shipping excluded, capped at the eligible subtotal. Pure and
 * integer-based: every amount here is in piastres (1 EGP = 100).
 */

import { allocateDiscountAcrossLines } from './coupon-scope.lib'

export const STANDARD_FEE_RATE_BPS = 200
export const STANDARD_FEE_MIN_PIASTRES = 500
export const FEE_TRIAL_DAYS = 30

/** One plan today (D1); per-service fees are designed later. */
export const FEE_PLANS = {
  standard_2pct_min5: { rateBps: STANDARD_FEE_RATE_BPS, minPiastres: STANDARD_FEE_MIN_PIASTRES },
} as const satisfies Record<string, { rateBps: number; minPiastres: number }>

export type FeePlanId = keyof typeof FEE_PLANS

export const STANDARD_FEE_PLAN: FeePlanId = 'standard_2pct_min5'

/** Unknown or missing fee plans fall back to the standard plan. */
export function resolveFeePlan (plan: string | null | undefined): FeePlanId {
  const id = plan?.trim().toLowerCase()
  return id && Object.hasOwn(FEE_PLANS, id) ? (id as FeePlanId) : STANDARD_FEE_PLAN
}

/** EGP decimal (number or numeric string) → integer piastres. */
export function toPiastres (value: number | string | null | undefined): number {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0
}

/** Fee for one seller's part of an order, before trial or exemption. */
export function computePlatformFeePiastres (
  eligibleSubtotalPiastres: number,
  plan: FeePlanId = STANDARD_FEE_PLAN,
): number {
  if (!(eligibleSubtotalPiastres > 0)) return 0
  const { rateBps, minPiastres } = FEE_PLANS[plan]
  // Math.round is half-up for positive amounts.
  const pct = Math.round((eligibleSubtotalPiastres * rateBps) / 10_000)
  return Math.min(eligibleSubtotalPiastres, Math.max(minPiastres, pct))
}

/**
 * D2: the fee base is what the seller actually sold for, i.e. the line totals
 * after the seller's own coupon. Tallaby-funded discounts never reduce line
 * totals, so they don't reduce the base either. Shipping is not in lines.
 */
export function eligibleSubtotalForSeller (lines: ReadonlyArray<{ total: number | string }>): number {
  return lines.reduce((sum, line) => sum + Math.max(0, toPiastres(line.total)), 0)
}

/** Splits the fee across lines by their totals; the parts add up exactly. */
export function allocateFeeAcrossLines (feePiastres: number, linePiastres: number[]): number[] {
  return allocateDiscountAcrossLines(feePiastres / 100, linePiastres.map((value) => value / 100))
    .map(toPiastres)
}

export type SellerFeeProfile = {
  feePlan?: string | null
  feeTrialStartedAt?: string | Date | null
  feeTrialEndsAt?: string | Date | null
  isCommissionExempt?: boolean | null
}

function toTime (value: string | Date | null | undefined): number | null {
  if (value == null) return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

/** D4: the trial covers orders created inside [started, ends). */
export function isTrialActive (seller: SellerFeeProfile, at: Date = new Date()): boolean {
  const start = toTime(seller.feeTrialStartedAt)
  const end = toTime(seller.feeTrialEndsAt)
  if (start == null || end == null) return false
  const now = at.getTime()
  return now >= start && now < end
}

export type PlatformFeeSnapshot = {
  plan: FeePlanId
  rateBps: number
  minPiastres: number
  eligiblePiastres: number
  feePiastres: number
  trial: boolean
  exempt: boolean
  computedAt: string
}

export type SellerPlatformFee = {
  feePiastres: number
  /** Same order as the input lines. */
  lineFeesPiastres: number[]
  /** Effective rate as a fraction, for `order_items.commission_rate` (display only). */
  effectiveRate: number
  snapshot: PlatformFeeSnapshot
}

/** The fee for one seller's lines of one order, with its audit snapshot. */
export function computeSellerPlatformFee (
  seller: SellerFeeProfile,
  lines: ReadonlyArray<{ total: number | string }>,
  at: Date = new Date(),
): SellerPlatformFee {
  const linePiastres = lines.map((line) => Math.max(0, toPiastres(line.total)))
  const eligiblePiastres = linePiastres.reduce((sum, value) => sum + value, 0)
  const plan = resolveFeePlan(seller.feePlan)
  const exempt = seller.isCommissionExempt === true
  const trial = isTrialActive(seller, at)
  const feePiastres = exempt || trial ? 0 : computePlatformFeePiastres(eligiblePiastres, plan)

  return {
    feePiastres,
    lineFeesPiastres: allocateFeeAcrossLines(feePiastres, linePiastres),
    effectiveRate:
      eligiblePiastres > 0 ? Math.round((feePiastres / eligiblePiastres) * 10_000) / 10_000 : 0,
    snapshot: {
      plan,
      rateBps: FEE_PLANS[plan].rateBps,
      minPiastres: FEE_PLANS[plan].minPiastres,
      eligiblePiastres,
      feePiastres,
      trial,
      exempt,
      computedAt: at.toISOString(),
    },
  }
}
