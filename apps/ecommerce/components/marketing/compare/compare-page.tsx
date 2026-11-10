import { Calendar, CircleCheck, ReceiptText, Scale } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BidiText, ClosingCta, FaqBlock, PageTrail, type FaqItem } from "@/components/marketing/pages/content-blocks";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { Container, Num, Section } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { withPrices } from "@/components/marketing/pricing/with-prices";
import { alternativesPath, compareLinkTargets, compareSlug, factsCheckedOn, type Competitor } from "@/lib/marketing/compare.lib";
import { formatLongDate } from "@/lib/marketing/format.lib";
import { PRICE_TOKENS } from "@/lib/marketing/pricing.lib";
import { CONTACT } from "@/lib/marketing/site.lib";
import { cn } from "@workspace/ui/lib/utils";
import { CompareSources, CompareTable, CompetitorChip, TallabyChip } from "./compare-table";

const H2 = "mb-[22px] text-[clamp(24px,3.2vw,34px)] leading-[1.35] font-bold text-balance text-teal-900";

/** One comparison (`SEO_PLAN.md` §9.2). Everything about the competitor comes from its sourced facts; a missing fact is left out. */
export async function ComparePageView({ competitor }: { competitor: Competitor }) {
  const [locale, t, c] = await Promise.all([getLocale(), getTranslations("comparePage"), getTranslations(`competitors.${competitor.id}`)]);
  // Prices stay tokens here; `withPrices` shows them in the visitor's currency.
  const prices = PRICE_TOKENS;
  const bidi = (part: string) => <BidiText text={part} />;
  const name = c("name");
  const path = `/compare/${compareSlug(competitor)}`;
  const others = compareLinkTargets(competitor).filter((other) => other.id !== competitor.id);
  const alternatives = alternativesPath(competitor);
  const dateOf = (iso: string) => formatLongDate(iso, locale);

  const verdictTallaby = c.raw("verdictTallaby") as string[];
  const verdictCompetitor = c.raw("verdict") as string[];
  const strengthsTallaby = t.raw("strengthsTallaby") as { title: string; body: string }[];
  const strengthsCompetitor = c.raw("strengths") as { title: string; body: string }[];
  const steps = t.raw("steps") as { title: string; body: string; link: string }[];
  const extraFaq = (c.raw("faq") as FaqItem[] | undefined) ?? [];

  const faq: FaqItem[] = [
    { q: t("faq.price.q", { name }), a: `${t("faq.price.a", prices)} ${c("priceNote", prices)}` },
    ...extraFaq,
    ...(["move", "domain", "try", "methods"] as const).map((key) => ({ q: t(`faq.${key}.q`, { name }), a: t(`faq.${key}.a`, prices) })),
    { q: t("faq.how.q"), a: t("faq.how.a", { name, email: CONTACT.email }) },
  ];

  const moveBody = competitor.moveSteps === "shopify-import" ? t("moveBodyShopify") : t("moveBodyExcel", { name });
  const stepLinks = ["signup", competitor.moveSteps === "shopify-import" ? "/integrations" : CONTACT.whatsapp, "/features/custom-domain"];

  return (
    <>
      <PageTrail path={path} items={[{ label: t("crumb"), href: "/compare" }, { label: t("vsLabel", { name }) }]} />

      <section className="pt-8 pb-8 text-center sm:pt-12 sm:pb-10">
        <Container>
          <div className="mb-[30px] flex items-center justify-center gap-2 sm:gap-3.5">
            <TallabyChip />
            <span className="grid size-[38px] flex-none place-items-center rounded-full bg-teal-900 text-[11px] font-bold text-white shadow-[0_0_0_6px_rgba(20,81,99,0.08)] sm:size-[46px] sm:text-xs">{t("vs")}</span>
            <CompetitorChip name={name} />
          </div>
          <h1 className="mx-auto max-w-[860px] text-[clamp(28px,4.6vw,50px)] leading-[1.35] font-bold text-balance text-teal-900 en:leading-[1.15] en:tracking-[-0.01em]">{t("title", { name })}</h1>
          <p className="mx-auto mt-5 max-w-[720px] text-[clamp(16px,2vw,18px)] text-pretty text-ink-500">{withPrices(c("intro", prices), bidi)}</p>
          <div className="mt-[22px] flex flex-wrap items-center justify-center gap-x-[22px] gap-y-2.5 text-sm text-ink-500">
            <a href="#sources" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-teal-100 bg-white px-3.5 text-[13.5px] font-semibold text-teal-900 hover:no-underline">
              <Calendar className="size-4 text-teal-500" aria-hidden />
              {t("checkedOn", { date: dateOf(factsCheckedOn(competitor)) })}
            </a>
            <span>{t("byTeam")}</span>
          </div>
        </Container>
      </section>

      <section className="pt-2 pb-10">
        <Container>
          <Reveal className="overflow-hidden rounded-card-lg border border-[#e3ebed] bg-white shadow-[0_18px_44px_rgba(13,55,67,0.07)]">
            <div className="flex items-center gap-2.5 border-b border-[#edf1f2] px-5 py-[18px] font-bold text-teal-900 sm:px-7">
              <Scale className="size-5 text-amber-700" aria-hidden />
              {t("verdictTitle")}
            </div>
            <div className="grid min-[761px]:grid-cols-2">
              {[
                { title: t("chooseTallaby"), items: verdictTallaby, tallaby: true },
                { title: t("chooseCompetitor", { name }), items: verdictCompetitor, tallaby: false },
              ].map((column) => (
                <div
                  key={column.title}
                  className={cn(
                    "px-5 pt-[26px] pb-[30px] sm:px-7",
                    column.tallaby ? "bg-[rgba(20,81,99,0.045)]" : "border-t border-[#edf1f2] min-[761px]:border-s min-[761px]:border-t-0",
                  )}
                >
                  <h2 className="mb-3.5 text-[19px] font-bold text-teal-900">{column.title}</h2>
                  <ul className="grid gap-3">
                    {column.items.map((item) => (
                      <li key={item} className="grid grid-cols-[22px_1fr] gap-2.5 text-[15px] text-pretty text-[#3d5055]">
                        <CircleCheck className={cn("mt-1 size-5", column.tallaby ? "text-teal-700" : "text-[#7d8a8d]")} aria-hidden />
                        <span>{withPrices(item, bidi)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
          <div className="mt-5 flex gap-3 rounded-card border border-amber-100 bg-[rgba(255,248,235,0.7)] px-5 py-4 text-[14.5px] text-pretty text-[#4a5c61]">
            <ReceiptText className="mt-0.5 size-5 flex-none text-amber-700" aria-hidden />
            <p>
              <b className="text-teal-900">{t("priceNoteTitle")} </b>
              {withPrices(c("priceNote", prices), bidi)}
            </p>
          </div>
        </Container>
      </section>

      <section id="table" className="py-10">
        <Container>
          <h2 className={H2}>{t("tableTitle", { name })}</h2>
          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-ink-500">
            {(["y", "p", "n"] as const).map((status) => (
              <span key={status} className="flex items-center gap-2">
                <LegendDot status={status} />
                {t(`legend.${status}`)}
              </span>
            ))}
          </div>
          <CompareTable competitor={competitor} name={name} />
          <p className="mt-3 text-[13px] text-pretty text-ink-500">{t("tableNote", { name })}</p>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <h2 className={H2}>{t("strengthsTitle")}</h2>
          <div className="grid gap-5 min-[761px]:grid-cols-2">
            {[
              { title: t("strengthsOfTallaby"), items: strengthsTallaby, tallaby: true },
              { title: t("strengthsOfCompetitor", { name }), items: strengthsCompetitor, tallaby: false },
            ].map((column) => (
              <Reveal
                key={column.title}
                className={cn(
                  "rounded-[26px] border p-5 sm:p-7",
                  column.tallaby ? "border-teal-100 bg-gradient-to-b from-[rgba(20,81,99,0.06)] to-[rgba(20,81,99,0.02)]" : "border-[#e3ebed] bg-white",
                )}
              >
                <h3 className="mb-[18px] text-xl font-bold text-teal-900">{column.title}</h3>
                <ul className="grid gap-[18px]">
                  {column.items.map((item) => (
                    <li key={item.title}>
                      <b className="block text-[15.5px] text-teal-900">
                        <BidiText text={item.title} />
                      </b>
                      <p className="text-[14.5px] text-pretty text-ink-500">{withPrices(item.body, bidi)}</p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <h2 className={H2}>{t("moveTitle", { name })}</h2>
          <ol className="grid gap-[18px] min-[961px]:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal key={step.title} as="li" className="rounded-card border border-[#e3ebed] bg-white p-[26px]">
                <Num className="mb-4 grid size-10 place-items-center rounded-full bg-amber-600 text-[15px] font-bold text-teal-900">{i + 1}</Num>
                <h3 className="mb-1.5 text-lg font-bold text-teal-900">{i === 1 ? t("moveProducts", { name }) : step.title}</h3>
                <p className="text-[14.5px] text-pretty text-ink-500">
                  <BidiText text={i === 1 ? moveBody : step.body} />
                </p>
                <StepLink target={stepLinks[i]!} label={i === 1 && competitor.moveSteps === "shopify-import" ? t("moveLinkShopify") : step.link} />
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <FaqBlock items={faq} />

      <CompareSources competitor={competitor} name={name} dateOf={dateOf} />

      {others.length || alternatives ? (
        <Section className="pt-0 min-[861px]:pt-0">
          <Container>
            <h2 className={H2}>{t("othersTitle")}</h2>
            <div className="grid gap-3.5 min-[521px]:grid-cols-2 min-[961px]:grid-cols-4">
              {alternatives ? (
                <Link
                  href={alternatives}
                  className="grid gap-2.5 rounded-[20px] border border-teal-100 bg-[rgba(20,81,99,0.045)] p-[18px] text-inherit hover:border-teal-300 hover:no-underline"
                >
                  <CompetitorChip name={name} small />
                  <b className="flex items-center justify-between gap-2 text-[15.5px] text-teal-900">
                    {t("alternativesLink", { name })}
                    <ForwardArrow className="flex-none text-teal-500" />
                  </b>
                </Link>
              ) : null}
              {others.map((other) => (
                <OtherCard key={other.id} competitor={other} />
              ))}
              <Link href="/pricing" className="grid gap-2.5 rounded-[20px] border border-[#e3ebed] bg-white p-[18px] text-inherit hover:border-teal-300 hover:no-underline">
                <b className="flex items-center justify-between gap-2 text-[15.5px] text-teal-900">
                  {t("pricingLink")}
                  <ForwardArrow className="flex-none text-teal-500" />
                </b>
                <span className="text-[13.5px] text-ink-500">{withPrices(t("pricingLinkBody", prices), bidi)}</span>
              </Link>
            </div>
          </Container>
        </Section>
      ) : null}

      <ClosingCta title={t("closingTitle")} body={t("closingBody")} />
    </>
  );
}

function LegendDot({ status }: { status: "y" | "n" | "p" }) {
  const styles = { y: "bg-teal-700", n: "bg-[#c9d0d1]", p: "bg-amber-400" };
  return <span className={cn("size-3 rounded-full", styles[status])} aria-hidden />;
}

function StepLink({ target, label }: { target: string; label: string }) {
  const className = "mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-teal-700";
  if (target === "signup") {
    return (
      <div className="mt-3">
        <SignupTrigger size="sm">{label}</SignupTrigger>
      </div>
    );
  }
  if (target.startsWith("/")) {
    return (
      <Link href={target} className={className}>
        {label}
        <ForwardArrow />
      </Link>
    );
  }
  return (
    <a href={target} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
      <ForwardArrow />
    </a>
  );
}

export async function OtherCard({ competitor }: { competitor: Competitor }) {
  const [t, c] = await Promise.all([getTranslations("comparePage"), getTranslations(`competitors.${competitor.id}`)]);
  const name = c("name");
  return (
    <Link
      href={`/compare/${compareSlug(competitor)}`}
      className="grid gap-2.5 rounded-[20px] border border-[#e3ebed] bg-white p-[18px] text-inherit transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[3px] hover:border-teal-300 hover:no-underline hover:shadow-[0_14px_32px_rgba(13,55,67,0.08)] motion-reduce:hover:translate-y-0"
    >
      <CompetitorChip name={name} small />
      <b className="flex items-center justify-between gap-2 text-[15.5px] text-teal-900">
        {t("vsLabel", { name })}
        <ForwardArrow className="flex-none text-teal-500" />
      </b>
    </Link>
  );
}
