/**
 * Tallaby Pay fee math and the piastre ⇄ numeric boundary (ROADMAP.md F-100a,
 * docs/superpowers/specs/2026-11-18-tallaby-pay-design.md §4.4).
 *
 * Integers only (CLAUDE.md rule 7): every amount is EGP piastres. A decimal
 * string appears only where SQL needs a numeric(10,2). Pure: safe anywhere.
 */

/** The highest fee the database accepts (billing_settings CHECK 0–2000 bps). */
export const TALLABY_PAY_MAX_FEE_BPS = 2_000;

/** numeric(10,2) holds at most 99,999,999.99. */
const MAX_ABS_PIASTRES = 99_999_999_99;

/**
 * Splits a paid amount into Tallaby's fee and the seller's net. The fee is
 * rounded half up; the net is always `paid − fee`, so the two add up exactly.
 */
export function splitTallabyPay(paidPiastres: number, feeBps: number): { feePiastres: number; netPiastres: number } {
  if (!Number.isSafeInteger(paidPiastres) || paidPiastres < 0) {
    throw new RangeError(`paidPiastres must be a non-negative integer, got ${paidPiastres}`);
  }
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > TALLABY_PAY_MAX_FEE_BPS) {
    throw new RangeError(`feeBps must be an integer 0–${TALLABY_PAY_MAX_FEE_BPS}, got ${feeBps}`);
  }
  const feePiastres = Math.floor((paidPiastres * feeBps + 5_000) / 10_000);
  return { feePiastres, netPiastres: paidPiastres - feePiastres };
}

/** Integer piastres → a signed 2 dp string for a numeric(10,2) column. */
export function piastresToAmount(piastres: number): string {
  if (!Number.isSafeInteger(piastres) || Math.abs(piastres) > MAX_ABS_PIASTRES) {
    throw new RangeError(`piastres must be an integer within numeric(10,2), got ${piastres}`);
  }
  const sign = piastres < 0 ? "-" : "";
  const abs = Math.abs(piastres);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const AMOUNT_RE = /^(-?)(\d{1,8})(?:\.(\d{1,2}))?$/;

/** A numeric(10,2) value as Postgres returns it → integer piastres, with no floats. */
export function amountToPiastres(amount: string): number {
  const match = AMOUNT_RE.exec(amount.trim());
  if (!match) throw new RangeError(`not a 2 dp amount: "${amount}"`);
  const [, sign, whole, frac = ""] = match;
  const piastres = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return sign === "-" ? -piastres : piastres;
}
