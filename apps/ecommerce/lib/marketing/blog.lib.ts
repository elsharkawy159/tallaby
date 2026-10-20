import type { PublicPlatformPost } from "@workspace/lib/platform-blog/server";
import { BLOG_CATEGORIES, type BlogCategory, type MarketingPost } from "./blog.data";

/**
 * Pure helpers that turn the tallaby.com blog posts written in the admin app
 * (platform_blog_posts, 0073) into marketing posts (owner, 2026-10-19). One
 * post holds both languages; a locale whose title is empty does not show it.
 */

const CATEGORIES = BLOG_CATEGORIES.filter((c): c is Exclude<BlogCategory, "all"> => c !== "all");
const DEFAULT_CATEGORY: Exclude<BlogCategory, "all"> = "guides";
const FALLBACK_IMAGE = "/banner.jpg";

export function isPostForLocale(post: Pick<MarketingPost, "langs">, locale: string): boolean {
  return !post.langs?.length || post.langs.includes(locale);
}

export function postCategory(category: string): Exclude<BlogCategory, "all"> {
  return (CATEGORIES as readonly string[]).includes(category) ? (category as Exclude<BlogCategory, "all">) : DEFAULT_CATEGORY;
}

/** Minutes to read an HTML body (≈200 words a minute, at least 1). */
export function htmlReadingMinutes(html: string): number {
  const words = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const pick = (ar: string, en: string, locale: string) => ((locale === "en" ? en : ar) ?? "").trim();

/**
 * The post in `locale`, or null when it has no title in that locale.
 * `resolveImage` turns a stored bucket path into a public URL (null when empty).
 */
export function platformPostToMarketing(
  post: PublicPlatformPost,
  locale: string,
  resolveImage: (src: string) => string | null,
): MarketingPost | null {
  const title = pick(post.titleAr, post.titleEn, locale);
  if (!title) return null;
  const body = pick(post.bodyAr, post.bodyEn, locale);
  const seo = post.seo ?? {};
  const seoTitle = pick(seo.titleAr ?? "", seo.titleEn ?? "", locale);
  const seoDescription = pick(seo.descriptionAr ?? "", seo.descriptionEn ?? "", locale);
  const ogImage = seo.ogImage ? resolveImage(seo.ogImage) : null;
  return {
    id: post.slug,
    source: "cms",
    category: postCategory(post.category),
    image: (post.coverImage ? resolveImage(post.coverImage) : null) ?? FALLBACK_IMAGE,
    date: post.publishedAt,
    minutes: post.readingMinutes && post.readingMinutes > 0 ? post.readingMinutes : htmlReadingMinutes(body),
    hasArticle: Boolean(body),
    title,
    excerpt: pick(post.excerptAr, post.excerptEn, locale) || seoDescription,
    html: body,
    authorName: post.authorName?.trim() || null,
    tags: post.tags,
    langs: [post.titleAr.trim() ? "ar" : null, post.titleEn.trim() ? "en" : null].filter((l): l is string => l !== null),
    updatedAt: post.updatedAt,
    seo: {
      ...(seoTitle && { title: seoTitle }),
      ...(seoDescription && { description: seoDescription }),
      ...(ogImage && { ogImage }),
      ...(seo.noindex && { noindex: true }),
    },
  };
}

/** Next/Image optimizes local files and our Supabase buckets; anything else is served as is. */
export function isOptimizableImage(src: string): boolean {
  return src.startsWith("/") || /^https:\/\/[a-z0-9]+\.supabase\.co\//.test(src);
}
