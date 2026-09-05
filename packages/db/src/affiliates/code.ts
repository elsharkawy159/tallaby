/**
 * Affiliate promo code generation.
 *
 * Format: {NORMALIZED_FIRST_NAME}{rate}{3-char random suffix}, e.g. OMAR10EQH.
 * Recognizable (the affiliate's own name), encodes the discount rate, and the
 * random suffix makes collisions negligible even before the database's own
 * unique constraint on coupons.code is checked.
 */

/** Matches AFFILIATE_DISCOUNT_PERCENT below — kept as a literal in the code shape so a generated code always reads e.g. "...10...". */
const RATE_DIGITS = "10";

const SUFFIX_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SUFFIX_LENGTH = 3;

function normalizeFirstName(fullName: string | null | undefined): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  const normalized = first.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return normalized.slice(0, 10) || "AFF";
}

function randomSuffix(length: number = SUFFIX_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += SUFFIX_ALPHABET[bytes[i]! % SUFFIX_ALPHABET.length];
  }
  return suffix;
}

/** One candidate code. Callers retry with a fresh candidate on a collision. */
export function buildAffiliateCodeCandidate(
  fullName: string | null | undefined
): string {
  return `${normalizeFirstName(fullName)}${RATE_DIGITS}${randomSuffix()}`;
}
