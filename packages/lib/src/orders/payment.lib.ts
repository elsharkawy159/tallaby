/** Maximum shipping cost (EGP) eligible for Cash on Delivery. */
export const COD_MAX_SHIPPING_COST = 90

export function isCodEligibleForShipping(
  shippingCost: number | null | undefined,
): boolean {
  // Unknown shipping (no address yet) should not disable COD
  if (shippingCost == null) {
    return true
  }

  return shippingCost <= COD_MAX_SHIPPING_COST
}

/** Wallet payment must cover the full order total — no partial payments. */
export function isWalletEligibleForTotal(
  availableBalance: number | null | undefined,
  orderTotal: number,
): boolean {
  if (availableBalance == null) {
    return false
  }

  return availableBalance >= orderTotal
}
