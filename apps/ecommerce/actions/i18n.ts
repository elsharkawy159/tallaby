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
  // The slug belongs to the page being switched away from — the other locale.
  const currentLocale: ProductLocale = targetLocale === "en" ? "ar" : "en";
  const productId = await getProductIdBySlug(slug, currentLocale);
  if (!productId) return null;

  const targetSlug = await getProductSlugForLocaleStrict(productId, targetLocale);
  if (!targetSlug) return null;

  // Slugs aren't unique: if another product owns targetSlug in that locale,
  // the link would open that product instead — fall back to the listing.
  const owner = await getProductIdBySlug(targetSlug, targetLocale);
  return owner === productId ? targetSlug : null;
}
