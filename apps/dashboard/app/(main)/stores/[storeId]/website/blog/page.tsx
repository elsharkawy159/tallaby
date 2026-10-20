import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { FileText, ImageOff, Plus, Search } from "lucide-react";
import { listBlogPosts } from "@workspace/lib/cms/server";
import { storeUrl } from "@workspace/lib/storefront";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { cn } from "@/lib/utils";
import type { BlogPostListItem, BlogPostState } from "./blog.dto";
import { DeletePostButton } from "./delete-post-button.client";

const STATES = ["all", "published", "scheduled", "draft"] as const;
type StateFilter = (typeof STATES)[number];

const STATE_BADGE: Record<BlogPostState, string> = {
  published: "border-success/30 bg-success/10 text-success",
  scheduled: "border-accent/40 bg-accent/10 text-accent-ink",
  draft: "",
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-[42px] rtl:flex-row">
            <a href={`${liveBase}/blog`} target="_blank" rel="noopener noreferrer">
              {t("viewBlog")}
            </a>
          </Button>
          {!readOnly && (
            <Button asChild className="h-[42px] rtl:flex-row">
              <Link href={`${base}/new`}>
                <Plus className="size-4" />
                {t("newPost")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATES.map((value) => (
          <Link
            key={value}
            href={filterHref({ state: value })}
            aria-current={state === value ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              state === value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {t(`states.${value}`)}
          </Link>
        ))}
        {tag && (
          <Link href={filterHref({ tag: undefined })} className="rounded-full border border-dashed px-3 py-1.5 text-sm">
            {t("tagFilter", { tag })} ✕
          </Link>
        )}
        <form action={base} className="ms-auto flex items-center gap-2">
          {state !== "all" && <input type="hidden" name="state" value={state} />}
          {tag && <input type="hidden" name="tag" value={tag} />}
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder={t("search")} className="h-10 w-56 ps-9" />
          </div>
        </form>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
          <FileText className="size-8 text-muted-foreground" />
          <p className="font-semibold">{list.total === 0 && state === "all" && !tag && !q ? t("emptyTitle") : t("noMatches")}</p>
          {list.total === 0 && state === "all" && !tag && !q && <p className="max-w-md text-sm text-muted-foreground">{t("emptyText")}</p>}
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center gap-3 p-3 sm:p-4">
              <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- seller upload URL
                  <img src={post.coverImage} alt="" className="size-full object-cover" />
                ) : (
                  <ImageOff className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`${base}/${post.id}`} className="block truncate font-semibold hover:underline">
                  {post.title}
                </Link>
                <p className="truncate text-xs text-muted-foreground" dir="ltr">
                  /blog/{post.slug}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={STATE_BADGE[post.state]}>
                    {t(`states.${post.state}`)}
                  </Badge>
                  {post.publishedAt && post.state !== "draft" && (
                    <span className="text-xs text-muted-foreground">
                      {format.dateTime(new Date(post.publishedAt), { dateStyle: "medium", timeStyle: post.state === "scheduled" ? "short" : undefined })}
                    </span>
                  )}
                  {post.tags.slice(0, 4).map((value) => (
                    <Link key={value} href={filterHref({ tag: value })} className="rounded bg-muted px-1.5 text-xs text-muted-foreground hover:text-foreground">
                      #{value}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {post.state === "published" && (
                  <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                    <a href={`${liveBase}/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                      {t("view")}
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link href={`${base}/${post.id}`}>{t("edit")}</Link>
                </Button>
                {!readOnly && <DeletePostButton storeId={store.id} postId={post.id} title={post.title} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
