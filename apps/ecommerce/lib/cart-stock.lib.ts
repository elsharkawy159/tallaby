/**
 * Can this cart line hold this many? The same rule the order uses: a line with a
 * variant is limited by that variant's stock, any other by the product's, and a
 * product that doesn't track stock (F-51) has no limit. A variant that's gone can't
 * be ordered, so it never has enough.
 */
export function cartLineHasStock(input: {
  quantity: number;
  trackStock: boolean | null | undefined;
  productQuantity: unknown;
  hasVariant: boolean;
  variantStock: unknown;
}): boolean {
  if (input.quantity <= 0) return true;
  if (input.trackStock === false) return true;
  const available = input.hasVariant ? input.variantStock : input.productQuantity;
  return Number(available ?? 0) >= input.quantity;
}
