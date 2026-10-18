import { sanitizeArticleHtml } from "@workspace/store-sections/config";
import type { ContentItemSummary } from "@workspace/store-sections/render";
import { Link } from "@/i18n/navigation";
import { cmsImageUrl, formatContentDate } from "@/lib/store-cms/cms.lib";

/**
 * Blog and CMS pages on a store host (PLAN.md P4-16, P4-11). Styled with the
 * store tokens (`--sf-*`), so they follow the published theme or Tallaby
 * Classic. Seller HTML is sanitized here again right before render.
 */

export function ContentImage({ src, alt, className, eager = false }: { src: string | null | undefined; alt: string; className?: string; eager?: boolean }) {
  const url = cmsImageUrl(src);
  if (!url) return <div aria-hidden className={`bg-(--sf-shelf) ${className ?? ""}`} />;
  // eslint-disable-next-line @next/next/no-img-element -- seller images from storage or any allowed host
  return <img src={url} alt={alt} className={`object-cover ${className ?? ""}`} loading={eager ? "eager" : "lazy"} decoding="async" />;
}

export function PostMeta({ post, locale, minutesLabel }: { post: ContentItemSummary; locale: string; minutesLabel: (n: number) => string }) {
  const parts = [post.publishedAt ? formatContentDate(post.publishedAt, locale) : null, post.readingMinutes ? minutesLabel(post.readingMinutes) : null].filter(Boolean);
  if (!parts.length) return null;
  return <p className="text-xs text-(--sf-muted)">{parts.join(" · ")}</p>;
}

export function PostCard({
  post,
  locale,
  minutesLabel,
  eager = false,
}: {
  post: ContentItemSummary;
  locale: string;
  minutesLabel: (n: number) => string;
  eager?: boolean;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper)">
      {post.image && (
        <Link href={post.href} className="block aspect-[16/9] overflow-hidden bg-(--sf-shelf)" tabIndex={-1} aria-hidden>
          <ContentImage src={post.image} alt="" className="size-full transition-transform group-hover:scale-[1.03]" eager={eager} />
        </Link>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <PostMeta post={post} locale={locale} minutesLabel={minutesLabel} />
        <h2 className="text-balance text-lg font-bold leading-snug">
          <Link href={post.href} className="hover:text-(--sf-brand)">
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="line-clamp-3 text-pretty text-sm leading-relaxed text-(--sf-muted)">{post.excerpt}</p>}
      </div>
    </article>
  );
}

const PROSE =
  "max-w-none text-pretty leading-relaxed text-(--sf-ink) [&_a]:font-medium [&_a]:text-(--sf-brand) [&_a]:underline [&_blockquote]:border-s-4 [&_blockquote]:border-(--sf-line) [&_blockquote]:ps-4 [&_blockquote]:text-(--sf-muted) [&_code]:rounded [&_code]:bg-(--sf-shelf) [&_code]:px-1 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h4]:mt-4 [&_h4]:font-bold [&_hr]:my-8 [&_hr]:border-(--sf-line) [&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-(--sf-radius,12px) [&_li]:my-1 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-(--sf-radius,12px) [&_pre]:bg-(--sf-shelf) [&_pre]:p-4 [&_ul]:list-disc [&_ul]:ps-6";

/** Seller rich text, sanitized again before it reaches the page. */
export function ArticleBody({ html, className }: { html: string | null | undefined; className?: string }) {
  const clean = sanitizeArticleHtml(typeof html === "string" ? html : "");
  if (!clean) return null;
  return <div className={`${PROSE} ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}

/** JSON-LD script with `<` escaped so seller text can never close the tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
