import { cacheProfiles, createCachedQuery, storeTags } from "@workspace/cache";
import {
  getPublicCmsCollection,
  getPublicCmsItem,
  listPublicBlogTags,
  listPublicCmsItems,
  resolvePublicContent,
} from "@workspace/lib/cms/server";

/**
 * Public blog posts and CMS items of a store host (PLAN.md P4-16, P4-11).
 * Only published items whose date is due ever reach these functions (the lib
 * filters in SQL), so drafts and scheduled posts are never cached. Keys and
 * tags carry the seller id and the store id; saving, publishing or deleting
 * in the dashboard purges `storeTags.cms` for that store only. A scheduled
 * post appears when its date passes and the listing TTL (15 min) expires.
 */

export const BLOG_PAGE_SIZE = 9;

export const getCachedBlogPage = createCachedQuery({
  name: "storefront:blog-page:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string, _page: number, _tag: string | null) => [storeTags.cms(sellerId, storeId)],
  query: (_sellerId: string, storeId: string, page: number, tag: string | null) =>
    listPublicCmsItems(storeId, "blog", { limit: BLOG_PAGE_SIZE, offset: (page - 1) * BLOG_PAGE_SIZE, tag }),
});

export const getCachedBlogTags = createCachedQuery({
  name: "storefront:blog-tags:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string) => [storeTags.cms(sellerId, storeId)],
  query: (_sellerId: string, storeId: string) => listPublicBlogTags(storeId),
});

export const getCachedCmsItem = createCachedQuery({
  name: "storefront:cms-item:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string, _collection: string, _slug: string) => [storeTags.cms(sellerId, storeId)],
  query: (_sellerId: string, storeId: string, collection: string, slug: string) => getPublicCmsItem(storeId, collection, slug),
});

export const getCachedCmsCollection = createCachedQuery({
  name: "storefront:cms-collection:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string, _collection: string) => [storeTags.cms(sellerId, storeId)],
  query: (_sellerId: string, storeId: string, collection: string) => getPublicCmsCollection(storeId, collection),
});

export const getCachedSectionContent = createCachedQuery({
  name: "storefront:cms-sections:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string, _queries: Record<string, { collection: string; limit: number; slug?: string | null }>) => [storeTags.cms(sellerId, storeId)],
  query: (_sellerId: string, storeId: string, queries: Record<string, { collection: string; limit: number; slug?: string | null }>) =>
    resolvePublicContent(storeId, queries),
});
