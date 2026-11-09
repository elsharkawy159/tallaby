import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { ArticleToc, PriceCalculator, ReadingProgress, ShareBar } from "@/components/marketing/blog/article-tools.client";
import { ForwardChevron } from "@/components/marketing/site/direction-icons";
import { JsonLd } from "@/components/marketing/site/json-ld";
import { Container } from "@/components/marketing/site/layout-primitives";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { ArticleHtml } from "@/components/marketing/blog/article-html";
import { isOptimizableImage } from "@/lib/marketing/blog.lib";
import { getMarketingPost, getMarketingPosts } from "@/lib/marketing/blog.server";
import { getMarketingEgpPerUsd, getMarketingPriceVars } from "@/lib/marketing/exchange-rate.server";
import { PLAN_PRICES, PRICE_TOKENS, usdCentsToEgp } from "@/lib/marketing/pricing.lib";
import { withPrices } from "@/components/marketing/pricing/with-prices";
import { formatLongDate } from "@/lib/marketing/format.lib";
import { localizedUrl, pageMetadata } from "@/lib/marketing/metadata.lib";
import { breadcrumbSchema } from "@/lib/marketing/structured-data.lib";
import { SITE_URL } from "@/lib/marketing/site.lib";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * One blog post. Posts come from the admin-written platform blog when it has any
 * for this locale, otherwise from the static list (lib/marketing/blog.server.ts),
 * so slugs are resolved on demand and cached with the posts' cache tags.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getMarketingPost(locale, slug);
  if (!post) return {};
  const base = await pageMetadata({ locale, page: "blog", path: `/blog/${slug}` });
  const title = post.seo?.title || post.title;
  const description = post.seo?.description || post.excerpt;
  const image = post.seo?.ogImage || post.image;
  const languages = post.langs?.length
    ? {
        ...Object.fromEntries(post.langs.map((l) => [l, localizedUrl(l, `/blog/${slug}`)])),
        "x-default": localizedUrl(post.langs.includes(routing.defaultLocale) ? routing.defaultLocale : post.langs[0]!, `/blog/${slug}`),
      }
    : base.alternates?.languages;
  return {
    ...base,
    title,
    description,
    alternates: { canonical: base.alternates?.canonical, languages },
    // A post without a body is only its excerpt: keep it out of search results.
    robots: post.seo?.noindex || !post.hasArticle ? { index: false, follow: true } : undefined,
    openGraph: {
      ...base.openGraph,
      type: "article",
      title,
      description,
      publishedTime: post.date,
      modifiedTime: post.updatedAt,
      tags: post.tags,
      images: [{ url: image }],
      // A one-language post has no other language to advertise.
      alternateLocale: post.langs?.length === 1 ? undefined : base.openGraph?.alternateLocale,
    },
    twitter: { ...base.twitter, title, description, images: [image] },
  };
}

