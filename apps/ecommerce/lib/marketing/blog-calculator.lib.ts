/**
 * The price calculator in the blog's pricing article. Works in EGP, the
 * currency sellers price in; the Free plan fee is $0.03 per order, shown at the
 * rough rate of $1 = EGP 50 used across the marketing site.
 */
export const FREE_PLAN_FEE_EGP = 1.5;

const clamp = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

/**
 * Cost plus margin plus the fee, rounded up to the next price ending in 9
 * (437 → 439, 440 → 449). With no costs entered there is no price to suggest.
 */
export function suggestedProductPrice(input: { unitCost: number; packaging: number; shipping: number; marginPct: number }) {
  const cost = clamp(input.unitCost) + clamp(input.packaging) + clamp(input.shipping);
  if (cost === 0) return { price: 0, cost: 0, fee: 0, profit: 0 };
  const beforeFee = cost * (1 + clamp(input.marginPct) / 100);
  const price = Math.ceil((beforeFee + FREE_PLAN_FEE_EGP) / 10) * 10 - 1;
  return { price, cost, fee: FREE_PLAN_FEE_EGP, profit: price - cost - FREE_PLAN_FEE_EGP };
}
