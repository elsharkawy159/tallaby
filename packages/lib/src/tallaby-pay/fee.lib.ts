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

/**
 * Who pays the Tallaby Pay fee (ROADMAP.md F-100j, owner 2026-11-22). A
 * per-store choice kept on the store's `tallaby_pay` integration row:
 * `seller` (the default and the behaviour before F-100j: the fee comes out of
 * the paid amount) or `customer` (checkout adds the fee on top, so the seller
 * gets 100% of the order and Tallaby keeps exactly the fee).
 */
export const TALLABY_PAY_FEE_PAYERS = ["seller", "customer"] as const;
export type TallabyPayFeePayer = (typeof TALLABY_PAY_FEE_PAYERS)[number];

export function isTallabyPayFeePayer(value: unknown): value is TallabyPayFeePayer {
  return value === "seller" || value === "customer";
}

/**
 * The customer-paid surcharge: `fee = round_half_up(base × bps / 10000)`, the
 * same rounding as splitTallabyPay, added on top of `base` (what the order
 * costs before the fee). The shopper pays `charged = base + fee`.
 */
export function customerTallabyPayFee(
  basePiastres: number,
  feeBps: number,
): { feePiastres: number; chargedPiastres: number } {
  const { feePiastres } = splitTallabyPay(basePiastres, feeBps);
  return { feePiastres, chargedPiastres: basePiastres + feePiastres };
}

/**
 * How a confirmed Tallaby Pay payment is split into Tallaby's fee and the
 * seller's net (F-100j). Seller-pays: `splitTallabyPay(paid, bps)`, exactly
 * as before. Customer-pays: the fee is the surcharge recorded on the order at
 * placement (`customerFeePiastres`), never recomputed, and the net is the
 * rest, i.e. the order's base amount.
 */
export function tallabyPaySaleSplit(
  paidPiastres: number,
  snapshot: { feeBps: number; feePayer?: TallabyPayFeePayer; customerFeePiastres?: number },
): { feePiastres: number; netPiastres: number } {
  if (snapshot.feePayer !== "customer") return splitTallabyPay(paidPiastres, snapshot.feeBps);
  const fee = snapshot.customerFeePiastres;
  if (!Number.isSafeInteger(paidPiastres) || paidPiastres < 0) {
    throw new RangeError(`paidPiastres must be a non-negative integer, got ${paidPiastres}`);
  }
  if (fee === undefined || !Number.isSafeInteger(fee) || fee < 0 || fee > paidPiastres) {
    throw new RangeError(`customerFeePiastres must be an integer 0–${paidPiastres}, got ${fee}`);
  }
  return { feePiastres: fee, netPiastres: paidPiastres - fee };
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
