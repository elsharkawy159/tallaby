/**
 * Public reads of the tallaby.com blog (0073). Only live posts: status
 * 'published' and published_at <= now(). Callers cache these under
 * `marketingBlogTags.posts()`, which the admin writes invalidate.
 */
import { and, db, desc, eq, lte, platformBlogPosts, sql } from "@workspace/db";
import type { PlatformBlogSeo } from "./platform-blog.lib";

/** The listing cap; a cache entry must stay well under the 2 MB limit. */
const LIST_LIMIT = 100;

const live = () => and(eq(platformBlogPosts.status, "published"), lte(platformBlogPosts.publishedAt, sql`now()`));

const listColumns = {
  slug: platformBlogPosts.slug,
  category: platformBlogPosts.category,
  titleAr: platformBlogPosts.titleAr,
  titleEn: platformBlogPosts.titleEn,
  excerptAr: platformBlogPosts.excerptAr,
  excerptEn: platformBlogPosts.excerptEn,
  coverImage: platformBlogPosts.coverImage,
  authorName: platformBlogPosts.authorName,
  tags: platformBlogPosts.tags,
  readingMinutes: platformBlogPosts.readingMinutes,
  seo: platformBlogPosts.seo,
  publishedAt: platformBlogPosts.publishedAt,
  updatedAt: platformBlogPosts.updatedAt,
};

export type PublicPlatformPost = {
  slug: string;
  category: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  /** Empty in listings. */
  bodyAr: string;
  bodyEn: string;
  coverImage: string | null;
  authorName: string | null;
  tags: string[];
  readingMinutes: number | null;
  seo: Partial<PlatformBlogSeo>;
  publishedAt: string;
  updatedAt: string;
};

type Row = Omit<PublicPlatformPost, "bodyAr" | "bodyEn" | "seo" | "publishedAt"> & { seo: unknown; publishedAt: string | null };

function toPublic(row: Row, bodies?: { bodyAr: string; bodyEn: string }): PublicPlatformPost {
  return {
    ...row,
    bodyAr: bodies?.bodyAr ?? "",
    bodyEn: bodies?.bodyEn ?? "",
    seo: row.seo && typeof row.seo === "object" ? (row.seo as Partial<PlatformBlogSeo>) : {},
    publishedAt: row.publishedAt ?? row.updatedAt,
  };
}

/** Live posts without bodies, newest first. */
export async function listPublishedPlatformPosts(): Promise<PublicPlatformPost[]> {
  const rows = await db
    .select(listColumns)
    .from(platformBlogPosts)
    .where(live())
    .orderBy(desc(platformBlogPosts.publishedAt))
    .limit(LIST_LIMIT);
  return rows.map((row) => toPublic(row));
}

/** One live post with its bodies, or null. */
export async function getPublishedPlatformPost(slug: string): Promise<PublicPlatformPost | null> {
  const [row] = await db
    .select({ ...listColumns, bodyAr: platformBlogPosts.bodyAr, bodyEn: platformBlogPosts.bodyEn })
    .from(platformBlogPosts)
    .where(and(eq(platformBlogPosts.slug, slug), live()))
    .limit(1);
  if (!row) return null;
  const { bodyAr, bodyEn, ...rest } = row;
  return toPublic(rest, { bodyAr, bodyEn });
}
