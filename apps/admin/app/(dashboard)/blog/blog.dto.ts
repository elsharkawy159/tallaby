/** Admin › Blog (tallaby.com blog, 0073): shapes shared by the pages, the editor and the actions. */
import type { PlatformBlogCategory, PlatformBlogSeo } from "@workspace/lib/platform-blog";

/** The editor's form values. `publishedAt` is a `datetime-local` value in the admin's time zone. */
export type BlogPostForm = {
  id?: string;
  slug: string;
  category: PlatformBlogCategory;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  bodyAr: string;
  bodyEn: string;
  coverImage: string;
  authorName: string;
  tags: string;
  readingMinutes: string;
  seo: PlatformBlogSeo;
  status: "draft" | "published";
  publishedAt: string;
};

export type BlogActionResult =
  | { success: true; message: string; id: string }
  | { success: false; error: string };

export const BLOG_ERROR_MESSAGES: Record<string, string> = {
  not_admin: "Only an active admin can do this.",
  invalid_input: "Check the form and try again.",
  not_found: "This post no longer exists. Refresh the page.",
  slug_taken: "Another post already uses this slug.",
  migration_required: "Apply migration 0073 (platform blog) first.",
};
