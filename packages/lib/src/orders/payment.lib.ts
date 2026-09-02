/** Maximum shipping cost (EGP) eligible for Cash on Delivery. */
export const COD_MAX_SHIPPING_COST = 90

export function isCodEligibleForShipping(shippingCost: number): boolean {
  return shippingCost <= COD_MAX_SHIPPING_COST
}
