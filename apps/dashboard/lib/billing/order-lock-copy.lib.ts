import { usdCentsToApproxEgp } from "@workspace/lib/billing";

/**
 * A USD amount in dollars for the top-up banner: "$5" in Arabic (kept LTR inside
 * an isolate), "$5" in English; cents only when the amount isn't whole ("5.50$").
 * The banner names the top-up minimum in dollars (owner, 2026-11-18); every other
 * seller-facing price stays in EGP (owner, 2026-11-09).
 */
export function formatUsdShort(usdCents: number, locale: string): string {
  const cents = Math.abs(Math.round(usdCents));
  const whole = cents % 100 === 0;
  const number = (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
  return locale.startsWith("ar") ? `⁦${number}$⁩` : `$${number}`;
}

/**
 * The per-order fee in EGP at `rate`, as a bare number with two decimals
 * ("1.62"), for "3 cents = 1.62 EGP". Null with no rate, so the message drops it.
 */
export function formatOrderFeeEgp(
  usdCents: number,
  rate: number | null | undefined,
): string | null {
  if (!rate || !(rate > 0)) return null;
  return usdCentsToApproxEgp(usdCents, rate).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
