import { cacheProfiles, createCachedQuery, sellerTags, storeTags } from "@workspace/cache";
import { getPublishedStoreSite } from "@workspace/lib/store-sites/server";

/**
 * The store's published builder site, or null (PLAN.md P5-01): never drafts.
 * Cached per seller + store; publish and unpublish invalidate the tag, so a
 * change shows on the storefront at once.
 */
export const getCachedPublishedSite = createCachedQuery({
  name: "storefront:published-site:v1",
  ttl: cacheProfiles.seller,
  tags: (sellerId: string, storeId: string, subdomain: string) => [
    storeTags.site(sellerId, storeId),
    sellerTags.subdomain(subdomain),
  ],
  query: (_sellerId: string, storeId: string, _subdomain: string) => getPublishedStoreSite(storeId),
});
