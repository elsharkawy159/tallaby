import type { ReactNode } from "react";
import { Calendar, CircleCheck, CircleMinus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BidiText, ClosingCta, FaqBlock, PageTrail, type FaqItem } from "@/components/marketing/pages/content-blocks";
import { withPrices } from "@/components/marketing/pricing/with-prices";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { Container, Num } from "@/components/marketing/site/layout-primitives";
import { alternativesShortlist, compareSlug, factsCheckedOn, type Competitor } from "@/lib/marketing/compare.lib";
import { formatLongDate } from "@/lib/marketing/format.lib";
import { PRICE_TOKENS } from "@/lib/marketing/pricing.lib";
import { CONTACT } from "@/lib/marketing/site.lib";
import { cn } from "@workspace/ui/lib/utils";
import { CompareSources, CompareTable, CompetitorChip, TallabyChip } from "./compare-table";

const H2 = "mb-[22px] text-[clamp(24px,3.2vw,34px)] leading-[1.35] font-bold text-balance text-teal-900";

type ShortlistPick = { bestFor: string; pros: string[]; cons: string[] };

/**
 * /alternatives/<id> (`SEO_PLAN.md` §9.3): why sellers look, a shortlist of
 * options that work in Egypt (Tallaby first, labelled as ours; no invented
 * scores), the Tallaby vs <X> table, how to move, FAQ and sources.
 */
