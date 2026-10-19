import { BLOG_CATEGORIES, type BlogCategory, type MarketingPost } from "./blog.data";

/**
 * Pure helpers that turn the platform store's published blog posts into
 * marketing posts (owner, 2026-10-19). Writers steer a post with tags:
 * `lang:ar` / `lang:en` limit it to one locale (no lang tag: both), and the
 * first tag that names a blog category ("guides", "growth", …) files it there.
 */

const CATEGORIES = BLOG_CATEGORIES.filter((c): c is Exclude<BlogCategory, "all"> => c !== "all");
const DEFAULT_CATEGORY: Exclude<BlogCategory, "all"> = "guides";
const FALLBACK_IMAGE = "/banner.jpg";

export type CmsBlogItem = {
  slug: string;
  data: Record<string, unknown>;
  seo: { title?: string; description?: string; ogImage?: string; noindex?: boolean };
  publishedAt: string;
  updatedAt: string;
};

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

function tagsOf(data: Record<string, unknown>): string[] {
  return Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim().toLowerCase()) : [];
}

function langsOf(tags: readonly string[]): string[] {
  return tags.filter((t) => t.startsWith("lang:")).map((t) => t.slice(5));
}

/** True when the post is meant for this locale (`lang:xx` tags, or none). */
export function postMatchesLocale(tags: readonly string[], locale: string): boolean {
  const langs = langsOf(tags);
  return langs.length === 0 || langs.includes(locale);
}

export function isPostForLocale(post: Pick<MarketingPost, "langs">, locale: string): boolean {
  return !post.langs?.length || post.langs.includes(locale);
}

export function postCategory(tags: readonly string[]): Exclude<BlogCategory, "all"> {
  const tag = tags.find((t) => (CATEGORIES as readonly string[]).includes(t));
  return (tag as Exclude<BlogCategory, "all"> | undefined) ?? DEFAULT_CATEGORY;
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

/** `resolveImage` turns a stored path into a public URL (null when empty). */
export function toMarketingPost(item: CmsBlogItem, resolveImage: (src: string) => string | null): MarketingPost {
  const tags = tagsOf(item.data);
  const body = str(item.data.body);
  const minutes = item.data.readingMinutes;
  return {
    id: item.slug,
    source: "cms",
    category: postCategory(tags),
    image: resolveImage(str(item.data.coverImage)) ?? FALLBACK_IMAGE,
    date: item.publishedAt,
    minutes: typeof minutes === "number" && minutes > 0 ? minutes : htmlReadingMinutes(body),
    hasArticle: Boolean(body),
    title: str(item.data.title) || item.slug,
    excerpt: str(item.data.excerpt) || str(item.seo.description),
    html: body,
    authorName: str(item.data.authorName) || null,
    tags: tags.filter((t) => !t.startsWith("lang:") && !CATEGORIES.includes(t as Exclude<BlogCategory, "all">)),
    langs: langsOf(tags),
    updatedAt: item.updatedAt,
    seo: item.seo,
  };
}

/** Next/Image optimizes local files and our Supabase buckets; anything else is served as is. */
export function isOptimizableImage(src: string): boolean {
  return src.startsWith("/") || /^https:\/\/[a-z0-9]+\.supabase\.co\//.test(src);
}
