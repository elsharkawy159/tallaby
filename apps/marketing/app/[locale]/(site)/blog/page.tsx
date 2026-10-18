import type { Metadata } from "next";
import Image from "next/image";
import { Mail } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BlogIndex } from "@/components/blog/blog-index.client";
import { NewsletterForm } from "@/components/blog/newsletter-form.client";
import { PostMeta } from "@/components/blog/post-meta";
import { CtaButton } from "@/components/site/cta-button";
import { ForwardArrow } from "@/components/site/direction-icons";
import { Container, Eyebrow, Section } from "@/components/site/layout-primitives";
import { Reveal } from "@/components/site/reveal.client";
import { richTags } from "@/components/site/rich-text";
import { BLOG_POSTS } from "@/lib/blog.data";
import { pageMetadata } from "@/lib/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "blog", path: "/blog" });
}

export default async function BlogPage() {
  const t = await getTranslations("blog");
  const locale = await getLocale();
  const featured = BLOG_POSTS[0]!;

  return (
    <>
      <section className="relative overflow-hidden bg-teal-900 pt-16 pb-[72px] text-white">
        <div aria-hidden className="hero-glow pointer-events-none absolute inset-0" />
        <Container className="relative">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>{t("index.eyebrow")}</Eyebrow>
              <h1 className="display-tight text-[clamp(40px,6vw,80px)] leading-[1.22] font-extrabold en:leading-[1.05]">
                {t.rich("index.title", richTags)}
              </h1>
              <p className="mt-2.5 max-w-[560px] text-base text-mist sm:text-lg">{t("index.lead")}</p>
            </div>
            <CtaButton asChild tone="ghost">
              <a href="#news">
                <Mail />
                {t("index.byEmail")}
              </a>
            </CtaButton>
          </div>

          <Link
            href={`/blog/${featured.id}`}
            className="grid overflow-hidden rounded-3xl bg-white text-body transition-transform duration-200 hover:-translate-y-1 hover:no-underline lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
          >
            <div className="relative min-h-60 lg:min-h-[380px]">
              <Image src={featured.image} alt="" fill priority sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />
              <span className="absolute start-[18px] top-[18px] rounded-full bg-amber-600 px-3 py-[5px] text-xs font-bold text-teal-900">
                {t("index.featured")}
              </span>
            </div>
            <div className="flex flex-col justify-center gap-3.5 p-[26px] lg:p-11">
              <PostMeta post={featured} locale={locale} />
              <h2 className="text-[clamp(24px,2.8vw,36px)] leading-[1.3] font-extrabold text-teal-900 en:leading-[1.15] en:tracking-[-0.02em]">
                {t(`posts.${featured.id}.title`)}
              </h2>
              <p className="text-base text-slate-ink">{t(`posts.${featured.id}.excerpt`)}</p>
              <span className="mt-2 flex items-center gap-1.5 font-bold text-teal-700">
                {t("index.read")}
                <ForwardArrow />
              </span>
            </div>
          </Link>
        </Container>
      </section>

      <Section>
        <Container>
          <BlogIndex />
        </Container>
      </Section>

      <section id="news" className="pb-24">
        <Container>
          <Reveal className="relative grid items-center gap-10 overflow-hidden rounded-[28px] bg-teal-900 p-[26px] text-white md:p-14 lg:grid-cols-2">
            <div aria-hidden className="absolute -top-40 size-[360px] rounded-full border-[56px] border-amber-600/10 ltr:-right-[120px] rtl:-left-[120px]" />
            <div className="relative">
              <h2 className="text-[clamp(26px,3vw,38px)] leading-[1.3] font-extrabold">{t("index.newsTitle")}</h2>
              <p className="mt-2.5 text-mist">{t("index.newsBody")}</p>
            </div>
            <NewsletterForm />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
