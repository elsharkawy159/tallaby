/**
 * The EGP 100 welcome gift (0119, docs/superpowers/specs/2026-10-29-welcome-gift-design.md).
 * Pure maths in integer piastres; the server side is welcome-gift.server.ts.
 *
 * The gift is spent first, on platform charges only: fees and service charges
 * posted after the grant (net of fee reversals and ad refunds), plus any debt
 * the gift cleared when it was granted. Withdrawals, payouts, admin
 * adjustments, sales and top-ups never spend or refill it. On expiry the
 * unspent part is taken back, never more than the positive balance.
 */

/** EGP 100. */
export const WELCOME_GIFT_PIASTRES = 10_000;
/** The gift is valid this many days from the grant. */
export const WELCOME_GIFT_DAYS = 30;
/** The bell reminds the seller this many days before the gift expires. */
export const WELCOME_GIFT_REMINDER_DAYS = 3;
/** The popup image the owner made (apps/dashboard/public/100EGP gift.png), URL-encoded. */
export const WELCOME_GIFT_IMAGE = "/100EGP%20gift.png";

/** Decimal string ("-12.50") to integer piastres. */
export function giftToPiastres(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = Math.round(Number(value) * 100);
  return Number.isFinite(n) ? n : 0;
}

/** Integer piastres to a 2 dp decimal string ("100.00"). */
export function giftFromPiastres(piastres: number): string {
  return (piastres / 100).toFixed(2);
}

/** The debt the gift clears at grant time: max(0, -balance before), at most the gift. */
export function giftDebtClearedPiastres(balanceBeforePiastres: number, giftPiastres = WELCOME_GIFT_PIASTRES): number {
  return Math.min(giftPiastres, Math.max(0, -balanceBeforePiastres));
}

/**
 * What is left of the gift. `chargesNetPiastres` is the signed sum of the
 * spending entries after the grant (fees and service charges are negative,
 * fee reversals and ad refunds positive), as read from the ledger.
 */
export function giftRemainingPiastres(input: {
  giftPiastres: number;
  debtClearedPiastres: number;
  chargesNetPiastres: number;
}): number {
  const spent = Math.max(0, -input.chargesNetPiastres);
  return Math.max(0, input.giftPiastres - input.debtClearedPiastres - spent);
}

/** What expiry takes back: the unspent gift, never pushing the wallet below zero. */
export function giftExpiryDebitPiastres(input: { remainingPiastres: number; balancePiastres: number }): number {
  return Math.max(0, Math.min(input.remainingPiastres, input.balancePiastres));
}
