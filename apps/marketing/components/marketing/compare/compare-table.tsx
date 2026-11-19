import Image from "next/image";
import { Check, Minus, X } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BidiText } from "@/components/marketing/pages/content-blocks";
import { Container } from "@/components/marketing/site/layout-primitives";
import { withPrices } from "@/components/marketing/pricing/with-prices";
import { comparisonTable, competitorSources, type CellStatus, type Competitor } from "@/lib/marketing/compare.lib";
import { PRICE_TOKENS } from "@/lib/marketing/pricing.lib";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";

export function StatusIcon({ status, label }: { status: CellStatus; label: string }) {
  const styles: Record<CellStatus, string> = {
    y: "bg-teal-700 text-white",
    n: "bg-[#e9ecec] text-[#6b7678]",
    p: "bg-amber-100 text-[#8a5a00]",
  };
  const Icon = { y: Check, n: X, p: Minus }[status];
  return (
    <span title={label || undefined} className={cn("grid size-6 flex-none place-items-center rounded-full", styles[status])}>
      <Icon className="size-3.5 stroke-[2.6]" aria-hidden />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

export function TallabyChip({ small }: { small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border-[1.5px] border-teal-100 bg-white", small ? "h-9 px-3" : "h-[46px] px-4 shadow-[0_10px_30px_rgba(20,81,99,0.1)] sm:h-14 sm:px-6")}>
      <Image src="/logo-primary.png" alt="طلبي" width={94} height={24} className={small ? "h-[17px] w-auto" : "h-[21px] w-auto sm:h-[26px]"} />
    </span>
  );
}

export function CompetitorChip({ name, small }: { name: string; small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border-[1.5px] border-[#e2e5e6] bg-[#eef0f1] font-bold whitespace-nowrap text-[#4a5558]", small ? "h-9 px-3 text-[13px]" : "h-[46px] px-4 text-[15px] sm:h-14 sm:px-6 sm:text-[17px]")}>
      {name}
    </span>
  );
}

const bidi = (part: string) => <BidiText text={part} />;

/**
 * The comparison table (`SEO_PLAN.md` §9.2): a real table with a caption and
 * row headers, grouped rows, icons plus text, a sticky row-label column while
 * it scrolls sideways on a phone, and a footnote on each competitor cell that
 * jumps to its source in the sources list. Unverified rows aren't there at all.
 */
export async function CompareTable({ competitor, name }: { competitor: Competitor; name: string }) {
  const [t, c] = await Promise.all([getTranslations("comparePage"), getTranslations(`competitors.${competitor.id}`)]);
  const groups = comparisonTable(competitor);
  const sources = competitorSources(competitor);
  const statusLabel = (status: CellStatus) => t(`legend.${status}`);
  const label = "sticky start-0 z-[1] w-[34%] min-w-[118px] bg-white text-start align-top font-semibold whitespace-normal text-ink-700";
  const cell = "w-[33%] px-3 py-3 align-top text-[13.5px] whitespace-normal text-pretty text-[#4a5c61] sm:px-5 sm:text-[14.5px]";

  return (
    <div className="overflow-hidden rounded-card border border-[#e3ebed] bg-white shadow-[0_18px_44px_rgba(13,55,67,0.06)]">
      <Table className="min-w-[560px] table-fixed border-collapse">
        <TableCaption className="caption-top px-4 pt-4 pb-0 text-start text-[13px] text-ink-500 sm:px-5">{t("tableCaption", { name })}</TableCaption>
        <TableHeader>
          <TableRow className="border-[#e3ebed] hover:bg-transparent">
            <TableHead scope="col" className={cn(label, "h-auto px-3 py-3 sm:px-5")}>
              <span className="sr-only">{t("rowsHeader")}</span>
            </TableHead>
            <TableHead scope="col" className="h-auto bg-[rgba(20,81,99,0.06)] px-3 py-3 sm:px-5">
              <TallabyChip small />
            </TableHead>
            <TableHead scope="col" className="h-auto px-3 py-3 sm:px-5">
              <CompetitorChip name={name} small />
            </TableHead>
          </TableRow>
        </TableHeader>
        {groups.map((group) => (
          <TableBody key={group.id} className="[&_tr:last-child]:border-b">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead scope="colgroup" colSpan={3} className="h-auto px-3 pt-5 pb-2 sm:px-5">
                <span className="sticky start-3 flex items-center gap-2.5 text-[15.5px] font-bold text-teal-900">
                  <group.icon className="size-5 text-amber-700" aria-hidden />
                  {t(`groups.${group.id}`)}
                </span>
              </TableHead>
            </TableRow>
            {group.rows.map((row) => {
              const footnote = sources.findIndex((source) => source.url === row.source) + 1;
              return (
                <TableRow key={row.id} className="border-[#f0f3f4] hover:bg-[rgba(20,81,99,0.025)]">
                  <TableHead scope="row" className={cn(label, "h-auto px-3 py-3 text-sm sm:px-5 sm:text-[15px]")}>
                    {t(`rows.${row.id}.label`)}
                  </TableHead>
                  <TableCell className={cn(cell, "bg-[rgba(20,81,99,0.045)]")}>
                    <span className="flex flex-col items-start gap-1.5 sm:flex-row sm:gap-2.5">
                      <StatusIcon status={row.tallaby} label={statusLabel(row.tallaby)} />
                      <span>{withPrices(t(`rows.${row.id}.tallaby`, PRICE_TOKENS), bidi)}</span>
                    </span>
                  </TableCell>
                  <TableCell className={cell}>
                    <span className="flex flex-col items-start gap-1.5 sm:flex-row sm:gap-2.5">
                      <StatusIcon status={row.competitor} label={statusLabel(row.competitor)} />
                      <span>
                        {withPrices(c(`cells.${row.id}`, PRICE_TOKENS), bidi)}
                        {footnote > 0 ? (
                          <sup className="ms-1">
                            <a href={`#source-${footnote}`} className="font-latin text-[11px] font-bold text-teal-700" aria-label={t("sourceN", { n: footnote })}>
                              [{footnote}]
                            </a>
                          </sup>
                        ) : null}
                      </span>
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        ))}
      </Table>
    </div>
  );
}

/** The visible sources list: every page a fact or price came from, with the day we read it. */
export async function CompareSources({ competitor, name, dateOf }: { competitor: Competitor; name: string; dateOf: (iso: string) => string }) {
  const t = await getTranslations("comparePage");
  const sources = competitorSources(competitor);
  if (!sources.length) return null;
  return (
    <section id="sources" className="scroll-mt-24 py-10">
      <Container>
        <h2 className="mb-3 text-[clamp(22px,3vw,28px)] leading-[1.35] font-bold text-teal-900">{t("sourcesTitle")}</h2>
        <p className="mb-5 max-w-[760px] text-[14.5px] text-pretty text-ink-500">{t("sourcesLead", { name })}</p>
        <ol className="grid gap-2.5 text-[14px]">
          {sources.map((source, i) => (
            <li key={source.url} id={`source-${i + 1}`} className="grid scroll-mt-24 grid-cols-[34px_minmax(0,1fr)] gap-2">
              <span className="font-latin font-bold text-teal-700">[{i + 1}]</span>
              <span className="min-w-0">
                <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" dir="ltr" className="font-latin break-all text-teal-700 underline-offset-2 hover:underline">
                  {source.url.replace(/^https?:\/\//, "")}
                </a>
                <span className="block text-[13px] text-ink-500">{t("sourceRead", { date: dateOf(source.checkedOn) })}</span>
              </span>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
