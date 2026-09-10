/** Every customer-facing price is quantised to this step (EGP). */
export const PRICE_ROUNDING_STEP = 5

/**
 * Rounds a price **up** to the next multiple of {@link PRICE_ROUNDING_STEP}.
 *
 * 199 → 200, 248 → 250, 344 → 345, 200 → 200.
 *
 * Rounding is always upwards so a rounded price never falls below the margin
 * the seller priced the product at. Values that are already on the step are
 * returned unchanged; the `toFixed` guard keeps binary float noise
 * (e.g. `150 / 5 === 30.000000000000004`) from pushing them to the next step.
 */
export function roundPriceUpToNearestFive (price: number): number {
  if (!Number.isFinite(price) || price <= 0) {
    return 0
  }

  const steps = Math.ceil(Number((price / PRICE_ROUNDING_STEP).toFixed(6)))
  return steps * PRICE_ROUNDING_STEP
}

/** Nullable passthrough of {@link roundPriceUpToNearestFive}. */
export function roundNullablePriceUpToNearestFive (
  price: number | null | undefined,
): number | null {
  if (price == null || !Number.isFinite(price)) {
    return null
  }

  return roundPriceUpToNearestFive(price)
}
