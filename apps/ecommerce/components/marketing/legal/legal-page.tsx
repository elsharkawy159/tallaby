import type { ComponentType } from "react";
import { Calendar, Clock, Download, Eye, Info, Pencil, Trash2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { ReadingProgress } from "@/components/marketing/blog/article-tools.client";
import { Container, Eyebrow } from "@/components/marketing/site/layout-primitives";
import { formatLongDate } from "@/lib/marketing/format.lib";
import { CONTACT } from "@/lib/marketing/site.lib";
import { withPrices } from "@/components/marketing/pricing/with-prices";
import { publishedClauses, type LegalClause } from "./legal.lib";
import { LegalToc } from "./legal-toc.client";

type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  /** Titled paragraphs ("Plans. Tallaby has two plans…"). */
  clauses?: LegalClause[];
  list?: string[];
  note?: string;
  /** Show the contact email; the string is the lead-in text (may be empty). */
  contact?: string;
  /** Privacy only: render the data table / the rights grid. */
  table?: boolean;
  rights?: boolean;
};

type SummaryItem = { title: string; body: string };

const RIGHT_ICONS = [Eye, Pencil, Download, Trash2];

/**
 * Terms and Privacy share this layout: a header on the page fog with a Terms/Privacy
 * switch, three summary cards, contents and numbered sections. All copy
 * comes from `legal.<doc>` in the messages.
 */
export async function LegalPage({
  doc,
  summaryIcons,
  updated,
  minutes,
  usdSwitchDate = null,
}: {
  doc: "terms" | "privacy";
  summaryIcons: ComponentType<{ className?: string }>[];
  /** ISO date of the last revision. */
  updated: string;
  minutes: number;
  /** ISO date of the USD switch. A clause that names it stays hidden until it is set. */
  usdSwitchDate?: string | null;
}) {
  const t = await getTranslations("legal");
  const tm = await getTranslations("meta");
  const sections = t.raw(`${doc}.sections`) as LegalSection[];
  const summary = t.raw(`${doc}.summary`) as SummaryItem[];
  const locale = await getLocale();
  const switchDate = usdSwitchDate ? formatLongDate(usdSwitchDate, locale) : null;

  const swap = [
    { href: "/terms", label: tm("terms.title"), current: doc === "terms" },
    { href: "/privacy", label: tm("privacy.title"), current: doc === "privacy" },
  ];

  return (
    <>
      <ReadingProgress targetId="legal-doc" />
      <div className="pt-11 pb-16 sm:pt-[72px]">
        <Container>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="text-[clamp(34px,5.6vw,60px)] leading-[1.25] font-bold text-balance text-teal-900 en:leading-[1.1] en:tracking-[-0.02em]">{t(`${doc}.title`)}</h1>
          <p className="mt-5 max-w-[600px] text-[clamp(16px,2vw,19px)] text-pretty text-ink-500">{t(`${doc}.lead`)}</p>
          <div className="mt-[22px] flex flex-wrap gap-[18px] text-sm text-ink-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-[15px] text-teal-500" aria-hidden />
              {t("updated", { date: formatLongDate(updated, locale) })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-[15px] text-teal-500" aria-hidden />
              {t("readTime", { minutes })}
            </span>
          </div>
          <div className="mt-7 flex flex-wrap gap-2" data-print="hide">
            {swap.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                aria-current={s.current ? "page" : undefined}
                className="inline-flex h-10 items-center rounded-full border border-line-strong bg-white px-[18px] text-sm font-semibold text-ink-600 hover:border-teal-300 hover:text-teal-900 hover:no-underline aria-[current=page]:border-teal-900 aria-[current=page]:bg-teal-900 aria-[current=page]:text-white aria-[current=page]:hover:text-white"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </Container>
      </div>

      <Container>
        <div className="relative -mt-9 grid gap-3.5 md:grid-cols-3" data-print="hide">
          {summary.map((item, i) => {
            const Icon = summaryIcons[i] ?? Info;
            return (
              <div key={item.title} className="grid content-start gap-1.5 rounded-card border border-line bg-surface-glass p-[22px] shadow-[0_14px_36px_rgba(13,55,67,0.07)]">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <Icon className="size-[18px]" />
                </span>
                <b className="text-[15px] text-teal-900">{item.title}</b>
                <span className="text-sm text-slate-ink">{withPrices(item.body)}</span>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 pt-16 pb-24 lg:grid-cols-[260px_minmax(0,720px)] lg:gap-[72px] print:block">
          <LegalToc sections={sections.map((s) => ({ id: s.id, title: s.title }))} />
          <article id="legal-doc">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="mb-10 scroll-mt-[100px] border-b border-line pb-10 last:border-0">
                <h2 className="mb-3.5 flex items-baseline gap-3.5 text-2xl font-bold text-teal-900">
                  <span className="font-latin text-[15px] font-extrabold text-amber-700">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <div className="space-y-3 text-base leading-[1.85] text-ink-700 en:leading-[1.7]">
                  {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
                  {publishedClauses(s.clauses ?? [], switchDate).map((c) => (
                    <p key={c.title}>
                      <b className="font-bold text-teal-900">{c.title}.</b> {withPrices(c.body)}
                    </p>
                  ))}
                </div>
                {s.list ? (
                  <ul className="mt-3 grid list-disc gap-1.5 ps-5 text-base leading-[1.85] text-ink-700 en:leading-[1.7]">
                    {s.list.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                ) : null}
                {s.table ? <PrivacyTable /> : null}
                {s.rights ? <RightsGrid /> : null}
                {s.note ? (
                  <div className="mt-3.5 flex gap-2.5 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-900">
                    <Info className="mt-[5px] size-4 flex-none text-teal-700" aria-hidden />
                    <span>{s.note}</span>
                  </div>
                ) : null}
                {s.contact !== undefined ? (
                  <p className="mt-3 text-base text-ink-700">
                    {s.contact ? `${s.contact} ` : null}
                    <a href={`mailto:${CONTACT.email}`} className="font-latin text-teal-700">
                      {CONTACT.email}
                    </a>
                  </p>
                ) : null}
              </section>
            ))}
          </article>
        </div>
      </Container>
    </>
  );
}

async function PrivacyTable() {
  const t = await getTranslations("legal.privacy");
  const rows = t.raw("rows") as [string, string, string][];
  return (
    <div className="mt-4 overflow-x-auto rounded-[14px] border border-neutral-200">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            {[t("table.data"), t("table.why"), t("table.kept")].map((h) => (
              <th key={h} className="bg-neutral-50 px-3.5 py-3 text-start font-bold text-teal-900">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={i} className={cn("border-t border-neutral-200 px-3.5 py-3 align-top leading-[1.6] text-ink-700", i === 0 && "font-semibold text-teal-900")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function RightsGrid() {
  const t = await getTranslations("legal.privacy");
  const rights = t.raw("rights") as SummaryItem[];
  return (
    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
      {rights.map((r, i) => {
        const Icon = RIGHT_ICONS[i] ?? Info;
        return (
          <div key={r.title} className="flex items-start gap-3 rounded-[14px] border border-neutral-200 px-4 py-3.5 text-sm text-ink-700">
            <Icon className="mt-[3px] size-[18px] flex-none text-teal-500" aria-hidden />
            <div>
              <b className="block text-[15px] text-teal-900">{r.title}</b>
              <span>{r.body}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
