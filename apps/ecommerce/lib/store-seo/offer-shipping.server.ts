import { createCachedQuery, sellerTags } from "@workspace/cache";
import { getStorefrontShippingContext } from "@workspace/lib/stores/server";

/**
 * The store's shipping settings and enabled zones for the product JSON-LD.
 * Checkout reads them fresh (`getStorefrontShippingContext`); this display copy
 * is cached per seller and store (rule 8) for ten minutes, so a zone edit
 * reaches Google's view of the page within that. `storeId` is the store the
 * request host resolved to (`resolveStorefront`), never a client value, and
 * `sellerId` is its owner.
 */
export const storeShippingForJsonLd = createCachedQuery({
  name: "storefront:jsonld-shipping:v1",
  ttl: 600,
  tags: (sellerId: string, _storeId: string) => [sellerTags.storefront(sellerId)],
  query: async (_sellerId: string, storeId: string) => getStorefrontShippingContext(storeId),
});
