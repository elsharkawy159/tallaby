import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ExternalLink, FileText, ImageOff, Pencil, Plus, Search, X } from "lucide-react";
import { listBlogPosts } from "@workspace/lib/cms/server";
import { storeUrl } from "@workspace/lib/storefront";
import { EmptyState, IconButton, PageHeader, SellerButton, SellerCard, StatusBadge, type BadgeTone } from "@/components/seller-ui";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { cn } from "@/lib/utils";
import { SiteOfflineNote } from "../_components/site-offline-note";
import type { BlogPostListItem, BlogPostState } from "./blog.dto";
import { DeletePostButton } from "./delete-post-button.client";
import { RemoteImage } from "@/components/media/remote-image";

const STATES = ["all", "published", "scheduled", "draft"] as const;
type StateFilter = (typeof STATES)[number];

const STATE_TONE: Record<BlogPostState, BadgeTone> = {
  published: "success",
  scheduled: "warning",
  draft: "muted",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Website › Blog (PLAN.md §8.9, P4-16): the store's posts with state, tag and
 * text filters. Opening the page creates the store's system blog collection
 * on first use. Seller data: never cached.
 */
export default async function StoreBlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ state?: string | string[]; tag?: string | string[]; q?: string | string[] }>;
}) {
  const { storeId } = await params;
  const query = await searchParams;
  const store = await loadStorePage(storeId);
  const state: StateFilter = (STATES as readonly string[]).includes(first(query.state) ?? "") ? (first(query.state) as StateFilter) : "all";
  const tag = first(query.tag)?.trim().toLowerCase().slice(0, 40) || undefined;
  const q = first(query.q)?.trim().slice(0, 80) || undefined;

  const [t, format, list] = await Promise.all([
    getTranslations("websiteBlog"),
    getFormatter(),
    listBlogPosts(store.sellerId, store.id, { state, tag, search: q, limit: 100 }),
  ]);
  if (!list) notFound();

  const posts: BlogPostListItem[] = list.items.map((item) => ({
    id: item.id,
    title: typeof item.data.title === "string" ? item.data.title : item.slug,
    slug: item.slug,
    state: item.state,
    publishedAt: item.publishedAt,
    updatedAt: item.updatedAt,
    tags: Array.isArray(item.data.tags) ? (item.data.tags as string[]) : [],
    coverImage: typeof item.data.coverImage === "string" ? item.data.coverImage : null,
  }));

  const base = `/stores/${store.id}/website/blog`;
  const filterHref = (next: Partial<{ state: StateFilter; tag: string | undefined }>) => {
    const params = new URLSearchParams();
    const s = next.state ?? state;
    const tg = "tag" in next ? next.tag : tag;
    if (s !== "all") params.set("state", s);
    if (tg) params.set("tag", tg);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };
  const liveBase = storeUrl(store.subdomain);
  const readOnly = store.status !== "active";
  const untouched = list.total === 0 && state === "all" && !tag && !q;
  const chip =
    "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-(--s-field) bg-(--s-surface) px-3.5 text-[13px] font-semibold text-(--s-muted) no-underline transition-colors duration-150 hover:border-(--tallaby-teal-300) aria-[current=page]:border-(--s-solid) aria-[current=page]:bg-(--s-solid) aria-[current=page]:text-(--s-solid-fg) max-[600px]:h-10";

  return (
    <>
      <PageHeader
        className="sui-rise"
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <SellerButton asChild variant="outline">
              <a href={`${liveBase}/blog`} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden className="rtl:-scale-x-100" />
                {t("viewBlog")}
              </a>
            </SellerButton>
            {!readOnly && (
              <SellerButton asChild>
                <Link href={`${base}/new`}>
                  <Plus aria-hidden />
                  {t("newPost")}
                </Link>
              </SellerButton>
            )}
          </>
        }
      />
      <SiteOfflineNote storeId={store.id} siteStatus={store.siteStatus} />

      <div className="sui-rise flex flex-wrap items-center gap-2">
        <div className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATES.map((value) => (
            <Link key={value} href={filterHref({ state: value })} aria-current={state === value ? "page" : undefined} className={chip}>
              {t(`states.${value}`)}
            </Link>
          ))}
          {tag && (
            <Link href={filterHref({ tag: undefined })} className={cn(chip, "border-dashed")}>
              {t("tagFilter", { tag })}
              <X className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
        <form action={base} className="ms-auto max-[600px]:ms-0 max-[600px]:w-full">
          {state !== "all" && <input type="hidden" name="state" value={state} />}
          {tag && <input type="hidden" name="tag" value={tag} />}
          <label className="flex h-10 w-[240px] items-center gap-2 rounded-full border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5 text-(--s-subtle) focus-within:border-(--s-primary) max-[600px]:w-full">
            <Search className="size-4 shrink-0" aria-hidden />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder={t("search")}
              aria-label={t("search")}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-(--s-text) outline-none placeholder:text-(--s-placeholder)"
            />
          </label>
        </form>
      </div>

      {posts.length === 0 ? (
        <SellerCard className="sui-rise">
          <EmptyState
            icon={FileText}
            title={untouched ? t("emptyTitle") : t("noMatches")}
            description={untouched ? t("emptyText") : undefined}
            action={
              untouched && !readOnly ? (
                <SellerButton asChild size="sm">
                  <Link href={`${base}/new`}>
                    <Plus aria-hidden />
                    {t("newPost")}
                  </Link>
                </SellerButton>
              ) : undefined
            }
          />
        </SellerCard>
      ) : (
        <ul className="sui-rise flex flex-col overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface)">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft)">
              <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-(--s-fill) text-(--s-subtle)">
                {post.coverImage ? <RemoteImage src={post.coverImage} alt="" width={56} height={56} className="size-full object-cover" /> : <ImageOff className="size-5" aria-hidden />}
              </div>
              <div className="min-w-[180px] flex-1">
                <Link href={`${base}/${post.id}`} className="block truncate text-sm font-bold text-(--s-text) no-underline hover:underline">
                  {post.title}
                </Link>
                <bdi dir="ltr" className="block truncate font-mono text-xs text-(--s-subtle)">
                  /blog/{post.slug}
                </bdi>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <StatusBadge tone={STATE_TONE[post.state]}>{t(`states.${post.state}`)}</StatusBadge>
                  {post.publishedAt && post.state !== "draft" && (
                    <span className="text-xs text-(--s-subtle)">
                      {format.dateTime(new Date(post.publishedAt), { dateStyle: "medium", timeStyle: post.state === "scheduled" ? "short" : undefined })}
                    </span>
                  )}
                  {post.tags.slice(0, 4).map((value) => (
                    <Link key={value} href={filterHref({ tag: value })} className="rounded-full bg-(--s-fill) px-2 py-0.5 text-[11px] font-semibold text-(--s-muted) no-underline hover:text-(--s-ink)">
                      #{value}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 max-[600px]:ms-auto">
                {post.state === "published" && (
                  <IconButton asChild aria-label={t("view")} title={t("view")}>
                    <a href={`${liveBase}/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink aria-hidden className="rtl:-scale-x-100" />
                    </a>
                  </IconButton>
                )}
                <SellerButton asChild variant="mini" size="xs">
                  <Link href={`${base}/${post.id}`}>
                    <Pencil aria-hidden />
                    {t("edit")}
                  </Link>
                </SellerButton>
                {!readOnly && <DeletePostButton storeId={store.id} postId={post.id} title={post.title} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
