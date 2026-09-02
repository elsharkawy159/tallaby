"use server";

import {
  getProductIdBySlug,
  getProductSlugForLocaleStrict,
  type ProductLocale,
} from "@/lib/product-translations";

/**
 * Resolves the equivalent product slug in another locale, for the language
 * switcher on a product detail page (product slugs differ per locale, so a
 * plain locale-prefix swap doesn't work there). Returns null when the
 * product has no real translation in the target locale — callers should
 * fall back to a locale-appropriate listing page in that case.
 */
export async function resolveProductSlugForLocale(
  slug: string,
  targetLocale: ProductLocale
): Promise<string | null> {
  const productId = await getProductIdBySlug(slug);
  if (!productId) return null;

  return getProductSlugForLocaleStrict(productId, targetLocale);
}
