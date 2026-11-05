import type { Metadata } from "next";
import { Blocks, CreditCard, Mail, Percent, Repeat, Sparkles, Truck, Wallet, WalletCards } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { FaqAccordion, type FaqEntry } from "@/components/marketing/site/faq-accordion";
import { ProductJsonLd } from "@/components/marketing/site/json-ld";
import { Container, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { PageHero } from "@/components/marketing/site/page-hero";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { IconTile, SiteCard } from "@/components/marketing/site/site-card";
import { SlugClaimForm } from "@/components/marketing/signup/signup-trigger.client";
import { FeeEstimator } from "@/components/marketing/pricing/fee-calculators.client";
import { PlanCards } from "@/components/marketing/pricing/plan-cards";
import { pageMetadata } from "@/lib/marketing/metadata.lib";
import { PLAN_PRICES, formatNumber, formatUsd, proBreakEvenOrders } from "@/lib/marketing/pricing.lib";
import { CONTACT } from "@/lib/marketing/site.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "pricing", path: "/pricing" });
}

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const prices = {
    topUpMin: formatUsd(PLAN_PRICES.topUp.minCents),
    topUpMax: formatUsd(PLAN_PRICES.topUp.maxCents),
    orderFee: formatUsd(PLAN_PRICES.free.orderFeeCents),
    pro: formatUsd(PLAN_PRICES.pro.monthlyCents),
    proCredits: formatNumber(PLAN_PRICES.pro.aiCredits),
    breakEven: formatNumber(proBreakEvenOrders()),
  };

  const included = [
    { icon: CreditCard, label: t("hero.noCard") },
    { icon: Repeat, label: t("hero.switch") },
    { icon: Percent, label: t("hero.noPercent") },
  ];
  const extras = [
    { icon: Wallet, title: t("extras.topUpTitle"), body: t("extras.topUpBody", prices) },
    { icon: Blocks, title: t("extras.appsTitle"), body: t("extras.appsBody") },
    { icon: Mail, title: t("extras.emailsTitle"), body: t("extras.emailsBody", prices) },
    { icon: Sparkles, title: t("extras.creditsTitle"), body: t("extras.creditsBody", prices) },
  ];
  const separate = [
    { icon: WalletCards, title: t("extras.processingTitle"), body: t("extras.processingBody") },
    { icon: Truck, title: t("extras.shippingTitle"), body: t("extras.shippingBody") },
  ];
  const faq = (t.raw("faq.items") as FaqEntry[]).map((item) => ({
    q: item.q,
    a: replaceTokens(String(item.a), prices),
  }));

  return (
    <>
      <ProductJsonLd page="pricing" path="/pricing" />
      <div id="plans">
        <PageHero eyebrow={t("hero.eyebrow")} title={t("hero.title")} lead={t("hero.lead")} centered className="pb-10 sm:pb-12" />
        <Container className="pb-14 min-[861px]:pb-[72px]">
          <h2 className="sr-only">{t("plans.heading")}</h2>
          <PlanCards />
          <Reveal className="mx-auto mt-7 flex max-w-[880px] flex-wrap justify-center gap-x-[22px] gap-y-2.5 text-sm text-[#3f5358]">
            {included.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5">
                <item.icon className="size-4 text-teal-700" aria-hidden />
                {item.label}
              </span>
            ))}
          </Reveal>
        </Container>
      </div>

      <Section id="estimate" className="pt-0 min-[861px]:pt-0">
        <Container>
          <Reveal>
            <SectionHeading kicker={t("estimate.kicker")} title={t("estimate.title")} description={t("estimate.desc")} centered />
          </Reveal>
          <Reveal>
            <FeeEstimator />
          </Reveal>
        </Container>
      </Section>

      <Section id="extras" className="pt-0 min-[861px]:pt-0">
        <Container>
          <Reveal>
            <SectionHeading kicker={t("extras.kicker")} title={t("extras.title")} description={t("extras.desc")} centered />
          </Reveal>
          <div className="grid gap-4 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-4">
            {extras.map((item) => (
              <Reveal key={item.title}>
                <SiteCard glass className="flex h-full flex-col gap-2.5 p-[26px]">
                  <IconTile className="mb-1">
                    <item.icon aria-hidden />
                  </IconTile>
                  <h3 className="text-[17px] leading-normal font-bold text-teal-900">{item.title}</h3>
                  <p className="text-sm text-pretty text-[#5f7277]">{item.body}</p>
                </SiteCard>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-4 grid gap-4 min-[641px]:grid-cols-2">
            {separate.map((item) => (
              <div key={item.title} className="flex gap-3.5 rounded-card-sm border border-dashed border-line-strong p-[22px]">
                <item.icon className="mt-1 size-[18px] flex-none text-ink-500" aria-hidden />
                <div className="min-w-0 flex-1">
                  <b className="block text-teal-900">{item.title}</b>
                  <span className="text-sm text-[#5f7277]">{item.body}</span>
                </div>
              </div>
            ))}
          </Reveal>
        </Container>
      </Section>

      <Section id="faq" aria-labelledby="pricing-faq-title" className="pt-0 min-[861px]:pt-0">
        <Container className="grid gap-7 min-[1081px]:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] min-[1081px]:gap-14">
          <Reveal>
            <SectionHeading
              id="pricing-faq-title"
              kicker={t("faq.kicker")}
              title={t("faq.title")}
              className="mb-0"
              description={t.rich("faq.desc", {
                link: (chunks) => (
                  <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
                    {chunks}
                  </a>
                ),
              })}
            />
          </Reveal>
          <Reveal>
            <FaqAccordion items={faq} />
          </Reveal>
        </Container>
      </Section>

      <CtaBand title={t("final.title")} body={t("final.body")} action={<SlugClaimForm className="w-full sm:w-[420px]" />} />
    </>
  );
}

/** FAQ answers are read raw (an array), so their prices are filled in here. */
function replaceTokens(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
