import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { Container, Eyebrow, Kicker, Ltr, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { SiteCard } from "@/components/marketing/site/site-card";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "about", path: "/about" });
}

/** Product-only photos (no people), decorative. */
const MOSAIC = ["/accessories.jpg", "/cosmetics.jpg", "/fashion.png"];

export default async function AboutPage() {
  const t = await getTranslations("about");
  const principles = [1, 2, 3, 4].map((n) => ({ title: t(`p${n}`), body: t(`p${n}Body`) }));
  const facts = [
    { value: "2026", label: t("f1"), latin: true },
    { value: t("f2Value"), label: t("f2") },
    { value: "$0.03", label: t("f3"), latin: true },
    { value: "2", label: t("f4"), latin: true },
  ];

  return (
    <>
      <section className="pt-11 sm:pt-20">
        <Container>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="max-w-[1000px] text-[clamp(40px,6.4vw,84px)] leading-[1.2] font-bold text-balance text-teal-900 en:leading-none en:tracking-[-0.04em]">
            {t.rich("title", {
              ...richTags,
              u: (chunks: ReactNode) => <span className="text-amber-700 sm:whitespace-nowrap">{chunks}</span>,
            })}
          </h1>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-10 pb-16">
            <p className="max-w-[520px] text-lg text-pretty text-[#56696e]">{t("lead")}</p>
            <div className="flex items-center gap-4 text-sm text-ink-500">
              <b className="font-noto-kufi-arabic text-[44px] leading-none font-bold text-teal-900">طلبي</b>
              <span className="border-s border-line-strong ps-4 leading-normal">{t.rich("word", richTags)}</span>
            </div>
          </div>
          <div aria-hidden className="relative z-[1] -mb-[120px] grid grid-cols-2 gap-3.5 sm:h-60 sm:grid-cols-[2fr_1fr_1.3fr] lg:h-[340px]">
            {MOSAIC.map((src, i) => (
              <div
                key={src}
                className={`relative h-40 overflow-hidden rounded-card bg-[#f4efe6] shadow-[0_20px_50px_rgba(13,55,67,0.12)] sm:h-auto ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`}
              >
                <Image src={src} alt="" fill sizes="(min-width: 640px) 40vw, 100vw" className="object-cover" priority={i === 0} />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="pt-[200px] pb-14 min-[861px]:pb-[72px]">
        <Container className="grid gap-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <Reveal>
            <Kicker>{t("storyKicker")}</Kicker>
          </Reveal>
          <Reveal>
            <p className="text-[clamp(22px,2.4vw,30px)] leading-[1.6] font-semibold text-teal-900 en:leading-[1.4] en:tracking-[-0.01em]">
              {t.rich("story", {
                em: (chunks) => <em className="bg-[linear-gradient(transparent_62%,var(--color-amber-100)_62%)] not-italic">{chunks}</em>,
              })}
            </p>
            <p className="mt-9 text-[15px] text-slate-ink">{t("story2")}</p>
          </Reveal>
        </Container>
      </section>

      <Section className="pt-0 min-[861px]:pt-0">
        <Container>
          <Reveal>
            <SectionHeading kicker={t("principlesKicker")} title={t("principlesTitle")} />
          </Reveal>
          <ol className="m-0 list-none p-0">
            {principles.map((p, i) => (
              <Reveal
                as="li"
                key={p.title}
                className="group grid grid-cols-[70px_1fr] items-baseline gap-x-5 gap-y-3 border-t border-line py-9 last:border-b lg:grid-cols-[120px_minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-8"
              >
                <span className="row-span-2 font-latin text-[40px] leading-none font-extrabold tracking-[-0.04em] text-teal-100 transition-colors group-hover:text-amber-600 lg:row-span-1 lg:text-[56px]">
                  0{i + 1}
                </span>
                <h3 className="text-2xl leading-[1.35] font-bold text-teal-900">{p.title}</h3>
                <p className="text-base text-slate-ink">{p.body}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      <section>
        <Container>
          <div className="cta-glow relative grid grid-cols-2 gap-7 overflow-hidden rounded-[28px] bg-teal-900 px-6 py-8 text-white min-[861px]:rounded-band lg:grid-cols-4 lg:gap-0 lg:px-10 lg:py-12">
            {facts.map((f, i) => (
              <Reveal key={f.label} className={`relative ${i === 0 ? "" : "lg:border-s lg:border-white/10 lg:px-7"}`}>
                <b className={`block text-[clamp(36px,4vw,52px)] leading-[1.1] font-extrabold tracking-[-0.03em] text-amber-600 ${f.latin ? "font-latin" : ""}`}>
                  {f.latin ? <Ltr>{f.value}</Ltr> : f.value}
                </b>
                <span className="text-sm text-ink-on-dark">{f.label}</span>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <Reveal>
            <SiteCard size="lg" glass className="grid items-center gap-8 p-[26px] sm:grid-cols-[minmax(0,1fr)_auto] sm:p-10">
              <div>
                <h2 className="text-2xl font-bold text-teal-900">{t("hiring")}</h2>
                <p className="mt-1.5 text-slate-ink">{t("hiringBody")}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <CtaButton asChild tone="dark">
                  <Link href="/careers">{t("roles")}</Link>
                </CtaButton>
                <CtaButton asChild tone="outline">
                  <Link href="/contact">{t("hello")}</Link>
                </CtaButton>
              </div>
            </SiteCard>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
