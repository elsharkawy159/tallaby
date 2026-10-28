/**
 * A seller coupon shown as a pop-up on the seller's store website (0114).
 *
 * The seller picks when it opens (`trigger`) and how long a visitor has to
 * use the code once it appeared (`durationMinutes`). The visitor's deadline
 * is kept in their browser and drawn as a countdown on the product page; it
 * never runs past the coupon's own end date. The code itself stays valid
 * until that end date (checkout does not know when a visitor saw it).
 */

export const COUPON_POPUP_TRIGGERS = ['enter', 'exit', 'random'] as const

export type CouponPopupTrigger = (typeof COUPON_POPUP_TRIGGERS)[number]

/** Longest window a seller can give: 30 days, in minutes (the DB check). */
export const COUPON_POPUP_MAX_MINUTES = 30 * 24 * 60

export function isCouponPopupTrigger(value: unknown): value is CouponPopupTrigger {
  return COUPON_POPUP_TRIGGERS.includes(value as CouponPopupTrigger)
}

/** What a store page needs to open the pop-up (no limits, no usage). */
export type StoreCouponOffer = {
  couponId: string
  code: string
  discountType: 'percentage' | 'fixed_amount'
  discountValue: number
  trigger: CouponPopupTrigger
  durationMinutes: number
  /** The coupon's own end (ISO). */
  endsAt: string
  /** Products it covers; null for every product of the seller. */
  productIds: string[] | null
}

/** A pop-up coupon row with what decides, per request, whether it is live. */
export type StoreCouponOfferCandidate = StoreCouponOffer & {
  startsAt: string
  usageLimit: number | null
  usageCount: number | null
}

/**
 * The offer a store page opens: the first candidate (newest change first)
 * that has started, not ended and has uses left. Null when none is live.
 */
export function pickStoreCouponOffer(
  candidates: readonly StoreCouponOfferCandidate[],
  now = Date.now(),
): StoreCouponOffer | null {
  const live = candidates.find(
    (c) =>
      Date.parse(c.startsAt) <= now &&
      Date.parse(c.endsAt) > now &&
      (c.usageLimit == null || (c.usageCount ?? 0) < c.usageLimit),
  )
  if (!live) return null
  const { startsAt: _s, usageLimit: _l, usageCount: _c, ...offer } = live
  return offer
}

/** When the visitor's window closes: the pop-up time plus the duration, capped at the coupon's end. */
export function offerDeadline(
  offer: Pick<StoreCouponOffer, 'durationMinutes' | 'endsAt'>,
  shownAt: number,
): number {
  const end = Date.parse(offer.endsAt)
  const deadline = shownAt + offer.durationMinutes * 60_000
  return Number.isFinite(end) ? Math.min(deadline, end) : deadline
}

export type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Whole days, hours, minutes and seconds left (all 0 once it passed). */
export function countdownParts(msLeft: number): CountdownParts {
  const total = Math.max(0, Math.floor(msLeft / 1000))
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

/** Whether the countdown belongs on this product's page. */
export function offerCoversProduct(
  offer: Pick<StoreCouponOffer, 'productIds'>,
  productId: string,
): boolean {
  return !offer.productIds || offer.productIds.includes(productId)
}

/**
 * The pop-up time stored in the visitor's browser for this coupon, or null
 * when the value is missing, malformed or in the future (a changed clock).
 */
export function readShownAt(raw: string | null, now: number): number | null {
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 && value <= now + 60_000 ? value : null
}
