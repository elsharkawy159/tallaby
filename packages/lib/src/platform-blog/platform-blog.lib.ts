/**
 * The tallaby.com blog (0073, owner 2026-10-19): platform posts written in the
 * admin app, separate from store blogs (cms_items). Pure: the input schema and
 * helpers shared by the admin editor, the audited writes and the marketing
 * reader. One post holds both languages; a locale with an empty title is not
 * shown on that locale.
 */
import { z } from "zod";

export const PLATFORM_BLOG_CATEGORIES = ["guides", "growth", "stories", "payments", "product"] as const;
export type PlatformBlogCategory = (typeof PLATFORM_BLOG_CATEGORIES)[number];

export const PLATFORM_BLOG_LOCALES = ["ar", "en"] as const;
export type PlatformBlogLocale = (typeof PLATFORM_BLOG_LOCALES)[number];

/** Public bucket for covers and inline images (0073). */
export const PLATFORM_BLOG_BUCKET = "platform-blog";

export const PLATFORM_BLOG_SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const PLATFORM_BLOG_SLUG_MAX = 200;
export const PLATFORM_BLOG_BODY_MAX = 200_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** A path inside the bucket ("2026/10/19/abc.webp"): no scheme, no leading slash, no "..". */
const BUCKET_PATH_RE = /^(?!.*\.\.)[A-Za-z0-9_-][A-Za-z0-9._/-]{0,499}$/;

export type PlatformBlogSeo = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  ogImage: string;
  noindex: boolean;
};

export const EMPTY_PLATFORM_BLOG_SEO: PlatformBlogSeo = {
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  ogImage: "",
  noindex: false,
};

/** Lowercase a-z0-9 words joined by "-" (Arabic-only titles give ""; the editor then asks for a slug). */
export function slugifyPlatformPost(value: string, maxLength = 80): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

/** A bucket path or an absolute https URL. */
export function isPlatformBlogImage(value: string): boolean {
  return BUCKET_PATH_RE.test(value) || isHttpsUrl(value);
}

const text = (max: number) => z.string().trim().max(max);
const image = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || isPlatformBlogImage(v), "Use an uploaded image or an https URL");

export const platformBlogSeoSchema = z.strictObject({
  titleAr: text(200),
  titleEn: text(200),
  descriptionAr: text(500),
  descriptionEn: text(500),
  ogImage: image,
  noindex: z.boolean(),
});

export const platformBlogPostInputSchema = z
  .strictObject({
    /** Absent when creating. */
    id: z.string().regex(UUID_RE, "Invalid id").optional(),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(PLATFORM_BLOG_SLUG_MAX)
      .regex(PLATFORM_BLOG_SLUG_RE, "Use lowercase letters, numbers and dashes"),
    category: z.enum(PLATFORM_BLOG_CATEGORIES),
    titleAr: text(300),
    titleEn: text(300),
    excerptAr: text(1000),
    excerptEn: text(1000),
    bodyAr: z.string().max(PLATFORM_BLOG_BODY_MAX),
    bodyEn: z.string().max(PLATFORM_BLOG_BODY_MAX),
    coverImage: image,
    authorName: text(120),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(20),
    readingMinutes: z.number().int().min(1).max(600).nullable(),
    seo: platformBlogSeoSchema,
    status: z.enum(["draft", "published"]),
    /** ISO date-time; required to publish. A future time schedules the post. */
    publishedAt: z.iso.datetime({ offset: true }).nullable(),
  })
  .refine((v) => v.status === "draft" || v.titleAr !== "" || v.titleEn !== "", {
    message: "A published post needs an Arabic or English title",
    path: ["titleAr"],
  })
  .refine((v) => v.status === "draft" || v.publishedAt !== null, {
    message: "Choose a publish date",
    path: ["publishedAt"],
  });

export type PlatformBlogPostInput = z.infer<typeof platformBlogPostInputSchema>;

export const platformBlogDeleteSchema = z.strictObject({
  id: z.string().regex(UUID_RE, "Invalid id"),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(500),
});

export type PlatformBlogPostState = "draft" | "scheduled" | "published";

/** Draft, scheduled (published with a future date) or published. */
export function platformPostState(status: string, publishedAt: string | null, now: Date = new Date()): PlatformBlogPostState {
  if (status !== "published" || !publishedAt) return "draft";
  return new Date(publishedAt).getTime() > now.getTime() ? "scheduled" : "published";
}

/** Locales a post can be read in: the ones with a title. */
export function platformPostLocales(post: { titleAr: string; titleEn: string }): PlatformBlogLocale[] {
  return PLATFORM_BLOG_LOCALES.filter((l) => (l === "ar" ? post.titleAr : post.titleEn).trim() !== "");
}

/** Error codes returned by the admin write functions. */
export type PlatformBlogAdminError = "not_admin" | "invalid_input" | "not_found" | "slug_taken" | "migration_required";
