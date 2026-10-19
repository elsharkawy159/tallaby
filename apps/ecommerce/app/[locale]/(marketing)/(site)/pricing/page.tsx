import type { Metadata } from "next";
import { Check, CreditCard, Globe, Headset, Infinity as InfinityIcon, LayoutTemplate, Link2, ShoppingBag, TicketPercent, Truck, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CtaBand } from "@/components/marketing/site/cta-band";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { FaqAccordion, type FaqEntry } from "@/components/marketing/site/faq-accordion";
import { Container, Num, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { PageHero } from "@/components/marketing/site/page-hero";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { richTags } from "@/components/marketing/site/rich-text";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { FeeDial, FeeEstimator } from "@/components/marketing/pricing/fee-calculators.client";
import { pageMetadata } from "@/lib/marketing/metadata.lib";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({ locale, page: "pricing", path: "/pricing" });
}

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const tc = await getTranslations("common");

  const zero = [
    { value: "0%", label: t("plan.commission") },
    { value: "0", label: t("plan.monthly") },
    { value: "0", label: t("plan.setup") },
    { value: "0", label: t("plan.cancel") },
  ];
  const included = [
    { icon: InfinityIcon, title: t("included.products"), body: t("included.productsBody") },
    { icon: ShoppingBag, title: t("included.orders"), body: t("included.ordersBody") },
    { icon: Users, title: t("included.visitors"), body: t("included.visitorsBody") },
    { icon: Link2, title: t("included.payLink"), body: t("included.payLinkBody") },
    { icon: LayoutTemplate, title: t("included.templates"), body: t("included.templatesBody") },
    { icon: Globe, title: t("included.domain"), body: t("included.domainBody") },
    { icon: TicketPercent, title: t("included.codes"), body: t("included.codesBody") },
    { icon: Headset, title: t("included.support"), body: t("included.supportBody") },
  ];
  const separate = [
    { icon: CreditCard, title: t("included.processing"), body: t("included.processingBody") },
    { icon: Truck, title: t("included.shipping"), body: t("included.shippingBody") },
  ];

  return (
    <>
      <PageHero eyebrow={t("hero.eyebrow")} title={t.rich("hero.title", richTags)} lead={t("hero.lead")} aside={<FeeDial />}>
        <div className="mt-[30px] flex flex-wrap gap-2.5">
          <SignupTrigger />
          <CtaButton asChild tone="ghost">
            <a href="#estimate">{t("hero.estimate")}</a>
          </CtaButton>
        </div>
      </PageHero>

      <Section>
        <Container>
          <Reveal>
            <SectionHeading kicker={t("plan.kicker")} title={t("plan.title")} />
          </Reveal>
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal className="rounded-3xl bg-teal-900 p-6 text-white sm:p-9">
              <h3 className="mb-3.5 text-base font-bold text-amber-300">{t("plan.freePlan")}</h3>
              <div className="leading-none">
                <Num className="text-[64px] font-extrabold tracking-[-0.03em]">5</Num>
                <small className="ms-2 text-lg font-semibold text-haze">{t("plan.perOrder")}</small>
              </div>
              <p className="mt-3.5 text-[15px] text-mist">{t("plan.flat")}</p>
              <ul className="m-0 mt-6 grid list-none gap-2.5 p-0 text-[15px]">
                {[t("plan.i1"), t("plan.i2"), t("plan.i3"), t("plan.i4")].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check className="size-[17px] text-amber-600" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <SignupTrigger className="mt-[26px]" />
            </Reveal>
            <Reveal className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-9">
              <h3 className="mb-3.5 text-base font-bold text-teal-700">{t("plan.wontPay")}</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {zero.map((z) => (
                  <div key={z.label} className="grid gap-0.5 rounded-[14px] bg-neutral-50 p-4">
                    <Num className="text-[34px] leading-[1.1] font-extrabold text-teal-900">{z.value}</Num>
                    <span className="text-[13px] text-slate-ink">{z.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3.5 text-[15px] text-slate-ink">{t("plan.noCard")}</p>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section id="estimate" className="pt-0 md:pt-0">
        <Container>
          <Reveal>
            <SectionHeading kicker={t("estimate.kicker")} title={t("estimate.title")} description={t("estimate.desc")} />
          </Reveal>
          <Reveal>
            <FeeEstimator />
          </Reveal>
        </Container>
      </Section>

      <Section className="pt-0 md:pt-0">
        <Container>
          <Reveal>
            <SectionHeading kicker={t("included.kicker")} title={t("included.title")} />
          </Reveal>
          <Reveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {included.map((item) => (
              <div key={item.title} className="grid gap-2 rounded-[18px] border border-neutral-200 bg-white p-[22px]">
                <span className="grid size-[42px] place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <item.icon className="size-[18px]" aria-hidden />
                </span>
                <b className="text-teal-900">{item.title}</b>
                <span className="text-sm text-slate-ink">{item.body}</span>
              </div>
            ))}
          </Reveal>
          <Reveal className="mt-4 grid gap-4 sm:grid-cols-2">
            {separate.map((item) => (
              <div key={item.title} className="flex gap-3.5 rounded-[18px] border border-dashed border-neutral-300 p-[22px]">
                <item.icon className="mt-1 size-[18px] flex-none text-neutral-600" aria-hidden />
                <div className="min-w-0 flex-1">
                  <b className="block text-teal-900">{item.title}</b>
                  <span className="text-sm text-slate-ink">{item.body}</span>
                </div>
              </div>
            ))}
          </Reveal>
        </Container>
      </Section>

      <Section className="pt-0 md:pt-0">
        <Container className="grid gap-14 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <Reveal>
            <SectionHeading kicker={t("faq.kicker")} title={t("faq.title")} className="mb-0">
              <p className="mt-3.5">
                <Link href="/faq" className="text-teal-700 hover:underline">
                  {tc("seeAllQuestions")}
                </Link>
              </p>
            </SectionHeading>
          </Reveal>
          <Reveal>
            <FaqAccordion items={t.raw("faq.items") as FaqEntry[]} />
          </Reveal>
        </Container>
      </Section>

      <CtaBand title={t("band")} action={<SignupTrigger tone="dark" />} />
    </>
  );
}
