/**
 * Business rule: the customer discount and the affiliate commission are both
 * 10%, but they are deliberately independent numbers read from different
 * places — the discount comes from the coupon row (coupons.discountValue),
 * the commission rate is snapshotted onto each affiliate_commissions row.
 * They start equal; nothing in the code assumes they must stay that way.
 */
export const AFFILIATE_DISCOUNT_PERCENT = 10;
export const AFFILIATE_COMMISSION_RATE = 0.1;

/** Affiliate coupons never expire in the normal sense — "permanent" per the business rules. Represented as a far-future date since coupons.expiresAt is NOT NULL. */
export function buildAffiliateCouponExpiry(): string {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 25);
  return expiry.toISOString();
}
