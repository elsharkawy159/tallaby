import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CtaButton } from "@/components/site/cta-button";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/site/layout-primitives";
import { Reveal } from "@/components/site/reveal.client";
import { richTags } from "@/components/site/rich-text";
import { pageMetadata } from "@/lib/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "about", path: "/about" });
}

const MOSAIC = ["/banner2.jpg", "/banner3.jpg", "/banner4.jpg"];

export default async function AboutPage() {
  const t = await getTranslations("about");
  const principles = [1, 2, 3, 4].map((n) => ({ title: t(`p${n}`), body: t(`p${n}Body`) }));
  const facts = [
    { value: "2026", label: t("f1"), latin: true },
    { value: t("f2Value"), label: t("f2") },
    { value: "24/7", label: t("f3"), latin: true },
    { value: "2", label: t("f4"), latin: true },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-teal-900 pt-24 text-white">
        <div aria-hidden className="hero-glow pointer-events-none absolute inset-0" />
        <Container className="relative">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="display-tight max-w-[1000px] text-[clamp(40px,7vw,96px)] leading-[1.15] font-extrabold en:leading-none en:tracking-[-0.04em]">
            {t.rich("title", richTags)}
          </h1>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-10 pb-16">
            <p className="max-w-[520px] text-lg text-mist">{t("lead")}</p>
            <div className="flex items-center gap-4 text-sm text-mist">
              <b className="font-noto-kufi-arabic text-[44px] leading-none font-extrabold text-white">طلبي</b>
              <span className="border-s border-white/20 ps-4 leading-normal">{t.rich("word", richTags)}</span>
            </div>
          </div>
          <div className="relative z-[1] -mb-[120px] grid grid-cols-2 gap-3.5 sm:h-60 sm:grid-cols-[2fr_1fr_1.3fr] lg:h-[340px]">
            {MOSAIC.map((src, i) => (
              <div key={src} className={`relative h-40 overflow-hidden rounded-[20px] sm:h-auto ${i === 0 ? "col-span-2 sm:col-span-1" : ""}`}>
                <Image src={src} alt={t("photo")} fill sizes="(min-width: 640px) 40vw, 100vw" className="object-cover" priority={i === 0} />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="pt-[200px] pb-24">
        <Container className="grid gap-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <Reveal>
            <span className="block text-[13px] font-bold text-amber-700 en:text-xs en:tracking-[0.1em] en:uppercase">{t("storyKicker")}</span>
          </Reveal>
          <Reveal>
            <p className="text-[clamp(22px,2.4vw,30px)] leading-[1.6] font-semibold text-teal-900 en:leading-[1.4] en:tracking-[-0.01em]">
              {t.rich("story", {
                em: (chunks) => <em className="bg-[linear-gradient(transparent_62%,var(--color-amber-100)_62%)] not-italic">{chunks}</em>,
              })}
            </p>
            <div className="mt-9 grid gap-7 text-[15px] text-slate-ink sm:grid-cols-2">
              <p>{t("story1")}</p>
              <p>{t("story2")}</p>
            </div>
          </Reveal>
        </Container>
      </section>

      <Section className="pt-0 md:pt-0">
        <Container>
          <Reveal>
            <SectionHeading kicker={t("principlesKicker")} title={t("principlesTitle")} />
          </Reveal>
          <ol className="m-0 list-none p-0">
            {principles.map((p, i) => (
              <Reveal
                as="li"
                key={p.title}
                className="group grid grid-cols-[70px_1fr] items-baseline gap-x-5 gap-y-3 border-t border-neutral-200 py-9 last:border-b lg:grid-cols-[120px_minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-8"
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

      <Section className="bg-teal-900 text-white">
        <Container className="grid grid-cols-2 gap-7 lg:grid-cols-4 lg:gap-0">
          {facts.map((f, i) => (
            <Reveal key={f.label} className={i === 0 ? "" : "lg:border-s lg:border-white/10 lg:px-7"}>
              <b className={`block text-[clamp(36px,4vw,52px)] leading-[1.1] font-extrabold tracking-[-0.03em] text-amber-600 ${f.latin ? "font-latin" : ""}`}>
                {f.value}
              </b>
              <span className="text-sm text-mist">{f.label}</span>
            </Reveal>
          ))}
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal className="grid items-center gap-8 rounded-3xl border border-neutral-200 bg-white p-[26px] sm:grid-cols-[minmax(0,1fr)_auto] sm:p-10">
            <div>
              <h3 className="text-2xl font-bold text-teal-900">{t("hiring")}</h3>
              <p className="mt-1.5 text-slate-ink">{t("hiringBody")}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <CtaButton asChild tone="teal">
                <Link href="/careers">{t("roles")}</Link>
              </CtaButton>
              <CtaButton asChild tone="outline">
                <Link href="/contact">{t("hello")}</Link>
              </CtaButton>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