const SECTION_IDS = ["s1", "s2", "s3", "s4"] as const;

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = await getMarketingPost(locale, slug);
  if (!post) notFound();

  const [t, tc, tm, posts] = await Promise.all([getTranslations("blog"), getTranslations("common"), getTranslations("meta"), getMarketingPosts(locale)]);
  const title = post.title;
  const author = post.authorName || t("author");
  const related = posts.filter((p) => p.id !== post.id).slice(0, 3);
  const staticArticle = post.source === "static" && post.hasArticle;
  const toc = SECTION_IDS.map((id) => ({ id, label: t(`article.${id}`).replace(/^\d+\.\s*/, "") }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: post.excerpt,
    image: [post.image.startsWith("/") ? localizedUrl(routing.defaultLocale, post.image) : post.image],
    datePublished: post.date,
    dateModified: post.updatedAt ?? post.date,
    inLanguage: locale,
    author: post.authorName ? { "@type": "Person", name: post.authorName } : { "@type": "Organization", name: t("author") },
    publisher: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: t("author"), logo: { "@type": "ImageObject", url: localizedUrl(routing.defaultLocale, "/logo-mark.png") } },
    mainEntityOfPage: localizedUrl(locale, `/blog/${post.id}`),
  };
  const breadcrumbs = breadcrumbSchema([
    { name: tm("siteName"), url: localizedUrl(locale, "/") },
    { name: tm("blog.title"), url: localizedUrl(locale, "/blog") },
    { name: title, url: localizedUrl(locale, `/blog/${post.id}`) },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ReadingProgress targetId="article" />

      <div className="pt-11 sm:pt-14">
        <Container>
          <nav aria-label={t("post.breadcrumb")} className="mb-[26px] flex items-center gap-2 text-[13px] text-ink-400">
            <Link href="/blog" className="font-semibold text-teal-700">
              {t("index.eyebrow")}
            </Link>
            <ForwardChevron />
            <span aria-current="page">{t(`categories.${post.category}`)}</span>
          </nav>
          <h1 className="max-w-[900px] text-[clamp(32px,4.6vw,56px)] leading-[1.35] font-bold text-balance text-teal-900 en:leading-[1.08] en:tracking-[-0.03em]">{title}</h1>
          {post.excerpt ? <p className="mt-[18px] max-w-[700px] text-[19px] text-pretty text-[#56696e]">{post.excerpt}</p> : null}
          <div className="mt-7 mb-10 flex flex-wrap items-center gap-3 text-sm text-ink-400">
            <Image src="/logo-mark.png" alt="" width={40} height={40} className="size-10 rounded-xl bg-white" />
            <div>
              <b className="block text-teal-900">{author}</b>
              <time dateTime={post.date}>{formatLongDate(post.date, locale)}</time>
            </div>
            {post.hasArticle ? (
              <>
                <i aria-hidden className="block size-1 rounded-full bg-teal-100" />
                <span>{tc("minRead", { minutes: post.minutes })}</span>
              </>
            ) : null}
          </div>
          <div className="relative h-[clamp(240px,40vw,480px)] overflow-hidden rounded-[20px] shadow-[0_24px_60px_rgba(13,55,67,0.14)] md:rounded-card-lg">
            <Image
              src={post.image}
              alt={title}
              fill
              priority
              unoptimized={!isOptimizableImage(post.image)}
              sizes="(min-width: 1240px) 1192px, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      </div>

      <Container className="grid gap-14 py-14 pb-20 md:grid-cols-[minmax(0,1fr)_220px] lg:grid-cols-[200px_minmax(0,700px)_1fr]">
        <ShareBar title={title} />
        <article id="article" className="order-first text-[17px] leading-[1.95] text-[#2a3a3f] md:text-lg en:leading-[1.75] lg:order-none">
          {staticArticle ? <PricingArticle locale={locale} /> : post.html ? <ArticleHtml html={post.html} /> : <p>{post.excerpt}</p>}
          <div className="mt-12 flex flex-wrap items-center gap-5 rounded-card border border-line bg-white p-6 leading-normal shadow-soft">
            <Image src="/logo-mark.png" alt="" width={56} height={56} className="size-14 rounded-[14px]" />
            <div className="min-w-[200px] flex-1">
              <b className="block text-[17px] text-teal-900">{t("post.ctaTitle")}</b>
              <span className="text-sm text-slate-ink">{withPrices(t("post.ctaBody", PRICE_TOKENS))}</span>
            </div>
            <SignupTrigger />
          </div>
        </article>
        {staticArticle ? <ArticleToc title={t("post.inArticle")} sections={toc} /> : <div />}
      </Container>

      {related.length ? (
        <section className="border-t border-line pt-16 pb-20">
          <Container>
            <h2 className="mb-11 text-[28px] font-bold text-teal-900">{t("post.keepReading")}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((p) => (
                <Link key={p.id} href={`/blog/${p.id}`} className="grid gap-2.5 text-inherit hover:no-underline">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[20px]">
                    <Image src={p.image} alt="" fill sizes="(min-width: 768px) 400px, 100vw" unoptimized={!isOptimizableImage(p.image)} className="object-cover" />
                  </div>
                  <span className="text-[13px] text-neutral-600">{t(`categories.${p.category}`)}</span>
                  <b className="text-[17px] leading-[1.4] text-teal-900">{p.title}</b>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}

/** "How to price your products for online sales". */
async function PricingArticle({ locale }: { locale: string }) {
  const [t, prices, rate] = await Promise.all([getTranslations("blog.article"), getMarketingPriceVars(locale), getMarketingEgpPerUsd()]);
  const h2 = "mt-12 mb-4 scroll-mt-[100px] text-[28px] leading-[1.35] font-bold text-teal-900 en:leading-[1.2] en:tracking-[-0.02em]";

  return (
    <>
      <p className="mb-[22px] first-letter:float-start first-letter:me-3 first-letter:mt-1.5 first-letter:font-latin first-letter:text-[64px] first-letter:leading-none first-letter:font-extrabold first-letter:text-amber-600">
        {t("lede")}
      </p>
      <h2 id="s1" className={h2}>
        {t("s1")}
      </h2>
      <p className="mb-[22px]">{t("s1Body")}</p>
      <h2 id="s2" className={h2}>
        {t("s2")}
      </h2>
      <ul className="mb-[22px] grid list-disc gap-2 ps-[22px]">
        {(t.raw("s2List") as string[]).map((item) => (
          <li key={item}>{withPrices(item)}</li>
        ))}
      </ul>
      {/* The calculator works in pounds, so its note quotes the fee in pounds too. */}
      <PriceCalculator feeEgp={usdCentsToEgp(PLAN_PRICES.free.orderFeeCents, rate)} body={t("toolBody", prices)} />
      <h2 id="s3" className={h2}>
        {t("s3")}
      </h2>
      <p className="mb-[22px]">{t("s3Body")}</p>
      <blockquote className="relative my-10 pt-10 text-[clamp(22px,2.6vw,30px)] leading-[1.5] font-bold text-teal-900 before:absolute before:-top-6 before:start-0 before:font-latin before:text-[96px] before:leading-none before:font-extrabold before:text-amber-600 before:content-['“']">
        {t("quote")}
      </blockquote>
      <h2 id="s4" className={h2}>
        {t("s4")}
      </h2>
      <p className="mb-[22px]">{t("s4Body")}</p>
      <div className="my-7 flex gap-3 rounded-2xl bg-amber-50 px-5 py-[18px] text-base text-amber-ink">
        <Lightbulb className="mt-1.5 size-[18px] flex-none text-[#8a5300]" aria-hidden />
        <span>{t("tip")}</span>
      </div>
    </>
  );
}
