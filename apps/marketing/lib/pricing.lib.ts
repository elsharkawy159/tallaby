/**
 * Marketing-site fee maths. The site advertises a flat fee per successful
 * order (owner decision for the marketing copy, 2026-10-18). This module only
 * powers the calculators on the page; what sellers are actually charged is
 * computed in `@workspace/lib/orders/platform-fee`.
 */

export const FLAT_FEE_EGP = 5;

export function orderFee(orderValue: number): number {
  return orderValue > 0 ? FLAT_FEE_EGP : 0;
}

/** The fee as a percentage of the order, for the "that's just x%" line. */
export function feeShareOfOrder(orderValue: number): string {
  if (orderValue <= 0) return "0";
  return ((FLAT_FEE_EGP / orderValue) * 100).toFixed(orderValue >= 1000 ? 2 : 1);
}

export function monthlyEstimate(orders: number, averageOrderValue: number) {
  const fee = orders * orderFee(averageOrderValue);
  const sales = orders * averageOrderValue;
  return { perOrder: orderFee(averageOrderValue), fee, sales, keep: sales - fee };
}

/**
 * Suggested retail price from the blog calculator: cost plus margin plus the
 * fee, rounded up to the next price ending in 9 (437 → 439, 440 → 449).
 */
export function suggestedPrice(input: { unitCost: number; packaging: number; shipping: number; marginPct: number }) {
  const clamp = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);
  const cost = clamp(input.unitCost) + clamp(input.packaging) + clamp(input.shipping);
  const beforeFee = cost * (1 + clamp(input.marginPct) / 100);
  let price = Math.ceil((beforeFee + FLAT_FEE_EGP) / 10) * 10 - 1;
  if (price < 1) price = 0;
  const fee = orderFee(price);
  return { price, cost, fee, profit: price - cost - fee };
}

export const formatNumber = (n: number) => Math.round(n).toLocaleString("en-US");
