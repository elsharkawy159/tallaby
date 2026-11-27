import { getTranslations } from "next-intl/server";
import { digitalProductsWithoutFiles } from "@workspace/lib/products/digital-publish/server";

/**
 * The publish gate for digital products (ROADMAP.md F-108b): a digital product
 * with no file can't become `active`. Server-only helper (not a server action):
 * the list switch and bulk publish (`setProductPublished`, `bulkSetPublishedAction`)
 * call it with ids they already checked against the session seller's store.
 */

/** Of `productIds`, the session seller's digital products that have no file yet. One batched query set for any count. */
export function digitalProductsMissingFiles(sellerId: string, productIds: readonly string[]): Promise<Set<string>> {
  return digitalProductsWithoutFiles(sellerId, productIds);
}

/** The translated refusal when this digital product has no file, else null. */
export async function digitalPublishError(sellerId: string, productId: string): Promise<string | null> {
  const missing = await digitalProductsWithoutFiles(sellerId, [productId]);
  if (!missing.has(productId)) return null;
  const t = await getTranslations("toast");
  return t("digitalNeedsFileToPublish");
}
