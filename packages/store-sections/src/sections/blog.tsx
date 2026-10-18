/**
 * Blog and CMS sections (PLAN.md §8.9 P4-16, §8.5 P4-11). Blog sections are
 * pre-bound to the store's system `blog` collection; CMS sections name one of
 * the store's collections by its slug. Props are presentation only: the host
 * resolves `contentQuery` against the store of the request (published items
 * only) and passes the items in `ctx.content.items[instance.id]`.
 */
import { z } from "zod";
import { sectionText } from "../core/copy";
import type { ContentItemSummary, RenderContext, SectionDefinition } from "../core/types";
import { EmptyState, SectionHeading, SectionImage, SectionShell, SmartLink, cn, text } from "./_primitives";

/** Slug of the system blog collection (cms_collections.slug). */
export const BLOG_COLLECTION_SLUG = "blog";

const collectionSlug = z
  .string()
  .trim()
  .toLowerCase()
  .max(128)
  .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?)?$/)
  .catch("");

function itemsOf(ctx: RenderContext, instanceId: string): ContentItemSummary[] {
  return ctx.content?.items[instanceId] ?? [];
}

function formatDate(ctx: RenderContext, iso: string | null | undefined): string | null {
  if (!iso) return null;
  return ctx.formatDate ? ctx.formatDate(iso) : iso.slice(0, 10);
}

function PostMeta({ ctx, item, showDate }: { ctx: RenderContext; item: ContentItemSummary; showDate: boolean }) {
  const date = showDate ? formatDate(ctx, item.publishedAt) : null;
  const minutes = item.readingMinutes ? sectionText("minutesRead", ctx.locale, { n: item.readingMinutes }) : null;
  const parts = [date, minutes].filter(Boolean);
  if (!parts.length) return null;
  return <p className="text-xs text-(--sf-muted)">{parts.join(" · ")}</p>;
}

