import { BLOG_FIELDS, cmsItemPath, cmsItemSummaryFields, type CmsFieldDef, type PublicCmsItem } from "@workspace/lib/cms";
import type { ContentItemSummary } from "@workspace/store-sections/render";
import { getPublicUrl } from "@workspace/ui/lib/utils";

/** Stored images are public URLs or paths in the sellers bucket. */
export function cmsImageUrl(src: string | null | undefined): string | null {
  return src ? getPublicUrl(src, "sellers") || null : null;
}

/** A published item as a content-section card (P4-16, P4-11). */
export function toContentSummary(item: PublicCmsItem, fields: readonly CmsFieldDef[] = BLOG_FIELDS): ContentItemSummary {
  const summary = cmsItemSummaryFields(item.collectionKind === "blog" ? BLOG_FIELDS : fields, item.data);
  const minutes = item.data.readingMinutes;
  const author = item.data.authorName;
  return {
    id: item.id,
    title: summary.title || item.slug,
    href: cmsItemPath(item.collectionSlug, item.slug),
    excerpt: summary.excerpt ?? item.seo.description ?? null,
    image: summary.image,
    publishedAt: item.publishedAt,
    tags: summary.tags,
    authorName: typeof author === "string" ? author : null,
    readingMinutes: typeof minutes === "number" ? minutes : null,
  };
}

export function formatContentDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
