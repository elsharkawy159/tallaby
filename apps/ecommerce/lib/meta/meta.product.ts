/**
 * Canonical Meta Catalog / Pixel content ID = products.id (UUID).
 * Keep this helper so all tracking surfaces share one mapping.
 */
export function toMetaContentId (productId: string): string {
  return productId
}

export function toMetaContentIds (productIds: string[]): string[] {
  return Array.from(new Set(productIds.filter(Boolean).map(toMetaContentId)))
}
