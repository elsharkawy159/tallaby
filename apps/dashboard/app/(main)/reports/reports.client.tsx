"use client";

import { useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@workspace/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { formatNumber } from "@/lib/i18n/format";
import { REPORT_RANGES, type FunnelStep, type ReportRange, type SourceRow } from "./reports.lib";

/* Dashboard › Reports controls and charts (ROADMAP.md F-15a). Data comes from the server. */

const CONTROL = "h-[40px] w-full rounded-[11px] bg-card text-[13px]";

/**
 * Store + period pickers. Both live in the URL (`?store=…&range=30`) so the
 * server renders the right report; the store is re-checked there against the
 * session's seller. The old report stays on screen, dimmed, while the new one loads.
 */
export function ReportsShell({
  stores,
  storeId,
  range,
  children,
}: {
  stores: { id: string; name: string }[];
  storeId: string | null;
  range: ReportRange;
  children: React.ReactNode;
}) {
  const t = useTranslations("reports");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useOptimistic({ storeId, range });

  const go = (next: { storeId: string | null; range: ReportRange }) => {
    startTransition(() => {
      setView(next);
      const params = new URLSearchParams(searchParams);
      if (next.storeId) params.set("store", next.storeId);
      else params.delete("store");
      if (next.range === 30) params.delete("range");
      else params.set("range", String(next.range));
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 px-3.5 pt-[22px] pb-20 sm:px-6 sm:pt-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <p className="text-pretty text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {stores.length > 0 && (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Select value={view.storeId ?? ""} onValueChange={(id) => go({ storeId: id, range: view.range })}>
              <SelectTrigger className={cn(CONTROL, "sm:w-[200px]")} aria-label={t("store")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(view.range)}
              onValueChange={(r) => go({ storeId: view.storeId, range: Number(r) as ReportRange })}
            >
              <SelectTrigger className={cn(CONTROL, "sm:w-[150px]")} aria-label={t("period")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_RANGES.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {t("days", { count: r })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>
      <div aria-busy={pending} className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-60")}>
        {children}
      </div>
    </div>
  );
}

function ChartTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] bg-foreground px-2.5 py-2 text-xs leading-normal text-background shadow-lg">{children}</div>
  );
}

const pct = (value: number | null, locale: string) =>
  value === null ? "—" : formatNumber(value, locale, { style: "percent", maximumFractionDigits: 1 });

/** Views → checkouts → orders → delivered as horizontal bars. */
export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const t = useTranslations("reports.funnel");
  const locale = useLocale();
  const rtl = locale.startsWith("ar");
  const data = steps.map((s) => ({ ...s, label: t(s.key) }));
  const fills = ["var(--primary)", "color-mix(in oklab, var(--primary) 75%, transparent)", "var(--accent)", "var(--success)"];
  const offset = 4 - steps.length;

  return (
    <div className="h-[220px] w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-surface]:outline-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 4 }}>
          <XAxis type="number" hide reversed={rtl} />
          <YAxis
            type="category"
            dataKey="label"
            orientation={rtl ? "right" : "left"}
            width={110}
            tickLine={false}
            axisLine={false}
            className="text-[12px]"
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={({ active, payload }) => {
              const step = payload?.[0]?.payload as (FunnelStep & { label: string }) | undefined;
              if (!active || !step) return null;
              return (
                <ChartTooltip>
                  <div>{step.label}</div>
                  <b className="font-montserrat">{formatNumber(step.value, locale)}</b>
                  {step.fromPrevious !== null && <> · {t("ofPrevious", { percent: pct(step.fromPrevious, locale) })}</>}
                </ChartTooltip>
              );
            }}
          />
          <Bar dataKey="value" radius={6} maxBarSize={30} minPointSize={2}>
            {data.map((s, i) => (
              <Cell key={s.key} fill={fills[i + offset]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const SOURCE_COLORS: Record<SourceRow["source"], string> = {
  store: "var(--primary)",
  otherStores: "var(--chart-3)",
  marketplace: "var(--accent)",
  manual: "var(--chart-1)",
};

/** Revenue share per sales source as a donut, with a legend list beside it. */
export function SourcesChart({ rows }: { rows: SourceRow[] }) {
  const t = useTranslations("reports.sources");
  const locale = useLocale();
  const data = rows.filter((r) => r.revenuePiastres > 0);
  const money = (piastres: number) => formatNumber(piastres / 100, locale, { maximumFractionDigits: 0 });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative size-[170px] shrink-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="revenuePiastres" nameKey="source" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                {data.map((r) => (
                  <Cell key={r.source} fill={SOURCE_COLORS[r.source]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as SourceRow | undefined;
                  if (!active || !row) return null;
                  return (
                    <ChartTooltip>
                      <div>{t(row.source)}</div>
                      <b className="font-montserrat">{money(row.revenuePiastres)}</b> {t("currency")} · {pct(row.share, locale)}
                    </ChartTooltip>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="size-full rounded-full border-[18px] border-muted" aria-hidden />
        )}
      </div>
      <ul className="flex w-full flex-col gap-2.5 text-[13px]">
        {rows.map((r) => (
          <li key={r.source} className="flex items-center gap-2.5">
            <i className="size-2.5 shrink-0 rounded-full" style={{ background: SOURCE_COLORS[r.source] }} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{t(r.source)}</span>
            <span className="text-end text-xs text-muted-foreground tabular-nums">
              <b className="font-montserrat text-sm text-foreground">{money(r.revenuePiastres)}</b> {t("currency")}
              <span className="block">
                {t("orders", { count: r.orders })} · {pct(r.share, locale)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type GovernorateChartRow = { key: string; label: string; delivered: number; refused: number; cancelled: number; open: number };

/** Orders per governorate (busiest first), stacked by how they ended. */
export function GovernorateChart({ rows }: { rows: GovernorateChartRow[] }) {
  const t = useTranslations("reports.governorates");
  const locale = useLocale();
  const rtl = locale.startsWith("ar");
  const series = [
    { key: "delivered", fill: "var(--success)" },
    { key: "refused", fill: "var(--destructive)" },
    { key: "cancelled", fill: "var(--muted-foreground)" },
    { key: "open", fill: "color-mix(in oklab, var(--primary) 45%, transparent)" },
  ] as const;

  return (
    <div>
      <div
        className="w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-surface]:outline-hidden"
        style={{ height: Math.max(120, rows.length * 34 + 20) }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 12, bottom: 4 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 4" className="stroke-border" />
            <XAxis type="number" allowDecimals={false} reversed={rtl} tickLine={false} axisLine={false} className="font-montserrat text-[11px]" />
            <YAxis
              type="category"
              dataKey="label"
              orientation={rtl ? "right" : "left"}
              width={96}
              tickLine={false}
              axisLine={false}
              className="text-[12px]"
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as GovernorateChartRow | undefined;
                if (!active || !row) return null;
                return (
                  <ChartTooltip>
                    <div className="font-semibold">{row.label}</div>
                    {series.map((s) => (
                      <div key={s.key}>
                        {t(s.key)}: <b className="font-montserrat">{formatNumber(row[s.key], locale)}</b>
                      </div>
                    ))}
                  </ChartTooltip>
                );
              }}
            />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} stackId="outcome" fill={s.fill} maxBarSize={20} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-sm" style={{ background: s.fill }} aria-hidden />
            {t(s.key)}
          </li>
        ))}
      </ul>
    </div>
  );
}
