"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, LineChart, RefreshCw, Users } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { EmptyState, HomeCard, HomeCardHeader, IconTile } from "@/app/(main)/_components/home-ui";
import { formatCompactNumber, formatDate, formatNumber, formatRelativeTime } from "@/lib/i18n/format";
import { STORE_VIEWS_RANGES, type StoreViewsRange, type StoreViewsReport } from "@/lib/analytics/store-views.lib";
import { refreshStoreViews } from "./analytics.server";

const VIEWS = "var(--primary)";
const VISITORS = "var(--accent)";

export function StoreViews({
  storeId,
  range,
  report,
  state,
  offline,
}: {
  storeId: string;
  range: StoreViewsRange;
  report: StoreViewsReport | null;
  state: "ready" | "notConfigured" | "error";
  /** The website is not published, so it has no visitors to count. */
  offline: boolean;
}) {
  const t = useTranslations("storeAnalytics");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      const result = await refreshStoreViews(storeId);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      router.refresh();
    });
  };

  if (state === "notConfigured") {
    return (
      <HomeCard>
        <EmptyState icon={LineChart} title={t("notConfiguredTitle")} description={t("notConfiguredDescription")} />
      </HomeCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label={t("rangeLabel")} className="flex gap-1 rounded-xl border bg-card p-1">
          {STORE_VIEWS_RANGES.map((days) => (
            <Link
              key={days}
              href={`/stores/${storeId}/analytics?range=${days}`}
              aria-current={days === range ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground",
                days === range && "bg-primary-soft text-primary-ink",
              )}
            >
              {t("range", { days })}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {report && (
            <span className="text-xs text-muted-foreground">
              {t("updated", { time: formatRelativeTime(report.fetchedAt, locale) })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={refresh} disabled={isPending}>
            <RefreshCw className={cn(isPending && "animate-spin")} aria-hidden />
            {t("refresh")}
          </Button>
        </div>
      </div>

      {offline && <p className="rounded-xl border bg-muted px-4 py-3 text-[13px] text-muted-foreground">{t("offline")}</p>}

      {state === "error" || !report ? (
        <HomeCard>
          <EmptyState icon={LineChart} title={t("errorTitle")} description={t("errorDescription")} />
        </HomeCard>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat icon={Eye} label={t("views")} hint={t("viewsHint")} value={report.views} locale={locale} />
            <Stat icon={Users} label={t("visitors")} hint={t("visitorsHint")} value={report.visitors} locale={locale} tone="accent" />
          </div>
          <HomeCard className="pb-4">
            <HomeCardHeader title={t("chartTitle")} description={t("chartDescription")} />
            <ViewsChart data={report.daily} />
          </HomeCard>
          <p className="text-xs text-muted-foreground">{t("delayNote")}</p>
        </>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  hint,
  value,
  locale,
  tone = "primary",
}: {
  icon: typeof Eye;
  label: string;
  hint: string;
  value: number;
  locale: string;
  tone?: "primary" | "accent";
}) {
  return (
    <HomeCard className="flex items-center gap-3 p-5">
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-montserrat text-2xl font-bold tabular-nums">{formatNumber(value, locale, { maximumFractionDigits: 0 })}</p>
        <p className="text-[11px] text-faint">{hint}</p>
      </div>
    </HomeCard>
  );
}

/** Daily views (area) and visitors (line). RTL puts the newest day on the left. */
function ViewsChart({ data }: { data: StoreViewsReport["daily"] }) {
  const t = useTranslations("storeAnalytics");
  const locale = useLocale();
  const rtl = locale.startsWith("ar");
  const labelOf = (day: string) => formatDate(`${day}T00:00:00`, locale, { day: "numeric", month: "short" });
  const empty = data.every((d) => d.views === 0);
  const every = data.length <= 7 ? 1 : data.length <= 30 ? 5 : 15;
  const ticks = data.filter((_, i) => (data.length - 1 - i) % every === 0).map((d) => d.day);

  return (
    <div className="relative px-3 pt-3">
      <div className="h-[260px] w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-faint [&_.recharts-surface]:outline-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 4" className="stroke-border" />
            <XAxis
              dataKey="day"
              reversed={rtl}
              ticks={ticks}
              tickFormatter={labelOf}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[11px]"
            />
            <YAxis
              orientation={rtl ? "right" : "left"}
              width={40}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickCount={5}
              tickFormatter={(v: number) => formatCompactNumber(v, locale)}
              className="font-montserrat text-[11px]"
            />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as StoreViewsReport["daily"][number] | undefined;
                if (!active || !point) return null;
                return (
                  <div className="rounded-[10px] bg-foreground px-2.5 py-2 text-xs leading-normal text-background shadow-lg">
                    <div>{labelOf(point.day)}</div>
                    <b className="font-montserrat">{formatNumber(point.views, locale)}</b> {t("views")} ·{" "}
                    <b className="font-montserrat">{formatNumber(point.visitors, locale)}</b> {t("visitors")}
                  </div>
                );
              }}
            />
            <Area
              dataKey="views"
              type="monotone"
              stroke={VIEWS}
              strokeWidth={2.25}
              fill={VIEWS}
              fillOpacity={0.08}
              activeDot={{ r: 5, strokeWidth: 2.5, fill: "var(--card)", stroke: VIEWS }}
              isAnimationActive={!empty}
            />
            <Line dataKey="visitors" type="monotone" stroke={VISITORS} strokeWidth={2} dot={false} isAnimationActive={!empty} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {empty && (
        <div className="absolute inset-0 grid place-items-center text-center text-[13px] text-muted-foreground">
          <div className="flex flex-col items-center gap-1.5 rounded-xl border bg-card px-[18px] py-3">
            <b className="text-foreground">{t("emptyTitle")}</b>
            <span>{t("emptyDescription")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
