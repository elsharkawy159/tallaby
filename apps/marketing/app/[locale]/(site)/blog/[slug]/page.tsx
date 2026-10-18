import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArticleToc, PriceCalculator, ReadingProgress, ShareBar } from "@/components/blog/article-tools.client";
import { PostMeta } from "@/components/blog/post-meta";
import { ForwardChevron } from "@/components/site/direction-icons";
import { Container } from "@/components/site/layout-primitives";
import { SignupTrigger } from "@/components/signup/signup-trigger.client";
import { BLOG_POSTS, findPost } from "@/lib/blog.data";
import { formatLongDate } from "@/lib/format.lib";
import { localizedUrl, pageMetadata } from "@/lib/metadata.lib";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = findPost(slug);
  if (!post) return {};
  const t = await getTranslations({ locale, namespace: "blog" });
  const base = await pageMetadata({ locale, page: "blog", path: `/blog/${slug}` });
  const title = t(`posts.${slug}.title`);
  const description = t(`posts.${slug}.excerpt`);
  return {
    ...base,
    title,
    description,
    openGraph: { ...base.openGraph, type: "article", title, description, publishedTime: post.date, images: [{ url: post.image }] },
    twitter: { card: "summary_large_image", title, description },
  };
}

const SECTION_IDS = ["s1", "s2", "s3", "s4"] as const;

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const title = t(`posts.${post.id}.title`);
  const related = BLOG_POSTS.filter((p) => p !== post).slice(0, 3);
  const toc = SECTION_IDS.map((id) => ({ id, label: t(`article.${id}`).replace(/^\d+\.\s*/, "") }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: t(`posts.${post.id}.excerpt`),
    datePublished: post.date,
    inLanguage: locale,
    author: { "@type": "Organization", name: t("author") },
    mainEntityOfPage: localizedUrl(locale, `/blog/${post.id}`),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ReadingProgress targetId="article" />

      <div className="bg-teal-900 pt-14 text-white">
        <Container>
          <nav className="mb-[26px] flex items-center gap-2 text-[13px] text-haze">
            <Link href="/blog" className="text-[#c9d9dd]">
              {t("index.eyebrow")}
            </Link>
            <ForwardChevron />
            <span>{t(`categories.${post.category}`)}</span>
          </nav>
          <h1 className="display-tight max-w-[900px] text-[clamp(32px,4.6vw,56px)] leading-[1.3] font-extrabold en:leading-[1.08]">{title}</h1>
          <p className="mt-[18px] max-w-[700px] text-[19px] text-mist">{t(`posts.${post.id}.excerpt`)}</p>
          <div className="mt-7 mb-10 flex flex-wrap items-center gap-3 text-sm text-mist">
            <Image src="/logo-mark.png" alt="" width={40} height={40} className="size-10 rounded-xl bg-white" />
            <div>
              <b className="block text-white">{t("author")}</b>
              <time dateTime={post.date}>{formatLongDate(post.date, locale)}</time>
            </div>
          </div>
          <div className="relative h-[clamp(240px,40vw,480px)] overflow-hidden rounded-t-[18px] md:rounded-t-3xl">
            <Image src={post.image} alt="" fill priority sizes="(min-width: 1240px) 1192px, 100vw" className="object-cover" />
          </div>
        </Container>
      </div>

      <Container className="grid gap-14 py-14 pb-20 md:grid-cols-[minmax(0,1fr)_220px] lg:grid-cols-[200px_minmax(0,700px)_1fr]">
        <ShareBar title={title} />
        <article id="article" className="order-first text-[17px] leading-[1.95] text-[#2a3a3f] md:text-lg en:leading-[1.75] lg:order-none">
          <PostMeta post={post} locale={locale} className="mb-6" />
          {post.hasArticle ? <PricingArticle /> : <p>{t(`posts.${post.id}.excerpt`)}</p>}
          <div className="mt-12 flex flex-wrap items-center gap-5 rounded-[20px] border border-neutral-200 bg-white p-6 leading-normal">
            <Image src="/logo-mark.png" alt="" width={56} height={56} className="size-14 rounded-[14px]" />
            <div className="min-w-[200px] flex-1">
              <b className="block text-[17px] text-teal-900">{t("post.ctaTitle")}</b>
              <span className="text-sm text-slate-ink">{t("post.ctaBody")}</span>
            </div>
            <SignupTrigger />
          </div>
        </article>
        {post.hasArticle ? <ArticleToc title={t("post.inArticle")} sections={toc} /> : <div />}
      </Container>

      <section className="border-t border-neutral-200 pt-16 pb-24">
        <Container>
          <h2 className="mb-11 text-[28px] font-extrabold text-teal-900">{t("post.keepReading")}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <Link key={p.id} href={`/blog/${p.id}`} className="grid gap-2.5 text-inherit hover:no-underline">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[14px]">
                  <Image src={p.image} alt="" fill sizes="(min-width: 768px) 400px, 100vw" className="object-cover" />
                </div>
                <span className="text-[13px] text-neutral-600">{t(`categories.${p.category}`)}</span>
                <b className="text-[17px] leading-[1.4] text-teal-900">{t(`posts.${p.id}.title`)}</b>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

/** "How to price your products for online sales". */
async function PricingArticle() {
  const t = await getTranslations("blog.article");
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
          <li key={item}>{item}</li>
        ))}
      </ul>
      <PriceCalculator />
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
