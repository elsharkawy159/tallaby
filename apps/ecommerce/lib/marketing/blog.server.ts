import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { cacheProfiles, createCachedQuery, storeTags } from "@workspace/cache";
import { getPublicCmsItem, listPublicCmsItems } from "@workspace/lib/cms/server";
import { cmsImageUrl } from "@/lib/store-cms/cms.lib";
import { getStorefrontBySubdomain } from "@/lib/storefront.server";
import { BLOG_POSTS, type MarketingPost } from "./blog.data";
import { isPostForLocale, toMarketingPost } from "./blog.lib";

/**
 * The tallaby.com blog (owner, 2026-10-19). Posts are written in the dashboard
 * blog editor (P4-16) of the platform's own store, named by
 * MARKETING_BLOG_STORE_SUBDOMAIN. Only published, due posts reach these
 * functions, and saving in the dashboard purges `storeTags.cms` for that store,
 * so the blog updates without a deploy. While the variable is unset, the store
 * cannot be found, or it has no posts for the locale, the blog shows the static
 * posts in `blog.data.ts` (copy in messages).
 */

const LIST_LIMIT = 50;

/** Listing entries without bodies: a cache entry must stay well under the 2 MB limit. */
const getCachedPlatformPosts = createCachedQuery({
  name: "marketing:blog-posts:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string) => [storeTags.cms(sellerId, storeId)],
  query: async (_sellerId: string, storeId: string): Promise<MarketingPost[]> => {
    const { items } = await listPublicCmsItems(storeId, "blog", { limit: LIST_LIMIT });
    return items.map((item) => ({ ...toMarketingPost(item, cmsImageUrl), html: undefined }));
  },
});

const getCachedPlatformPost = createCachedQuery({
  name: "marketing:blog-post:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string, _slug: string) => [storeTags.cms(sellerId, storeId)],
  query: async (_sellerId: string, storeId: string, slug: string): Promise<MarketingPost | null> => {
    const item = await getPublicCmsItem(storeId, "blog", slug);
    return item ? toMarketingPost(item, cmsImageUrl) : null;
  },
});

const getPlatformStore = cache(async () => {
  const subdomain = process.env.MARKETING_BLOG_STORE_SUBDOMAIN?.trim().toLowerCase();
  if (!subdomain) return null;
  try {
    const store = await getStorefrontBySubdomain(subdomain);
    return store ? { sellerId: store.id, storeId: store.storeId } : null;
  } catch (error) {
    console.error("[marketing] blog store lookup failed", error);
    return null;
  }
});

const getCmsPosts = cache(async (locale: string): Promise<MarketingPost[]> => {
  const store = await getPlatformStore();
  if (!store) return [];
  try {
    const posts = await getCachedPlatformPosts(store.sellerId, store.storeId);
    return posts.filter((post) => isPostForLocale(post, locale));
  } catch (error) {
    console.error("[marketing] blog posts failed", error);
    return [];
  }
});

async function getStaticPosts(locale: string): Promise<MarketingPost[]> {
  const t = await getTranslations({ locale, namespace: "blog" });
  return BLOG_POSTS.map((post) => ({
    ...post,
    source: "static" as const,
    title: t(`posts.${post.id}.title`),
    excerpt: t(`posts.${post.id}.excerpt`),
  }));
}

/** Newest first; the first post is featured on the index. */
export const getMarketingPosts = cache(async (locale: string): Promise<MarketingPost[]> => {
  const cms = await getCmsPosts(locale);
  return cms.length ? cms : getStaticPosts(locale);
});

/** One post of the blog the index shows for this locale, or null. */
export const getMarketingPost = cache(async (locale: string, slug: string): Promise<MarketingPost | null> => {
  const cms = await getCmsPosts(locale);
  if (!cms.length) return (await getStaticPosts(locale)).find((post) => post.id === slug) ?? null;

  const store = await getPlatformStore();
  if (!store || !/^[a-z0-9-]{1,200}$/.test(slug)) return null;
  try {
    const post = await getCachedPlatformPost(store.sellerId, store.storeId, slug);
    return post && isPostForLocale(post, locale) ? post : null;
  } catch (error) {
    console.error("[marketing] blog post failed", error);
    return null;
  }
});