function PostCard({
  ctx,
  item,
  showExcerpt,
  showDate,
  layout,
}: {
  ctx: RenderContext;
  item: ContentItemSummary;
  showExcerpt: boolean;
  showDate: boolean;
  layout: "grid" | "list";
}) {
  return (
    <article
      className={cn(
        "group flex overflow-hidden rounded-(--sf-radius,12px) border border-(--sf-line) bg-(--sf-paper)",
        layout === "grid" ? "flex-col" : "flex-row",
      )}
    >
      {item.image && (
        <SmartLink
          ctx={ctx}
          href={item.href}
          className={cn("block shrink-0 overflow-hidden bg-(--sf-shelf)", layout === "grid" ? "aspect-[16/9] w-full" : "w-32 md:w-48")}
        >
          <SectionImage ctx={ctx} src={item.image} alt={item.title} className="size-full transition-transform group-hover:scale-[1.03]" />
        </SmartLink>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <PostMeta ctx={ctx} item={item} showDate={showDate} />
        <h3 className="text-balance text-lg font-bold leading-snug">
          <SmartLink ctx={ctx} href={item.href}>
            {item.title}
          </SmartLink>
        </h3>
        {showExcerpt && item.excerpt && <p className="line-clamp-3 text-pretty text-sm leading-relaxed text-(--sf-muted)">{item.excerpt}</p>}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// blog-latest-posts
// ---------------------------------------------------------------------------

const latestPostsSchema = z.object({
  title: text(120),
  limit: z.number().int().min(1).max(12).catch(3),
  layout: z.enum(["grid", "list"]).catch("grid"),
  columns: z.enum(["2", "3"]).catch("3"),
  showExcerpt: z.boolean().catch(true),
  showDate: z.boolean().catch(true),
  showViewAll: z.boolean().catch(true),
});
type LatestPostsProps = z.infer<typeof latestPostsSchema>;

export const blogLatestPosts: SectionDefinition<LatestPostsProps> = {
  id: "blog-latest-posts",
  version: 1,
  category: "blog",
  displayName: { ar: "أحدث المقالات", en: "Latest posts" },
  description: { ar: "أحدث مقالات مدونة متجرك، تلقائيًا.", en: "Your store blog's newest posts, automatically." },
  propsSchema: latestPostsSchema,
  defaultProps: { title: "من المدونة", limit: 3, layout: "grid", columns: "3", showExcerpt: true, showDate: true, showViewAll: true },
  propDefinitions: [
    { key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true },
    { key: "limit", label: { ar: "عدد المقالات", en: "How many posts" }, type: "number", min: 1, max: 12 },
    {
      key: "layout",
      label: { ar: "الشكل", en: "Layout" },
      type: "select",
      group: "layout",
      options: [
        { value: "grid", label: { ar: "بطاقات", en: "Cards" } },
        { value: "list", label: { ar: "قائمة", en: "List" } },
      ],
    },
    {
      key: "columns",
      label: { ar: "عدد الأعمدة", en: "Columns" },
      type: "select",
      group: "layout",
      options: [
        { value: "2", label: { ar: "2", en: "2" } },
        { value: "3", label: { ar: "3", en: "3" } },
      ],
    },
    { key: "showExcerpt", label: { ar: "إظهار الملخص", en: "Show excerpt" }, type: "switch" },
    { key: "showDate", label: { ar: "إظهار التاريخ", en: "Show date" }, type: "switch" },
    { key: "showViewAll", label: { ar: "رابط كل المقالات", en: "All posts link" }, type: "switch" },
  ],
  contentQuery: (props) => ({ collection: BLOG_COLLECTION_SLUG, limit: props.limit }),
  Component: ({ instance, props, ctx }) => {
    const posts = itemsOf(ctx, instance.id);
    return (
      <SectionShell id="blog">
        <SectionHeading
          title={props.title}
          action={
            props.showViewAll && posts.length > 0 ? (
              <SmartLink ctx={ctx} href="/blog" className="text-sm font-semibold text-(--sf-brand)">
                {sectionText("allPosts", ctx.locale)}
              </SmartLink>
            ) : null
          }
        />
        {posts.length === 0 ? (
          <EmptyState>{sectionText("noPosts", ctx.locale)}</EmptyState>
        ) : (
          <ul
            className={cn(
              "grid gap-4 md:gap-6",
              props.layout === "grid" && "sm:grid-cols-2",
              props.layout === "grid" && props.columns === "3" && "lg:grid-cols-3",
            )}
          >
            {posts.map((post) => (
              <li key={post.id} className="flex">
                <div className="w-full">
                  <PostCard ctx={ctx} item={post} showExcerpt={props.showExcerpt} showDate={props.showDate} layout={props.layout} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionShell>
    );
  },
};

// ---------------------------------------------------------------------------
// blog-featured-post
// ---------------------------------------------------------------------------

const featuredPostSchema = z.object({
  title: text(120),
  showExcerpt: z.boolean().catch(true),
  ctaLabel: text(40),
});
type FeaturedPostProps = z.infer<typeof featuredPostSchema>;

export const blogFeaturedPost: SectionDefinition<FeaturedPostProps> = {
  id: "blog-featured-post",
  version: 1,
  category: "blog",
  displayName: { ar: "مقال مميز", en: "Featured post" },
  description: { ar: "أحدث مقال في مدونتك بصورة كبيرة.", en: "Your blog's newest post with a large image." },
  propsSchema: featuredPostSchema,
  defaultProps: { title: "", showExcerpt: true, ctaLabel: "اقرأ المقال" },
  propDefinitions: [
    { key: "title", label: { ar: "عنوان فوق المقال (اختياري)", en: "Heading above the post (optional)" }, type: "text", maxLength: 120, translatable: true },
    { key: "showExcerpt", label: { ar: "إظهار الملخص", en: "Show excerpt" }, type: "switch" },
    { key: "ctaLabel", label: { ar: "نص الزر", en: "Button text" }, type: "text", maxLength: 40, translatable: true },
  ],
  contentQuery: () => ({ collection: BLOG_COLLECTION_SLUG, limit: 1 }),
  Component: ({ instance, props, ctx }) => {
    const post = itemsOf(ctx, instance.id)[0];
    return (
      <SectionShell>
        <SectionHeading title={props.title} />
        {!post ? (
          <EmptyState>{sectionText("noPosts", ctx.locale)}</EmptyState>
        ) : (
          <article className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
            <SmartLink ctx={ctx} href={post.href} className="block aspect-[16/10] overflow-hidden rounded-(--sf-radius,12px) bg-(--sf-shelf)">
              <SectionImage ctx={ctx} src={post.image} alt={post.title} className="size-full" />
            </SmartLink>
            <div className="space-y-3">
              <PostMeta ctx={ctx} item={post} showDate />
              <h2 className="text-balance text-2xl font-bold md:text-3xl">
                <SmartLink ctx={ctx} href={post.href}>
                  {post.title}
                </SmartLink>
              </h2>
              {props.showExcerpt && post.excerpt && <p className="text-pretty leading-relaxed text-(--sf-muted)">{post.excerpt}</p>}
              <SmartLink
                ctx={ctx}
                href={post.href}
                className="inline-flex h-11 items-center rounded-(--sf-radius,12px) bg-(--sf-brand) px-6 text-sm font-semibold text-(--sf-brand-ink,#fff)"
              >
                {props.ctaLabel || sectionText("readMore", ctx.locale)}
              </SmartLink>
            </div>
          </article>
        )}
      </SectionShell>
    );
  },
};

// ---------------------------------------------------------------------------
// cms-list (P4-11)
// ---------------------------------------------------------------------------

const cmsListSchema = z.object({
  title: text(120),
  collection: collectionSlug,
  limit: z.number().int().min(1).max(24).catch(6),
  columns: z.enum(["2", "3", "4"]).catch("3"),
  showExcerpt: z.boolean().catch(true),
});
type CmsListProps = z.infer<typeof cmsListSchema>;

export const cmsList: SectionDefinition<CmsListProps> = {
  id: "cms-list",
  version: 1,
  category: "blog",
  displayName: { ar: "قائمة محتوى", en: "Content list" },
  description: {
    ar: "عناصر منشورة من إحدى مجموعات المحتوى في متجرك.",
    en: "Published items from one of your store's content collections.",
  },
  propsSchema: cmsListSchema,
  defaultProps: { title: "", collection: "", limit: 6, columns: "3", showExcerpt: true },
  propDefinitions: [
    {
      key: "collection",
      label: { ar: "عنوان المجموعة (مثل lookbook)", en: "Collection address (e.g. lookbook)" },
      type: "text",
      maxLength: 128,
    },
    { key: "title", label: { ar: "العنوان", en: "Title" }, type: "text", maxLength: 120, translatable: true },
    { key: "limit", label: { ar: "العدد", en: "How many" }, type: "number", min: 1, max: 24 },
    {
      key: "columns",
      label: { ar: "عدد الأعمدة", en: "Columns" },
      type: "select",
      group: "layout",
      options: [
        { value: "2", label: { ar: "2", en: "2" } },
        { value: "3", label: { ar: "3", en: "3" } },
        { value: "4", label: { ar: "4", en: "4" } },
      ],
    },
    { key: "showExcerpt", label: { ar: "إظهار الوصف", en: "Show description" }, type: "switch" },
  ],
  contentQuery: (props) => (props.collection ? { collection: props.collection, limit: props.limit } : null),
  Component: ({ instance, props, ctx }) => {
    const items = itemsOf(ctx, instance.id);
    if (!props.collection) {
      return ctx.mode === "edit" ? (
        <SectionShell>
          <EmptyState>{sectionText("pickCollection", ctx.locale)}</EmptyState>
        </SectionShell>
      ) : null;
    }
    return (
      <SectionShell>
        <SectionHeading title={props.title} />
        {items.length === 0 ? (
          <EmptyState>{sectionText("noItems", ctx.locale)}</EmptyState>
        ) : (
          <ul
            className={cn(
              "grid gap-4 sm:grid-cols-2 md:gap-6",
              props.columns === "3" && "lg:grid-cols-3",
              props.columns === "4" && "lg:grid-cols-4",
            )}
          >
            {items.map((item) => (
              <li key={item.id} className="flex">
                <div className="w-full">
                  <PostCard ctx={ctx} item={item} showExcerpt={props.showExcerpt} showDate={false} layout="grid" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionShell>
    );
  },
};

// ---------------------------------------------------------------------------
// cms-item (P4-11): one item, linked to its own page
// ---------------------------------------------------------------------------

const cmsItemSchema = z.object({
  collection: collectionSlug,
  slug: z.string().trim().toLowerCase().max(200).regex(/^[a-z0-9-]*$/).catch(""),
  ctaLabel: text(40),
});
type CmsItemProps = z.infer<typeof cmsItemSchema>;

export const cmsItem: SectionDefinition<CmsItemProps> = {
  id: "cms-item",
  version: 1,
  category: "blog",
  displayName: { ar: "عنصر محتوى", en: "Content item" },
  description: { ar: "عنصر واحد منشور من مجموعة محتوى، مع رابط لصفحته.", en: "One published item from a collection, linking to its page." },
  propsSchema: cmsItemSchema,
  defaultProps: { collection: "", slug: "", ctaLabel: "اعرف المزيد" },
  propDefinitions: [
    { key: "collection", label: { ar: "عنوان المجموعة", en: "Collection address" }, type: "text", maxLength: 128 },
    { key: "slug", label: { ar: "عنوان العنصر", en: "Item address" }, type: "text", maxLength: 200 },
    { key: "ctaLabel", label: { ar: "نص الزر", en: "Button text" }, type: "text", maxLength: 40, translatable: true },
  ],
  contentQuery: (props) => (props.collection && props.slug ? { collection: props.collection, slug: props.slug, limit: 1 } : null),
  Component: ({ instance, props, ctx }) => {
    const item = itemsOf(ctx, instance.id)[0];
    if (!item) {
      return ctx.mode === "edit" ? (
        <SectionShell>
          <EmptyState>{sectionText(props.collection ? "noItems" : "pickCollection", ctx.locale)}</EmptyState>
        </SectionShell>
      ) : null;
    }
    return (
      <SectionShell>
        <article className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
          {item.image && (
            <div className="aspect-[4/3] overflow-hidden rounded-(--sf-radius,12px) bg-(--sf-shelf)">
              <SectionImage ctx={ctx} src={item.image} alt={item.title} className="size-full" />
            </div>
          )}
          <div className="space-y-3">
            <h2 className="text-balance text-2xl font-bold md:text-3xl">{item.title}</h2>
            {item.excerpt && <p className="text-pretty leading-relaxed text-(--sf-muted)">{item.excerpt}</p>}
            <SmartLink
              ctx={ctx}
              href={item.href}
              className="inline-flex h-11 items-center rounded-(--sf-radius,12px) border border-(--sf-line) px-6 text-sm font-semibold"
            >
              {props.ctaLabel || sectionText("readMore", ctx.locale)}
            </SmartLink>
          </div>
        </article>
      </SectionShell>
    );
  },
};
