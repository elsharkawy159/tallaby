"use server";

import {
  getProductIdBySlug,
  getProductSlugForLocaleStrict,
  type ProductLocale,
} from "@/lib/product-translations";
import { getRequestStoreSubdomain, getStorefrontBySubdomain } from "@/lib/storefront.server";
import { isSwitchOn } from "@/lib/platform-switches.server";

/**
 * Resolves the equivalent product slug in another locale, for the language
 * switcher on a product detail page (product slugs differ per locale, so a
 * plain locale-prefix swap doesn't work there). Returns null when the
 * product has no real translation in the target locale — callers should
 * fall back to a locale-appropriate listing page in that case.
 *
 * On a store host the slug is looked up in that store (its seller before the
 * catalog split), and the store comes from the request host, never from the client.
 */
export async function resolveProductSlugForLocale(
  slug: string,
  targetLocale: ProductLocale
): Promise<string | null> {
  // The slug belongs to the page being switched away from — the other locale.
  const currentLocale: ProductLocale = targetLocale === "en" ? "ar" : "en";
  const subdomain = await getRequestStoreSubdomain();
  const store = subdomain ? await getStorefrontBySubdomain(subdomain) : null;
  if (subdomain && !store) return null;
  const scope = store
    ? { sellerId: store.id, storeId: store.storeId, catalogSplit: await isSwitchOn("stores_catalog_split") }
    : undefined;

  const productId = await getProductIdBySlug(slug, currentLocale, scope);
  if (!productId) return null;

  const targetSlug = await getProductSlugForLocaleStrict(productId, targetLocale);
  if (!targetSlug) return null;

  // Slugs aren't unique: if another product owns targetSlug in that locale,
  // the link would open that product instead — fall back to the listing.
  const owner = await getProductIdBySlug(targetSlug, targetLocale, scope);
  return owner === productId ? targetSlug : null;
}
