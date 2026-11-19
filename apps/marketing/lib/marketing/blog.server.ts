import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { cacheProfiles, createCachedQuery, marketingBlogTags } from "@workspace/cache";
import { PLATFORM_BLOG_BUCKET, PLATFORM_BLOG_SLUG_RE } from "@workspace/lib/platform-blog";
import { getPublishedPlatformPost, listPublishedPlatformPosts, type PublicPlatformPost } from "@workspace/lib/platform-blog/server";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { BLOG_POSTS, type MarketingPost } from "./blog.data";
import { platformPostToMarketing } from "./blog.lib";

/**
 * The tallaby.com blog (owner, 2026-10-19). Posts are written in the admin app
 * (Blog) and stored in platform_blog_posts (0073), separate from store blogs.
 * Only live posts reach these functions, and every admin save purges
 * `marketingBlogTags.posts()`, so the blog updates without a deploy. While the
 * table has no post for the locale (or cannot be read), the blog shows the
 * static posts in `blog.data.ts` (copy in messages).
 */

/** Listing entries without bodies: a cache entry must stay well under the 2 MB limit. */
const getCachedPlatformPosts = createCachedQuery({
  name: "marketing:platform-blog-posts:v1",
  ttl: cacheProfiles.listing,
  tags: () => [marketingBlogTags.posts()],
  query: (): Promise<PublicPlatformPost[]> => listPublishedPlatformPosts(),
});

const getCachedPlatformPost = createCachedQuery({
  name: "marketing:platform-blog-post:v1",
  ttl: cacheProfiles.listing,
  tags: (_slug: string) => [marketingBlogTags.posts()],
  query: (slug: string): Promise<PublicPlatformPost | null> => getPublishedPlatformPost(slug),
});

const imageUrl = (src: string) => getPublicUrl(src, PLATFORM_BLOG_BUCKET) || null;

const getPlatformPosts = cache(async (locale: string): Promise<MarketingPost[]> => {
  try {
    const posts = await getCachedPlatformPosts();
    return posts.flatMap((post) => platformPostToMarketing(post, locale, imageUrl) ?? []);
  } catch (error) {
    console.error("[marketing] blog posts failed", error);
    return [];
  }
});

async function getStaticPosts(locale: string): Promise<MarketingPost[]> {
  const t = await getTranslations({ locale, namespace: "blog" });
  // An excerpt-only page is a dead end for readers and thin content for search.
  return BLOG_POSTS.filter((post) => post.hasArticle).map((post) => ({
    ...post,
    source: "static" as const,
    title: t(`posts.${post.id}.title`),
    excerpt: t(`posts.${post.id}.excerpt`),
  }));
}

/** Newest first; the first post is featured on the index. */
export const getMarketingPosts = cache(async (locale: string): Promise<MarketingPost[]> => {
  const posts = await getPlatformPosts(locale);
  return posts.length ? posts : getStaticPosts(locale);
});

/** One post of the blog the index shows for this locale, or null. */
export const getMarketingPost = cache(async (locale: string, slug: string): Promise<MarketingPost | null> => {
  const posts = await getPlatformPosts(locale);
  if (!posts.length) return (await getStaticPosts(locale)).find((post) => post.id === slug) ?? null;

  if (slug.length > 200 || !PLATFORM_BLOG_SLUG_RE.test(slug)) return null;
  try {
    const post = await getCachedPlatformPost(slug);
    return post ? platformPostToMarketing(post, locale, imageUrl) : null;
  } catch (error) {
    console.error("[marketing] blog post failed", error);
    return null;
  }
});
