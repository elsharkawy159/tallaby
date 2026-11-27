import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { toContentSummary } from "@/lib/store-cms/cms.lib";
import { BLOG_CATEGORY_ID_RE } from "@workspace/lib/cms";
import { BLOG_PAGE_SIZE, getCachedBlogCategories, getCachedBlogPage, getCachedBlogTags } from "@/lib/store-cms/cms.server";
import { resolveStorefront } from "@/lib/storefront.server";
import { storePageMetadata } from "@/lib/store-seo/store-seo.lib";
import {
  isStoreOfflineForRequest,
  isSubdomainOfflineForRequest,
  STORE_OFFLINE_METADATA,
} from "@/lib/store-site/offline.server";
import { PostCard } from "../_components/store-content";
import s from "../storefront.module.css";

type BlogPageProps = {
  params: Promise<{ locale: string; subdomain: string }>;
  searchParams: Promise<{ page?: string | string[]; tag?: string | string[]; category?: string | string[] }>;
};

/**
 * The store blog, /blog on a store host (PLAN.md §8.9, P4-16): published,
 * due posts of this store only, newest first, paginated, with tag and
 * category filters (a category id the store does not have is ignored).
 * Chrome and theme come from the storefront layout.
 */
function parseQuery(query: Awaited<BlogPageProps["searchParams"]>) {
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const rawTag = Array.isArray(query.tag) ? query.tag[0] : query.tag;
  const rawCategory = (Array.isArray(query.category) ? query.category[0] : query.category)?.trim() ?? "";
  const page = Math.min(Math.max(Number.parseInt(rawPage ?? "1", 10) || 1, 1), 1000);
  const tag = rawTag?.trim().toLowerCase().slice(0, 40) || null;
  const category = BLOG_CATEGORY_ID_RE.test(rawCategory) ? rawCategory : null;
  return { page, tag, category };
}

function blogHref(page: number, tag: string | null, category: string | null = null) {
  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

export async function generateMetadata({ params, searchParams }: BlogPageProps): Promise<Metadata> {
  const { locale, subdomain } = await params;
  if (await isSubdomainOfflineForRequest(subdomain)) return STORE_OFFLINE_METADATA;
  const { page, tag, category: categoryId } = parseQuery(await searchParams);
  const [store, t] = await Promise.all([resolveStorefront(subdomain), getTranslations({ locale, namespace: "storefrontBlog" })]);
  const category = categoryId ? (await getCachedBlogCategories(store.id, store.storeId)).find((c) => c.id === categoryId) : undefined;
  return storePageMetadata(store, locale, {
    paths: "/blog",
    title: tag ? t("tagTitle", { tag }) : category ? t("categoryTitle", { name: category.name }) : t("title"),
    description: t("description", { store: store.displayName }),
    // Filtered and deeper pages are crawlable but not indexed (the sitemap lists /blog and every post).
    noindex: Boolean(tag) || Boolean(categoryId) || page > 1,
  });
}

export default async function StoreBlogPage({ params, searchParams }: BlogPageProps) {
  const { locale, subdomain } = await params;
  const { page, tag, category: categoryId } = parseQuery(await searchParams);
  const store = await resolveStorefront(subdomain);
  // Website offline: the layout shows the offline page instead.
  if (await isStoreOfflineForRequest(store)) return null;
  const [t, categories, tags] = await Promise.all([
    getTranslations({ locale, namespace: "storefrontBlog" }),
    getCachedBlogCategories(store.id, store.storeId),
    getCachedBlogTags(store.id, store.storeId),
  ]);
  const category = categoryId ? (categories.find((c) => c.id === categoryId) ?? null) : null;
  const list = await getCachedBlogPage(store.id, store.storeId, page, tag, category?.id ?? null);
  const totalPages = Math.max(1, Math.ceil(list.total / BLOG_PAGE_SIZE));
  if (page > totalPages) notFound();
  const posts = list.items.map((item) => toContentSummary(item));
  const minutesLabel = (n: number) => t("minutesRead", { n });

  return (
    <div className={`${s.wrap} py-10 md:py-14`}>
      <header className="mb-8 space-y-2">
        <h1 className="text-balance text-3xl font-bold md:text-4xl">
          {tag ? t("tagTitle", { tag }) : category ? t("categoryTitle", { name: category.name }) : t("title")}
        </h1>
        <p className="text-pretty text-(--sf-muted)">{t("description", { store: store.displayName })}</p>
      </header>

      {categories.length > 0 && (
        <nav aria-label={t("categories")} className="mb-4 flex flex-wrap gap-2">
          <Link
            href={blogHref(1, tag)}
            aria-current={!category ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${!category ? "border-(--sf-brand) bg-(--sf-brand) text-(--sf-brand-ink)" : "border-(--sf-line)"}`}
          >
            {t("allCategories")}
          </Link>
          {categories.map((value) => (
            <Link
              key={value.id}
              href={blogHref(1, tag, value.id)}
              aria-current={category?.id === value.id ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm font-semibold ${category?.id === value.id ? "border-(--sf-brand) bg-(--sf-brand) text-(--sf-brand-ink)" : "border-(--sf-line)"}`}
            >
              {value.name}
            </Link>
          ))}
        </nav>
      )}

      {tags.length > 0 && (
        <nav aria-label={t("tags")} className="mb-8 flex flex-wrap gap-2">
          <Link
            href={blogHref(1, null, category?.id ?? null)}
            aria-current={!tag ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${!tag ? "border-(--sf-brand) bg-(--sf-brand) text-(--sf-brand-ink)" : "border-(--sf-line)"}`}
          >
            {t("allTags")}
          </Link>
          {tags.map(({ tag: value }) => (
            <Link
              key={value}
              href={blogHref(1, value, category?.id ?? null)}
              aria-current={tag === value ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm ${tag === value ? "border-(--sf-brand) bg-(--sf-brand) text-(--sf-brand-ink)" : "border-(--sf-line)"}`}
            >
              {value}
            </Link>
          ))}
        </nav>
      )}

      {posts.length === 0 ? (
        <p className="rounded-(--sf-radius,12px) border border-dashed border-(--sf-line) p-10 text-center text-sm text-(--sf-muted)">
          {tag ? t("emptyTag") : category ? t("emptyCategory") : t("empty")}
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <li key={post.id}>
              <PostCard post={post} locale={locale} minutesLabel={minutesLabel} eager={index < 3} />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-between gap-3 text-sm" aria-label={t("pageOf", { page, total: totalPages })}>
          {page > 1 ? (
            <Link href={blogHref(page - 1, tag, category?.id ?? null)} rel="prev" className="rounded-(--sf-radius,12px) border border-(--sf-line) px-4 py-2 font-semibold">
              {t("previous")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-(--sf-muted)">{t("pageOf", { page, total: totalPages })}</span>
          {page < totalPages ? (
            <Link href={blogHref(page + 1, tag, category?.id ?? null)} rel="next" className="rounded-(--sf-radius,12px) border border-(--sf-line) px-4 py-2 font-semibold">
              {t("next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
