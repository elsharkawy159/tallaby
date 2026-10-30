import type { Metadata } from "next";
import { ArrowUpRight, Banknote, Check, Infinity as InfinityIcon, Link2, Share2, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { FaqAccordion, type FaqEntry } from "@/components/marketing/site/faq-accordion";
import { Container, Num, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { PageHero } from "@/components/marketing/site/page-hero";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { DASHBOARD_URL } from "@/lib/marketing/site.lib";

/**
 * The Tallaby affiliate program on tallaby.com (ROADMAP.md F-37g): how it
 * works and its terms, as approved in F-37a
 * (docs/superpowers/specs/2026-10-29-affiliate-program-design.md). Sellers
 * get their link on the dashboard's "Earn with us" page (`/earn`).
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "affiliates", path: "/affiliates" });
}

/** The dashboard page with the seller's link (sign-in first when signed out). */
const EARN_URL = `${DASHBOARD_URL}earn`;

const STEP_ICONS = [Link2, Share2, InfinityIcon, Banknote];

export default async function AffiliatesPage() {
  const t = await getTranslations("affiliates");

  const steps = t.raw("how.steps") as { title: string; body: string }[];
  const terms = t.raw("terms.items") as string[];
  const faq = t.raw("faq.items") as { q: string; a: string }[];
  const card = [
    { icon: InfinityIcon, text: t("card.lifetime") },
    { icon: Banknote, text: t("card.cash") },
    { icon: Wallet, text: t("card.minimum") },
  ];

  // FAQPage structured data from the same answers shown on the page.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
  };

  const getLink = (tone: "amber" | "outline") => (
    <CtaButton asChild tone={tone}>
      <a href={EARN_URL}>
        {t("hero.getLink")}
        <ArrowUpRight className="rtl:-scale-x-100" aria-hidden />
      </a>
    </CtaButton>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero
        eyebrow={t("hero.eyebrow")}
        title={t.rich("hero.title", richTags)}
        lead={t("hero.lead")}
        aside={
          <div className="rounded-3xl border border-white/15 bg-white/5 p-6 text-white sm:p-8">
            <Num className="block text-[72px] leading-none font-extrabold tracking-[-0.03em] text-amber-300">{t("card.rate")}</Num>
            <p className="mt-2 text-base font-semibold text-mist">{t("card.rateLabel")}</p>
            <ul className="m-0 mt-6 grid list-none gap-3 p-0 text-[15px]">
              {card.map((item) => (
                <li key={item.text} className="flex items-center gap-2.5">
                  <item.icon className="size-[18px] flex-none text-amber-300" aria-hidden />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        }
      >
        <div className="mt-[30px] flex flex-wrap gap-2.5">
          {getLink("amber")}
          <CtaButton asChild tone="ghost">
            <a href="#how">{t("hero.howLink")}</a>
          </CtaButton>
        </div>
      </PageHero>

      <Section id="how">
        <Container>
          <Reveal>
            <SectionHeading kicker={t("how.kicker")} title={t("how.title")} />
          </Reveal>
          <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? Check;
              return (
                <div key={step.title} className="grid content-start gap-2 rounded-[18px] border border-neutral-200 bg-white p-[22px]">
                  <div className="flex items-center justify-between">
                    <span className="grid size-[42px] place-items-center rounded-xl bg-teal-50 text-teal-700">
                      <Icon className="size-[18px]" aria-hidden />
                    </span>
                    <Num className="text-[28px] font-extrabold text-neutral-200">{i + 1}</Num>
                  </div>
                  <b className="text-teal-900">{step.title}</b>
                  <span className="text-sm text-slate-ink">{step.body}</span>
                </div>
              );
            })}
          </Reveal>
        </Container>
      </Section>

      <Section className="pt-0 md:pt-0">
        <Container>
          <Reveal className="grid items-center gap-6 rounded-3xl bg-teal-900 p-6 text-white sm:p-9 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div>
              <span className="mb-2.5 block text-[13px] font-bold text-amber-300 en:text-xs en:tracking-[0.1em] en:uppercase">{t("example.kicker")}</span>
              <h2 className="display-tight text-[clamp(26px,3.2vw,38px)] leading-[1.25] font-extrabold en:leading-[1.12]">{t("example.title")}</h2>
              <p className="mt-3.5 text-[15px] text-mist">{t("example.body")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: t("example.topUp"), value: "1,000" },
                { label: t("example.commission"), value: "200", accent: true },
              ].map((item) => (
                <div key={item.label} className="grid gap-1 rounded-[14px] bg-white/5 p-4">
                  <span className="text-[13px] text-mist">{item.label}</span>
                  <span>
                    <Num className={item.accent ? "text-[34px] font-extrabold text-amber-300" : "text-[34px] font-extrabold"}>{item.value}</Num>
                    <small className="ms-1.5 text-sm text-haze">{t("example.currency")}</small>
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </Section>

      <Section className="pt-0 md:pt-0">
        <Container>
          <Reveal>
            <SectionHeading kicker={t("terms.kicker")} title={t("terms.title")} />
          </Reveal>
          <Reveal>
            <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
              {terms.map((term) => (
                <li key={term} className="flex gap-3 rounded-[18px] border border-neutral-200 bg-white p-[18px] text-[15px] text-slate-ink">
                  <Check className="mt-1 size-[17px] flex-none text-amber-600" aria-hidden />
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </Section>

      <Section className="pt-0 md:pt-0">
        <Container className="grid gap-14 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <Reveal>
            <SectionHeading kicker={t("faq.kicker")} title={t("faq.title")} className="mb-0" />
          </Reveal>
          <Reveal>
            <FaqAccordion items={faq as FaqEntry[]} />
          </Reveal>
        </Container>
      </Section>

      <CtaBand
        title={t("band.title")}
        body={t("band.body")}
        action={
          <div className="flex flex-wrap gap-2.5">
            <SignupTrigger tone="dark" />
            {getLink("outline")}
          </div>
        }
      />
    </>
  );
}
