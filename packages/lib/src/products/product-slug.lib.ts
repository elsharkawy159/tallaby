/**
 * The address a product gets when `desired` is already taken: `desired` itself
 * when free, else the first free `desired-2`, `desired-3`, and so on. A number
 * already in the slug is part of the name ("iphone-15" becomes "iphone-15-2",
 * never "iphone-16").
 */
export function pickFreeSlug(desired: string, taken: Iterable<string | null | undefined>): string {
  const used = new Set(taken);
  if (!used.has(desired)) return desired;
  for (let n = 2; ; n++) {
    const candidate = `${desired}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

/** A product with no usable name (an Arabic title with no Latin letters) still needs an address. */
export function fallbackProductSlug(productId: string): string {
  return `product-${productId.replace(/-/g, "").slice(0, 8)}`;
}
