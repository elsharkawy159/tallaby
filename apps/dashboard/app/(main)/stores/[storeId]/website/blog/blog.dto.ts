/** Website › Blog (PLAN.md §8.9, P4-16): shapes shared by the pages, the editor and the actions. */

export type BlogPostState = "draft" | "scheduled" | "published";

export type BlogPostListItem = {
  id: string;
  title: string;
  slug: string;
  state: BlogPostState;
  publishedAt: string | null;
  updatedAt: string;
  tags: string[];
  coverImage: string | null;
};

export type BlogPostSeo = { title: string; description: string; ogImage: string; noindex: boolean };

/** The editor's form values (also what `savePost` sends, after `toPostInput`). */
export type BlogPostForm = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  body: string;
  tags: string[];
  authorName: string;
  /** draft | publish now (or keep the date) | schedule at `scheduledAt`. */
  mode: "draft" | "publish" | "schedule";
  /** `datetime-local` value in the seller's time zone. */
  scheduledAt: string;
  seo: BlogPostSeo;
};

export type BlogRevision = { id: string; reason: string; createdAt: string; title: string; status: string };

/** Error keys under `websiteBlog.errors.*`. */
export type BlogErrorKey = "invalidInput" | "readOnly" | "notFound" | "slugTaken" | "invalidData" | "rateLimited" | "generic";

export type BlogResult<T> = { success: true; data: T } | { success: false; error: BlogErrorKey; fields?: string[] };

export const BLOG_ERRORS: Record<string, BlogErrorKey> = {
  invalid_input: "invalidInput",
  store_read_only: "readOnly",
  not_found: "notFound",
  slug_taken: "slugTaken",
  invalid_data: "invalidData",
};
