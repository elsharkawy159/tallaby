export type ProductStatus = "draft" | "pending" | "active" | "rejected";

export function hasProductImage(images: unknown): boolean {
  return Array.isArray(images) && images.length > 0;
}

/**
 * Status a seller write leaves a product in. Products go live without admin
 * review (owner, 2026-10-19): a new or live product with an image is active.
 * An admin takedown ("rejected") sticks, a draft stays hidden until the seller
 * publishes it, and a restricted seller can never make a product live.
 * Legacy "pending" rows (approval era) behave like new products.
 */
export function nextProductStatus(input: {
  previous: ProductStatus | null;
  hasImage: boolean;
  canPublish: boolean;
}): ProductStatus {
  if (input.previous === "rejected") return "rejected";
  if (input.previous === "draft") return "draft";
  return input.hasImage && input.canPublish ? "active" : "draft";
}
