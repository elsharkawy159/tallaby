import Image from "next/image";
import { Calendar, Check, CircleCheck, Minus, Scale, X } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BidiText, ClosingCta, FaqBlock, PageTrail, type FaqItem } from "@/components/marketing/pages/content-blocks";
import { SignupTrigger } from "@/components/marketing/signup/signup-trigger.client";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { Container, Num, Section } from "@/components/marketing/site/layout-primitives";
import { Reveal } from "@/components/marketing/site/reveal.client";
import { comparisonTable, compareSlug, publishableCompetitors, type CellStatus, type Competitor } from "@/lib/marketing/compare.lib";
import { formatLongDate } from "@/lib/marketing/format.lib";
import { CONTACT } from "@/lib/marketing/site.lib";
import { cn } from "@workspace/ui/lib/utils";

const H2 = "mb-[22px] text-[clamp(24px,3.2vw,34px)] leading-[1.35] font-bold text-balance text-teal-900";

function StatusIcon({ status, label }: { status: CellStatus; label: string }) {
  const styles: Record<CellStatus, string> = {
    y: "bg-teal-700 text-white",
    n: "bg-[#e9ecec] text-[#6b7678]",
    p: "bg-amber-100 text-[#8a5a00]",
  };
  const Icon = { y: Check, n: X, p: Minus }[status];
  return (
    <span title={label} className={cn("grid size-6 flex-none place-items-center rounded-full", styles[status])}>
      <Icon className="size-3.5 stroke-[2.6]" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

function TallabyChip({ small }: { small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border-[1.5px] border-teal-100 bg-white", small ? "h-9 px-3" : "h-[46px] px-4 shadow-[0_10px_30px_rgba(20,81,99,0.1)] sm:h-14 sm:px-6")}>
      <Image src="/logo-primary.png" alt="طلبي" width={94} height={24} className={small ? "h-[17px] w-auto" : "h-[21px] w-auto sm:h-[26px]"} />
    </span>
  );
}

function CompetitorChip({ name, small }: { name: string; small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border-[1.5px] border-[#e2e5e6] bg-[#eef0f1] font-bold whitespace-nowrap text-[#4a5558]", small ? "h-9 px-3 text-[13px]" : "h-[46px] px-4 text-[15px] sm:h-14 sm:px-6 sm:text-[17px]")}>
      {name}
    </span>
  );
}

/** One comparison. Everything about the competitor comes from its verified facts; a missing fact is left out. */
export async function ComparePageView({ competitor }: { competitor: Competitor }) {
  const [locale, t, c] = await Promise.all([getLocale(), getTranslations("comparePage"), getTranslations(`competitors.${competitor.id}`)]);
  const name = c("name");
  const path = `/compare/${compareSlug(competitor)}`;
  const groups = comparisonTable(competitor);
  const others = publishableCompetitors().filter((other) => other.id !== competitor.id);
  const statusLabel = (status: CellStatus) => t(`legend.${status}`);

  const verdictTallaby = t.raw("verdictTallaby") as string[];
  const verdictCompetitor = c.raw("verdict") as string[];
  const strengthsTallaby = t.raw("strengthsTallaby") as { title: string; body: string }[];
  const strengthsCompetitor = c.raw("strengths") as { title: string; body: string }[];
  const steps = t.raw("steps") as { title: string; body: string; link: string }[];

  const faq: FaqItem[] = [
    { q: t("faq.price.q", { name }), a: `${t("faq.price.a")} ${c("priceNote")}` },
    ...(["move", "domain", "try", "methods"] as const).map((key) => ({ q: t(`faq.${key}.q`, { name }), a: t(`faq.${key}.a`) })),
    { q: t("faq.how.q"), a: t("faq.how.a", { name, email: CONTACT.email }) },
  ];

  const stepLinks = ["signup", CONTACT.whatsapp, "/features/custom-domain"];

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
          <div className="mt-[22px] flex flex-wrap items-center justify-center gap-x-[22px] gap-y-2.5 text-sm text-ink-500">
            <span className="flex items-center gap-2">
              <Calendar className="size-4 text-teal-500" aria-hidden />
              {t("checkedOn", { date: formatLongDate(competitor.factsCheckedOn, locale) })}
            </span>
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
                        <span>
                          <BidiText text={item} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <h2 className={H2}>{t("tableTitle", { name })}</h2>
          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-ink-500">
            {(["y", "p", "n"] as const).map((status) => (
              <span key={status} className="flex items-center gap-2">
                <StatusIcon status={status} label="" />
                {statusLabel(status)}
              </span>
            ))}
          </div>
          <div className="overflow-clip rounded-card border border-[#e3ebed] bg-white shadow-[0_18px_44px_rgba(13,55,67,0.06)]">
            <div className="sticky top-[68px] z-[5] grid grid-cols-2 border-b border-[#e3ebed] bg-white/95 backdrop-blur-[10px] min-[761px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="hidden min-[761px]:block" />
              <div className="flex items-center justify-center bg-[rgba(20,81,99,0.06)] px-3 py-2.5 min-[761px]:justify-start min-[761px]:px-5 min-[761px]:py-3.5">
                <TallabyChip small />
              </div>
              <div className="flex items-center justify-center px-3 py-2.5 min-[761px]:justify-start min-[761px]:px-5 min-[761px]:py-3.5">
                <CompetitorChip name={name} small />
              </div>
            </div>
            {groups.map((group) => (
              <div key={group.id}>
                <div className="grid min-[761px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="flex items-center gap-2.5 px-3.5 pt-5 pb-2 text-[15.5px] font-bold text-teal-900 min-[761px]:px-5 min-[761px]:pt-[22px] min-[761px]:pb-2.5">
                    <group.icon className="size-5 text-amber-700" aria-hidden />
                    {t(`groups.${group.id}`)}
                  </div>
                  <div className="hidden bg-[rgba(20,81,99,0.045)] min-[761px]:block" />
                  <div className="hidden min-[761px]:block" />
                </div>
                {group.rows.map((row) => (
                  <div key={row.id} className="grid grid-cols-2 border-t border-[#edf1f2] min-[761px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,1fr)] min-[761px]:border-[#f0f3f4]">
                    <div className="col-span-2 px-3.5 pt-3 pb-1 text-sm font-semibold text-ink-700 min-[761px]:col-span-1 min-[761px]:px-5 min-[761px]:py-[13px] min-[761px]:text-[15px]">{t(`rows.${row.id}.label`)}</div>
                    <div className="flex flex-col items-start gap-1.5 bg-[rgba(20,81,99,0.045)] px-3 pt-1.5 pb-3.5 text-[13.5px] text-pretty text-[#4a5c61] min-[761px]:flex-row min-[761px]:gap-2.5 min-[761px]:px-5 min-[761px]:py-[13px] min-[761px]:text-[14.5px]">
                      <StatusIcon status={row.tallaby} label={statusLabel(row.tallaby)} />
                      <span>
                        <BidiText text={t(`rows.${row.id}.tallaby`)} />
                      </span>
                    </div>
                    <div className="flex flex-col items-start gap-1.5 px-3 pt-1.5 pb-3.5 text-[13.5px] text-pretty text-[#4a5c61] min-[761px]:flex-row min-[761px]:gap-2.5 min-[761px]:px-5 min-[761px]:py-[13px] min-[761px]:text-[14.5px]">
                      <StatusIcon status={row.competitor} label={statusLabel(row.competitor)} />
                      <span>
                        <BidiText text={c(`cells.${row.id}`)} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
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
                      <p className="text-[14.5px] text-pretty text-ink-500">
                        <BidiText text={item.body} />
                      </p>
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
          <h2 className={H2}>{t("moveTitle")}</h2>
          <div className="grid gap-[18px] min-[961px]:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal key={step.title} className="rounded-card border border-[#e3ebed] bg-white p-[26px]">
                <Num className="mb-4 grid size-10 place-items-center rounded-full bg-amber-600 text-[15px] font-bold text-teal-900">{i + 1}</Num>
                <h3 className="mb-1.5 text-lg font-bold text-teal-900">{i === 1 ? t("moveProducts", { name }) : step.title}</h3>
                <p className="text-[14.5px] text-pretty text-ink-500">
                  <BidiText text={step.body} />
                </p>
                <StepLink target={stepLinks[i]!} label={step.link} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <FaqBlock items={faq} />

      {others.length ? (
        <Section className="pt-0 min-[861px]:pt-0">
          <Container>
            <h2 className={H2}>{t("othersTitle")}</h2>
            <div className="grid gap-3.5 min-[521px]:grid-cols-2 min-[961px]:grid-cols-4">
              {others.map((other) => (
                <OtherCard key={other.id} competitor={other} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <ClosingCta title={t("closingTitle")} body={t("closingBody")} />
    </>
  );
}

function StepLink({ target, label }: { target: string; label: string }) {
  const className = "mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-teal-700";
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

async function OtherCard({ competitor }: { competitor: Competitor }) {
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