export async function AlternativesPageView({ competitor }: { competitor: Competitor }) {
  const [locale, t, c] = await Promise.all([getLocale(), getTranslations("alternativesPage"), getTranslations(`competitors.${competitor.id}`)]);
  const bidi = (part: string) => <BidiText text={part} />;
  const name = c("name");
  const path = `/alternatives/${competitor.id}`;
  const dateOf = (iso: string) => formatLongDate(iso, locale);
  const why = c.raw("alternatives.why") as { title: string; body: string }[];
  const shortlist = alternativesShortlist(competitor);
  const picks = await Promise.all(
    shortlist.map(async (other) => {
      const o = await getTranslations(`competitors.${other.id}`);
      return { competitor: other, name: o("name"), pick: o.raw("shortlist") as ShortlistPick, price: o("priceNote", PRICE_TOKENS) };
    }),
  );
  const ours = t.raw("tallabyPick") as ShortlistPick;
  const steps = c.raw("alternatives.steps") as { title: string; body: string }[];

  const faq: FaqItem[] = [
    ...(c.raw("alternatives.faq") as FaqItem[]),
    { q: t("faq.free.q"), a: t("faq.free.a", PRICE_TOKENS) },
    { q: t("faq.how.q"), a: t("faq.how.a", { name, email: CONTACT.email }) },
  ];

  return (
    <>
      <PageTrail path={path} items={[{ label: t("crumb"), href: "/compare" }, { label: t("crumbEntry", { name }) }]} />

      <section className="pt-8 pb-8 text-center sm:pt-12 sm:pb-10">
        <Container>
          <h1 className="mx-auto max-w-[860px] text-[clamp(28px,4.6vw,50px)] leading-[1.35] font-bold text-balance text-teal-900 en:leading-[1.15] en:tracking-[-0.01em]">{t("title", { name })}</h1>
          <p className="mx-auto mt-5 max-w-[720px] text-[clamp(16px,2vw,18px)] text-pretty text-ink-500">{withPrices(c("alternatives.intro", PRICE_TOKENS), bidi)}</p>
          <div className="mt-[22px] flex flex-wrap items-center justify-center gap-x-[22px] gap-y-2.5 text-sm text-ink-500">
            <a href="#sources" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-teal-100 bg-white px-3.5 text-[13.5px] font-semibold text-teal-900 hover:no-underline">
              <Calendar className="size-4 text-teal-500" aria-hidden />
              {t("checkedOn", { date: dateOf(factsCheckedOn(competitor)) })}
            </a>
            <span>{t("byTeam")}</span>
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <h2 className={H2}>{t("whyTitle", { name })}</h2>
          <div className="grid gap-4 min-[761px]:grid-cols-3">
            {why.map((item) => (
              <div key={item.title} className="rounded-card border border-[#e3ebed] bg-white p-6">
                <h3 className="mb-1.5 text-[17px] font-bold text-teal-900">
                  <BidiText text={item.title} />
                </h3>
                <p className="text-[14.5px] text-pretty text-ink-500">{withPrices(item.body, bidi)}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <h2 className={H2}>{t("listTitle", { name })}</h2>
          <p className="mb-5 max-w-[760px] text-[14.5px] text-pretty text-ink-500">{t("listLead")}</p>
          <ol className="grid gap-4">
            <PickCard rank={1} chip={<TallabyChip small />} badge={t("ours")} title={t("tallabyName")} pick={ours} price={t("tallabyPrice", PRICE_TOKENS)} labels={{ bestFor: t("bestFor"), pros: t("pros"), cons: t("cons") }} highlight />
            {picks.map((item, i) => (
              <PickCard
                key={item.competitor.id}
                rank={i + 2}
                chip={<CompetitorChip name={item.name} small />}
                title={item.name}
                pick={item.pick}
                price={item.price}
                labels={{ bestFor: t("bestFor"), pros: t("pros"), cons: t("cons") }}
                link={{ href: `/compare/${compareSlug(item.competitor)}`, label: t("compareLink", { name: item.name }) }}
              />
            ))}
          </ol>
          <p className="mt-3 text-[13px] text-pretty text-ink-500">{t("listNote")}</p>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <h2 className={H2}>{t("tableTitle", { name })}</h2>
          <CompareTable competitor={competitor} name={name} />
          <Link href={`/compare/${compareSlug(competitor)}`} className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-teal-700">
            {t("fullCompare", { name })}
            <ForwardArrow />
          </Link>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <h2 className={H2}>{t("moveTitle", { name })}</h2>
          <ol className="grid gap-[18px] min-[961px]:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-card border border-[#e3ebed] bg-white p-[26px]">
                <Num className="mb-4 grid size-10 place-items-center rounded-full bg-amber-600 text-[15px] font-bold text-teal-900">{i + 1}</Num>
                <h3 className="mb-1.5 text-lg font-bold text-teal-900">
                  <BidiText text={step.title} />
                </h3>
                <p className="text-[14.5px] text-pretty text-ink-500">
                  <BidiText text={step.body} />
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <FaqBlock items={faq} />

      <CompareSources competitor={competitor} name={name} dateOf={dateOf} />

      <ClosingCta title={t("closingTitle")} body={t("closingBody")} />
    </>
  );
}

function PickCard({
  rank,
  chip,
  badge,
  title,
  pick,
  price,
  labels,
  link,
  highlight,
}: {
  rank: number;
  chip: ReactNode;
  badge?: string;
  title: string;
  pick: ShortlistPick;
  price: string;
  labels: { bestFor: string; pros: string; cons: string };
  link?: { href: string; label: string };
  highlight?: boolean;
}) {
  const bidi = (part: string) => <BidiText text={part} />;
  return (
    <li className={cn("rounded-[26px] border p-5 sm:p-7", highlight ? "border-teal-100 bg-gradient-to-b from-[rgba(20,81,99,0.06)] to-[rgba(20,81,99,0.02)]" : "border-[#e3ebed] bg-white")}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Num className="grid size-9 place-items-center rounded-full bg-amber-600 text-sm font-bold text-teal-900">{rank}</Num>
        {chip}
        <h3 className="sr-only">{title}</h3>
        {badge ? <span className="rounded-full bg-teal-900 px-3 py-1 text-xs font-bold text-white">{badge}</span> : null}
      </div>
      <p className="mb-2 text-[15px] text-pretty text-[#3d5055]">
        <b className="text-teal-900">{labels.bestFor} </b>
        <BidiText text={pick.bestFor} />
      </p>
      <p className="mb-4 text-[14px] text-pretty text-ink-500">{withPrices(price, bidi)}</p>
      <div className="grid gap-4 min-[761px]:grid-cols-2">
        {[
          { title: labels.pros, items: pick.pros, good: true },
          { title: labels.cons, items: pick.cons, good: false },
        ].map((column) => (
          <div key={column.title}>
            <b className="mb-2 block text-[14.5px] text-teal-900">{column.title}</b>
            <ul className="grid gap-2">
              {column.items.map((item) => (
                <li key={item} className="grid grid-cols-[20px_1fr] gap-2 text-[14.5px] text-pretty text-[#4a5c61]">
                  {column.good ? <CircleCheck className="mt-0.5 size-[18px] text-teal-700" aria-hidden /> : <CircleMinus className="mt-0.5 size-[18px] text-[#8a989b]" aria-hidden />}
                  <span>{withPrices(item, bidi)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {link ? (
        <Link href={link.href} className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-teal-700">
          {link.label}
          <ForwardArrow />
        </Link>
      ) : null}
    </li>
  );
}
