/**
 * A product price as it is stored and shown: exactly what the seller entered,
 * kept to the piastre (2 decimals). Prices are no longer rounded to a 5 EGP
 * step (owner, 2026-10-26).
 *
 * 199 → 199, 199.999 → 200, 0.1 + 0.2 → 0.3. Not a positive finite number → 0.
 */
export function normalizePrice (price: number): number {
  if (!Number.isFinite(price) || price <= 0) {
    return 0
  }

  return Math.round(price * 100) / 100
}

/** Nullable passthrough of {@link normalizePrice}. */
export function normalizeNullablePrice (
  price: number | null | undefined,
): number | null {
  if (price == null || !Number.isFinite(price)) {
    return null
  }

  return normalizePrice(price)
}
