import Image from "next/image";
import { CircleCheck, Plug } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BidiText, ClosingCta, FaqBlock, PageTrail, type FaqItem } from "@/components/marketing/pages/content-blocks";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { CtaButton } from "@/components/marketing/site/cta-button";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { Container, Num, Section, SectionHeading } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { IconTile, SiteCard } from "@/components/marketing/site/site-card";
import type { DetailPage } from "@/lib/marketing/detail-pages.lib";
import { DetailShotView, StepVisual } from "./detail-shots";

type Titled = { title: string; body: string };

/** One feature or integration page. Sections with no content in the entry are left out. */
export async function DetailPageView({ page }: { page: DetailPage }) {
  const t = await getTranslations(`detailPages.${page.slug}`);
  const shared = await getTranslations("contentPages");
  const isIntegration = page.kind === "integration";
  const hub = isIntegration ? "/integrations" : undefined;
  const path = `/${isIntegration ? "integrations" : "features"}/${page.slug}`;

  const what = t.raw("what") as string[];
  const steps = t.raw("steps") as Titled[];
  const related = t.raw("related") as Titled[];
  const faq = t.raw("faq") as FaqItem[];
  const benefits = page.benefits ? (t.raw("benefits") as Titled[]) : [];
  const uses = page.uses ? (t.raw("uses") as Titled[]) : [];
  const requirements = isIntegration ? (t.raw("requirements") as Titled[]) : [];

  return (
    <>
      <PageTrail path={path} items={[{ label: t("crumbHub"), href: hub }, { label: t("crumb") }]} />

      <section className="pt-6 pb-10 sm:pt-9 sm:pb-14">
        <Container className="grid items-center gap-10 min-[1081px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[1081px]:gap-12">
          <div className="flex min-w-0 flex-col items-start gap-[18px]">
            {page.partner ? (
              <>
                <div className="flex items-center" aria-hidden>
                  <span className="flex h-[46px] items-center rounded-full border-[1.5px] border-teal-100 bg-white px-3.5 shadow-[0_10px_28px_rgba(20,81,99,0.1)] sm:h-[54px] sm:px-[22px]">
                    <Image src="/logo-primary.png" alt="" width={94} height={24} className="h-5 w-auto sm:h-6" />
                  </span>
                  <span className="relative block h-0.5 w-[52px] bg-[repeating-linear-gradient(90deg,var(--color-teal-300)_0_6px,transparent_6px_11px)] sm:w-[84px]">
                    <span className="absolute start-1/2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-amber-600 text-teal-900 shadow-[0_0_0_6px_rgba(253,173,40,0.18)] ltr:-translate-x-1/2 rtl:translate-x-1/2 sm:size-[38px]">
                      <Plug className="size-[18px]" />
                    </span>
                  </span>
                  <span dir="ltr" className="flex h-[46px] items-center rounded-full border-[1.5px] border-[#e2e5e6] bg-[#eef0f1] px-3.5 font-latin text-sm font-bold whitespace-nowrap text-[#3f4a4d] sm:h-[54px] sm:px-[22px] sm:text-base">
                    {page.partner}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#15803d]">
                  <CircleCheck className="size-[15px]" aria-hidden />
                  {shared("noCode")}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e1eaec] bg-white py-[5px] ps-1.5 pe-3.5 text-[13.5px] font-bold whitespace-nowrap text-teal-700">
                <span className="grid size-7 place-items-center rounded-full bg-teal-700 text-white">
                  <page.icon className="size-[15px]" aria-hidden />
                </span>
                <BidiText text={t("crumb")} />
              </span>
            )}
            <h1 className="text-[clamp(30px,4vw,48px)] leading-[1.3] font-bold text-balance text-teal-900 en:leading-[1.15] en:tracking-[-0.01em]">
              <BidiText text={t("title")} />
            </h1>
            <p className="text-lg text-pretty text-ink-500">
              <BidiText text={t("lead")} />
            </p>
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap">
              <SignupTrigger>{shared("createStore")}</SignupTrigger>
              <CtaButton asChild tone="outline">
                <Link href="/pricing">{shared("pricing")}</Link>
              </CtaButton>
            </div>
          </div>
          <div className="min-w-0">
            <DetailShotView shot={page.shot} />
          </div>
        </Container>
      </section>

      <Section>
        <Container className="grid items-start gap-4 min-[1081px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[1081px]:gap-14">
          <Reveal as="h2" className="text-[clamp(26px,3.4vw,36px)] leading-[1.35] font-bold text-teal-900">
            <BidiText text={t("whatTitle")} />
          </Reveal>
          <Reveal className="grid gap-4 text-[17px] leading-[1.95] text-[#3d5055]">
            {what.map((paragraph) => (
              <p key={paragraph} className="text-pretty">
                <BidiText text={paragraph} />
              </p>
            ))}
          </Reveal>
        </Container>
      </Section>

      {page.benefits ? (
        <Section>
          <Container>
            <SectionHeading kicker={shared("benefitsKicker")} title={shared("benefitsTitle")} centered />
            <div className="grid gap-4 min-[761px]:grid-cols-3">
              {benefits.map((item, i) => {
                const Icon = page.benefits![i]!;
                return <IconCard key={item.title} Icon={Icon} item={item} />;
              })}
            </div>
          </Container>
        </Section>
      ) : null}

      {page.uses ? (
        <Section>
          <Container>
            <SectionHeading kicker={shared("usesKicker")} title={t("usesTitle")} centered />
            <div className="grid gap-4 min-[761px]:grid-cols-2">
              {uses.map((item, i) => {
                const Icon = page.uses![i]!;
                return <IconCard key={item.title} Icon={Icon} item={item} />;
              })}
            </div>
            {page.events ? (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-ink-500">
                <span>{t("eventsLabel")}</span>
                {page.events.map((name) => (
                  <span key={name} className="inline-flex h-[38px] items-center gap-2 rounded-full border border-[#e3ebed] bg-white px-3.5 font-semibold text-ink-700">
                    <b dir="ltr" className="font-latin text-[12.5px] text-teal-700">
                      {name}
                    </b>
                    {t(`events.${name}`)}
                  </span>
                ))}
                <p className="mt-1 w-full text-center text-[13px] text-pretty text-ink-500">{t("eventsNote")}</p>
              </div>
            ) : null}
          </Container>
        </Section>
      ) : null}

      {isIntegration ? (
        <section className="pt-14 min-[861px]:pt-[72px]">
          <Container>
            <Reveal className="grid items-start gap-4 rounded-card-lg border border-[#dbe8eb] bg-teal-50 p-5 sm:p-7 min-[1081px]:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] min-[1081px]:gap-8">
              <div>
                <h2 className="text-[clamp(24px,3vw,32px)] leading-[1.35] font-bold text-teal-900">{t("requirementsTitle")}</h2>
                <p className="mt-2 text-[15px] text-ink-500">{shared("requirementsLead")}</p>
              </div>
              <ul className="grid gap-2.5 min-[761px]:grid-cols-2">
                {requirements.map((item) => (
                  <li key={item.title} className="grid grid-cols-[24px_1fr] gap-2.5 rounded-2xl bg-white px-4 py-3.5">
                    <CircleCheck className="mt-[3px] size-5 text-teal-700" aria-hidden />
                    <div>
                      <b className="block text-[15px] text-teal-900">
                        <BidiText text={item.title} />
                      </b>
                      <span className="text-[13.5px] text-ink-500">
                        <BidiText text={item.body} />
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </Container>
        </section>
      ) : null}

      <Section>
        <Container>
          <SectionHeading kicker={shared("stepsKicker")} title={t("stepsTitle")} centered />
          <div className="grid gap-4">
            {steps.map((step, i) => (
              <Reveal
                as="article"
                key={step.title}
                className="grid items-center gap-[18px] rounded-[26px] border border-[#e6eef0] bg-white/90 p-[18px] sm:p-[22px] min-[641px]:grid-cols-[48px_minmax(0,1fr)] min-[1081px]:grid-cols-[48px_minmax(0,1fr)_minmax(0,1.1fr)] min-[1081px]:gap-[22px]"
              >
                <Num className="grid size-10 place-items-center self-start rounded-[14px] bg-amber-600 text-base font-extrabold text-teal-900 sm:size-12 sm:text-lg">{i + 1}</Num>
                <div className="min-w-0">
                  <h3 className="mb-1.5 text-lg leading-normal font-bold text-teal-900">
                    <BidiText text={step.title} />
                  </h3>
                  <p className="text-[15px] text-pretty text-ink-500">
                    <BidiText text={step.body} />
                  </p>
                </div>
                <div className="min-w-0 min-[641px]:col-start-2 min-[1081px]:col-start-auto">
                  <StepVisual visual={page.steps[i]!} slug={page.slug} />
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading title={t("relatedTitle")} centered />
          <div className="grid gap-3.5 min-[641px]:grid-cols-2 min-[1081px]:grid-cols-4">
            {related.map((item, i) => {
              const { href, icon: Icon } = page.related[i]!;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col gap-2 rounded-[22px] border border-[#e3ebed] bg-white p-5 text-inherit transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[3px] hover:border-teal-300 hover:no-underline hover:shadow-[0_14px_32px_rgba(13,55,67,0.08)] motion-reduce:hover:translate-y-0"
                >
                  <IconTile className="mb-1">
                    <Icon aria-hidden />
                  </IconTile>
                  <b className="flex items-center justify-between gap-2 text-base text-teal-900">
                    <span>
                      <BidiText text={item.title} />
                    </span>
                    <ForwardArrow className="flex-none text-teal-500" />
                  </b>
                  <p className="text-sm text-ink-500">
                    <BidiText text={item.body} />
                  </p>
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>

      <FaqBlock items={faq} />
      <ClosingCta title={<BidiText text={t("closingTitle")} />} />
    </>
  );
}

function IconCard({ Icon, item }: { Icon: DetailPage["icon"]; item: Titled }) {
  return (
    <Reveal>
      <SiteCard className="h-full p-6">
        <IconTile className="mb-4">
          <Icon aria-hidden />
        </IconTile>
        <h3 className="mb-1.5 text-lg font-bold text-teal-900">
          <BidiText text={item.title} />
        </h3>
        <p className="text-[15px] text-pretty text-ink-500">
          <BidiText text={item.body} />
        </p>
      </SiteCard>
    </Reveal>
  );
}
