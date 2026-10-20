import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { storeUrl } from "@workspace/lib/storefront";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { toContentSummary } from "@/lib/store-cms/cms.lib";
import { BLOG_PAGE_SIZE, getCachedBlogPage, getCachedBlogTags } from "@/lib/store-cms/cms.server";
import { resolveStorefront } from "@/lib/storefront.server";
import {
  isStoreOfflineForRequest,
  isSubdomainOfflineForRequest,
  STORE_OFFLINE_METADATA,
} from "@/lib/store-site/offline.server";
import { PostCard } from "../_components/store-content";
import s from "../storefront.module.css";

type BlogPageProps = {
  params: Promise<{ locale: string; subdomain: string }>;
  searchParams: Promise<{ page?: string | string[]; tag?: string | string[] }>;
};

/**
 * The store blog, /blog on a store host (PLAN.md §8.9, P4-16): published,
 * due posts of this store only, newest first, paginated, with a tag filter.
 * Chrome and theme come from the storefront layout.
 */
function parseQuery(query: Awaited<BlogPageProps["searchParams"]>) {
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const rawTag = Array.isArray(query.tag) ? query.tag[0] : query.tag;
  const page = Math.min(Math.max(Number.parseInt(rawPage ?? "1", 10) || 1, 1), 1000);
  const tag = rawTag?.trim().toLowerCase().slice(0, 40) || null;
  return { page, tag };
}

function blogHref(page: number, tag: string | null) {
  const params = new URLSearchParams();
  if (tag) params.set("tag", tag);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

export async function generateMetadata({ params, searchParams }: BlogPageProps): Promise<Metadata> {
  const { locale, subdomain } = await params;
  if (await isSubdomainOfflineForRequest(subdomain)) return STORE_OFFLINE_METADATA;
  const { page, tag } = parseQuery(await searchParams);
  const [store, t] = await Promise.all([resolveStorefront(subdomain), getTranslations({ locale, namespace: "storefrontBlog" })]);
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const url = `${storeUrl(store.subdomain, store.customDomain)}${prefix}/blog`;
  return {
    title: tag ? t("tagTitle", { tag }) : t("title"),
    description: t("description", { store: store.displayName }),
    alternates: { canonical: url },
    // Filtered and deeper pages are crawlable but not indexed (the sitemap lists /blog and every post).
    robots: tag || page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function StoreBlogPage({ params, searchParams }: BlogPageProps) {
  const { locale, subdomain } = await params;
  const { page, tag } = parseQuery(await searchParams);
  const store = await resolveStorefront(subdomain);
  // Website offline: the layout shows the offline page instead.
  if (await isStoreOfflineForRequest(store)) return null;
  const [t, list, tags] = await Promise.all([
    getTranslations({ locale, namespace: "storefrontBlog" }),
    getCachedBlogPage(store.id, store.storeId, page, tag),
    getCachedBlogTags(store.id, store.storeId),
  ]);
  const totalPages = Math.max(1, Math.ceil(list.total / BLOG_PAGE_SIZE));
  if (page > totalPages) notFound();
  const posts = list.items.map((item) => toContentSummary(item));
  const minutesLabel = (n: number) => t("minutesRead", { n });

  return (
    <div className={`${s.wrap} py-10 md:py-14`}>
      <header className="mb-8 space-y-2">
        <h1 className="text-balance text-3xl font-bold md:text-4xl">{tag ? t("tagTitle", { tag }) : t("title")}</h1>
        <p className="text-pretty text-(--sf-muted)">{t("description", { store: store.displayName })}</p>
      </header>

      {tags.length > 0 && (
        <nav aria-label={t("tags")} className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            aria-current={!tag ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${!tag ? "border-(--sf-brand) bg-(--sf-brand) text-(--sf-brand-ink)" : "border-(--sf-line)"}`}
          >
            {t("allTags")}
          </Link>
          {tags.map(({ tag: value }) => (
            <Link
              key={value}
              href={blogHref(1, value)}
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
          {tag ? t("emptyTag") : t("empty")}
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
            <Link href={blogHref(page - 1, tag)} rel="prev" className="rounded-(--sf-radius,12px) border border-(--sf-line) px-4 py-2 font-semibold">
              {t("previous")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-(--sf-muted)">{t("pageOf", { page, total: totalPages })}</span>
          {page < totalPages ? (
            <Link href={blogHref(page + 1, tag)} rel="next" className="rounded-(--sf-radius,12px) border border-(--sf-line) px-4 py-2 font-semibold">
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
