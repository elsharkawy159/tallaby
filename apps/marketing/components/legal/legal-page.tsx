import type { ComponentType } from "react";
import { Calendar, Clock, Download, Eye, Info, Pencil, Trash2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { Link } from "@/i18n/navigation";
import { ReadingProgress } from "@/components/blog/article-tools.client";
import { Container, Eyebrow } from "@/components/site/layout-primitives";
import { formatLongDate } from "@/lib/format.lib";
import { CONTACT } from "@/lib/site.lib";
import { LegalToc } from "./legal-toc.client";

type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
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
 * Terms and Privacy share this layout: dark header with a Terms/Privacy
 * switch, three summary cards, contents and numbered sections. All copy
 * comes from `legal.<doc>` in the messages.
 */
export async function LegalPage({
  doc,
  summaryIcons,
  updated,
  minutes,
}: {
  doc: "terms" | "privacy";
  summaryIcons: ComponentType<{ className?: string }>[];
  /** ISO date of the last revision. */
  updated: string;
  minutes: number;
}) {
  const t = await getTranslations("legal");
  const tm = await getTranslations("meta");
  const sections = t.raw(`${doc}.sections`) as LegalSection[];
  const summary = t.raw(`${doc}.summary`) as SummaryItem[];
  const locale = await getLocale();

  const swap = [
    { href: "/terms", label: tm("terms.title"), current: doc === "terms" },
    { href: "/privacy", label: tm("privacy.title"), current: doc === "privacy" },
  ];

  return (
    <>
      <ReadingProgress targetId="legal-doc" />
      <div className="relative overflow-hidden bg-teal-900 pt-[72px] pb-16 text-white print:bg-transparent print:text-black">
        <div aria-hidden className="hero-glow pointer-events-none absolute inset-0 print:hidden" />
        <Container className="relative">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="display-tight text-[clamp(34px,5vw,60px)] leading-[1.22] font-extrabold en:leading-[1.05]">{t(`${doc}.title`)}</h1>
          <p className="mt-5 max-w-[560px] text-lg text-mist">{t(`${doc}.lead`)}</p>
          <div className="mt-[22px] flex flex-wrap gap-[18px] text-sm text-haze">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-[15px] text-amber-300" aria-hidden />
              {t("updated", { date: formatLongDate(updated, locale) })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-[15px] text-amber-300" aria-hidden />
              {t("readTime", { minutes })}
            </span>
          </div>
          <div className="mt-7 flex gap-2" data-print="hide">
            {swap.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                aria-current={s.current ? "page" : undefined}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#c9d9dd] hover:text-white hover:no-underline aria-[current=page]:border-white aria-[current=page]:bg-white aria-[current=page]:text-teal-900"
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
              <div key={item.title} className="grid gap-1.5 rounded-[18px] border border-neutral-200 bg-white p-5 shadow-soft">
                <span className="grid size-[38px] place-items-center rounded-[11px] bg-amber-50 text-[#8a5300]">
                  <Icon className="size-[18px]" />
                </span>
                <b className="text-[15px] text-teal-900">{item.title}</b>
                <span className="text-sm text-slate-ink">{item.body}</span>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 pt-16 pb-24 lg:grid-cols-[260px_minmax(0,720px)] lg:gap-[72px] print:block">
          <LegalToc sections={sections.map((s) => ({ id: s.id, title: s.title }))} />
          <article id="legal-doc">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="mb-10 scroll-mt-[100px] border-b border-neutral-200 pb-10 last:border-0">
                <h2 className="mb-3.5 flex items-baseline gap-3.5 text-2xl font-bold text-teal-900">
                  <span className="font-latin text-[15px] font-extrabold text-amber-700">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <div className="space-y-3 text-base leading-[1.85] text-[#33454a] en:leading-[1.7]">
                  {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
                </div>
                {s.list ? (
                  <ul className="mt-3 grid list-disc gap-1.5 ps-5 text-base leading-[1.85] text-[#33454a] en:leading-[1.7]">
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
                  <p className="mt-3 text-base text-[#33454a]">
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
                <td key={i} className={cn("border-t border-neutral-200 px-3.5 py-3 align-top leading-[1.6] text-[#33454a]", i === 0 && "font-semibold text-teal-900")}>
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
          <div key={r.title} className="flex items-start gap-3 rounded-[14px] border border-neutral-200 px-4 py-3.5 text-sm text-[#33454a]">
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
