import { EMPTY_PLATFORM_BLOG_SEO, type PlatformBlogPostInput } from "@workspace/lib/platform-blog";
import type { AdminPlatformBlogPost } from "@workspace/lib/admin/server";
import type { BlogPostForm } from "./blog.dto";

/** Pure helpers for the admin blog editor: form ↔ input mapping and dates. */

export const EMPTY_BLOG_FORM: BlogPostForm = {
  slug: "",
  category: "guides",
  titleAr: "",
  titleEn: "",
  excerptAr: "",
  excerptEn: "",
  bodyAr: "",
  bodyEn: "",
  coverImage: "",
  authorName: "",
  tags: "",
  readingMinutes: "",
  seo: EMPTY_PLATFORM_BLOG_SEO,
  status: "draft",
  publishedAt: "",
};

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO → `datetime-local` value in the runtime's time zone ("" for null). */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `datetime-local` value → ISO (null when empty or invalid). */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** "a, B ,a" → ["a", "b"]. */
export function parseTags(value: string): string[] {
  return [...new Set(value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 20);
}

/** A saved post as editor values (dates need the browser's time zone, so call this on the client). */
export function postToForm(post: AdminPlatformBlogPost): BlogPostForm {
  return {
    id: post.id,
    slug: post.slug,
    category: post.category as BlogPostForm["category"],
    titleAr: post.titleAr,
    titleEn: post.titleEn,
    excerptAr: post.excerptAr,
    excerptEn: post.excerptEn,
    bodyAr: post.bodyAr,
    bodyEn: post.bodyEn,
    coverImage: post.coverImage ?? "",
    authorName: post.authorName ?? "",
    tags: post.tags.join(", "),
    readingMinutes: post.readingMinutes ? String(post.readingMinutes) : "",
    seo: { ...EMPTY_PLATFORM_BLOG_SEO, ...post.seo },
    status: post.status === "published" ? "published" : "draft",
    publishedAt: isoToLocalInput(post.publishedAt),
  };
}

/** Editor values → the input `savePlatformBlogPost` validates. Publishing without a date means now. */
export function formToInput(form: BlogPostForm, now: Date = new Date()): PlatformBlogPostInput {
  const minutes = Number.parseInt(form.readingMinutes, 10);
  const publishedAt = localInputToIso(form.publishedAt) ?? (form.status === "published" ? now.toISOString() : null);
  return {
    ...(form.id ? { id: form.id } : {}),
    slug: form.slug.trim(),
    category: form.category,
    titleAr: form.titleAr.trim(),
    titleEn: form.titleEn.trim(),
    excerptAr: form.excerptAr.trim(),
    excerptEn: form.excerptEn.trim(),
    bodyAr: isEmptyHtml(form.bodyAr) ? "" : form.bodyAr,
    bodyEn: isEmptyHtml(form.bodyEn) ? "" : form.bodyEn,
    coverImage: form.coverImage.trim(),
    authorName: form.authorName.trim(),
    tags: parseTags(form.tags),
    readingMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.min(minutes, 600) : null,
    seo: {
      titleAr: form.seo.titleAr.trim(),
      titleEn: form.seo.titleEn.trim(),
      descriptionAr: form.seo.descriptionAr.trim(),
      descriptionEn: form.seo.descriptionEn.trim(),
      ogImage: form.seo.ogImage.trim(),
      noindex: form.seo.noindex,
    },
    status: form.status,
    publishedAt,
  };
}

/** The editor leaves "<p></p>" behind when cleared. */
export function isEmptyHtml(html: string): boolean {
  return !html.replace(/<(?!img)[^>]*>/gi, "").replace(/&nbsp;/g, " ").trim() && !/<img\b/i.test(html);
}
