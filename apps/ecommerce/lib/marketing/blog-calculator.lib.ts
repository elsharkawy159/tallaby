/**
 * The price calculator in the blog's pricing article. Works in EGP, the
 * currency sellers price in. The Free plan fee comes in as EGP at the live rate
 * (the page passes it); without it, the rough rate of EGP 50 per dollar.
 */
export const FREE_PLAN_FEE_EGP = 1.5;

const clamp = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

/**
 * Cost plus margin plus the fee, rounded up to the next price ending in 9
 * (437 → 439, 440 → 449). With no costs entered there is no price to suggest.
 */
export function suggestedProductPrice(input: { unitCost: number; packaging: number; shipping: number; marginPct: number; feeEgp?: number }) {
  const fee = input.feeEgp ?? FREE_PLAN_FEE_EGP;
  const cost = clamp(input.unitCost) + clamp(input.packaging) + clamp(input.shipping);
  if (cost === 0) return { price: 0, cost: 0, fee: 0, profit: 0 };
  const beforeFee = cost * (1 + clamp(input.marginPct) / 100);
  const price = Math.ceil((beforeFee + fee) / 10) * 10 - 1;
  return { price, cost, fee, profit: price - cost - fee };
}
