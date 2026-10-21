import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { storeUrl } from "@workspace/lib/storefront";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { cmsImageUrl, toContentSummary } from "@/lib/store-cms/cms.lib";
import { getCachedBlogPage, getCachedCmsItem } from "@/lib/store-cms/cms.server";
import { resolveStorefront } from "@/lib/storefront.server";
import { isSubdomainOfflineForRequest, STORE_OFFLINE_METADATA } from "@/lib/store-site/offline.server";
import { ArticleBody, ContentImage, JsonLd, PostCard, PostMeta } from "../../_components/store-content";
import s from "../../storefront.module.css";

type BlogPostProps = {
  params: Promise<{ locale: string; subdomain: string; postSlug: string }>;
};

/**
 * One blog post, /blog/{slug} on a store host (PLAN.md §8.9, P4-16). Only a
 * published, due post of the host's store resolves; drafts, scheduled posts
 * and other stores' slugs are a 404.
 */
async function loadPost(subdomain: string, postSlug: string) {
  const store = await resolveStorefront(subdomain);
  const item = await getCachedCmsItem(store.id, store.storeId, "blog", postSlug);
  if (!item) notFound();
  return { store, item, post: toContentSummary(item) };
}

function postUrl(base: string, locale: string, slug: string) {
  return `${base}${locale === routing.defaultLocale ? "" : `/${locale}`}/blog/${slug}`;
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { locale, subdomain, postSlug } = await params;
  if (await isSubdomainOfflineForRequest(subdomain)) return STORE_OFFLINE_METADATA;
  const { store, item, post } = await loadPost(subdomain, postSlug);
  const url = postUrl(storeUrl(store.subdomain, store.customDomain), locale, item.slug);
  const image = cmsImageUrl(item.seo.ogImage || post.image);
  const title = item.seo.title || post.title;
  const description = item.seo.description || post.excerpt || undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: item.seo.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: store.displayName,
      publishedTime: item.publishedAt,
      modifiedTime: item.updatedAt,
      authors: post.authorName ? [post.authorName] : undefined,
      tags: post.tags,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : undefined },
  };
}

export default async function StoreBlogPostPage({ params }: BlogPostProps) {
  const { locale, subdomain, postSlug } = await params;
  // Website offline: the layout shows the offline page instead.
  if (await isSubdomainOfflineForRequest(subdomain)) return null;
  const { store, item, post } = await loadPost(subdomain, postSlug);
  const [t, recent] = await Promise.all([
    getTranslations({ locale, namespace: "storefrontBlog" }),
    getCachedBlogPage(store.id, store.storeId, 1, null),
  ]);
  const base = storeUrl(store.subdomain, store.customDomain);
  const url = postUrl(base, locale, item.slug);
  const image = cmsImageUrl(item.seo.ogImage || post.image);
  const minutesLabel = (n: number) => t("minutesRead", { n });
  const more = recent.items
    .filter((other) => other.id !== item.id)
    .slice(0, 3)
    .map((other) => toContentSummary(other));

  const articleLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title.slice(0, 110),
    description: item.seo.description || post.excerpt || undefined,
    image: image ? [image] : undefined,
    datePublished: item.publishedAt,
    dateModified: item.updatedAt,
    inLanguage: locale,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    keywords: post.tags?.length ? post.tags.join(", ") : undefined,
    author: post.authorName ? { "@type": "Person", name: post.authorName } : { "@type": "Organization", name: store.displayName, url: base },
    publisher: {
      "@type": "Organization",
      name: store.displayName,
      url: base,
      ...(cmsImageUrl(store.logoUrl) && { logo: { "@type": "ImageObject", url: cmsImageUrl(store.logoUrl) } }),
    },
  };

  return (
    <article className={`${s.wrap} py-10 md:py-14`}>
      <JsonLd data={articleLd} />
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-sm font-semibold text-(--sf-brand)">
          {t("backToBlog")}
        </Link>
        <header className="mt-4 space-y-3">
          <PostMeta post={post} locale={locale} minutesLabel={minutesLabel} />
          <h1 className="text-balance text-3xl font-bold leading-tight md:text-4xl">{post.title}</h1>
          {post.excerpt && <p className="text-pretty text-lg leading-relaxed text-(--sf-muted)">{post.excerpt}</p>}
          {post.authorName && <p className="text-sm text-(--sf-muted)">{t("by", { author: post.authorName })}</p>}
        </header>
        {post.image && (
          <div className="mt-8 aspect-[16/9] overflow-hidden rounded-(--sf-radius,12px) bg-(--sf-shelf)">
            <ContentImage src={post.image} alt={post.title} className="size-full" eager sizes="(min-width: 768px) 768px, 100vw" />
          </div>
        )}
        <ArticleBody html={item.data.body as string | undefined} className="mt-8" />
        {post.tags && post.tags.length > 0 && (
          <nav aria-label={t("tags")} className="mt-10 flex flex-wrap gap-2 border-t border-(--sf-line) pt-6">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="rounded-full border border-(--sf-line) px-3 py-1 text-sm">
                {tag}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {more.length > 0 && (
        <section className="mt-14 border-t border-(--sf-line) pt-10">
          <h2 className="mb-6 text-2xl font-bold">{t("morePosts")}</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((other) => (
              <li key={other.id}>
                <PostCard post={other} locale={locale} minutesLabel={minutesLabel} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
