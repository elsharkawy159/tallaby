/**
 * Business rule: the customer discount and the affiliate commission are both
 * 10%, but they are deliberately independent numbers read from different
 * places — the discount comes from the coupon row (coupons.discountValue),
 * the commission rate is snapshotted onto each affiliate_commissions row.
 * They start equal; nothing in the code assumes they must stay that way.
 */
export const AFFILIATE_DISCOUNT_PERCENT = 10;
export const AFFILIATE_COMMISSION_RATE = 0.1;

/**
 * Days from delivery within which a return can be requested — also the hold
 * before affiliate commission is credited to the wallet. Single source of
 * truth for both storefront copy and commission release timing.
 */
export const RETURN_WINDOW_DAYS = 7;

/** Affiliate coupons never expire in the normal sense — "permanent" per the business rules. Represented as a far-future date since coupons.expiresAt is NOT NULL. */
export function buildAffiliateCouponExpiry(): string {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 25);
  return expiry.toISOString();
}

/** Instant when a commission delivered at `from` becomes eligible for wallet credit. */
export function computeAffiliateCommissionEligibleAt(
  from: Date = new Date()
): string {
  const eligible = new Date(from);
  eligible.setDate(eligible.getDate() + RETURN_WINDOW_DAYS);
  return eligible.toISOString();
}
