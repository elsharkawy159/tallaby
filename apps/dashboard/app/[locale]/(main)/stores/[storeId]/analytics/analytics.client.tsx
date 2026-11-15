"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, LineChart, RefreshCw, Users } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, KpiCard, Note, PageTabs, SellerButton, SellerCard, SellerCardHeader } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { formatCompactNumber, formatDate, formatNumber, formatRelativeTime } from "@/lib/i18n/format";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { STORE_VIEWS_AUTO_REFRESH_MS, STORE_VIEWS_RANGES, type StoreViewsRange, type StoreViewsReport } from "@/lib/analytics/store-views.lib";
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
  useAutoRefresh(STORE_VIEWS_AUTO_REFRESH_MS, state !== "notConfigured");

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
      <SellerCard className="sui-rise">
        <EmptyState icon={LineChart} title={t("notConfiguredTitle")} description={t("notConfiguredDescription")} />
      </SellerCard>
    );
  }

  return (
    <>
      <div className="sui-rise flex flex-wrap items-center justify-between gap-3">
        <PageTabs
          sticky={false}
          label={t("rangeLabel")}
          value={String(range)}
          className="max-[600px]:w-full"
          tabs={STORE_VIEWS_RANGES.map((days) => ({ key: String(days), label: t("range", { days }), href: `/stores/${storeId}/analytics?range=${days}` }))}
        />
        <div className="flex items-center gap-3 max-[600px]:w-full max-[600px]:justify-between">
          {report && <span className="text-xs text-(--s-subtle)">{t("updated", { time: formatRelativeTime(report.fetchedAt, locale) })}</span>}
          <SellerButton variant="mini" size="sm" onClick={refresh} disabled={isPending}>
            <RefreshCw className={cn(isPending && "animate-spin")} aria-hidden />
            {t("refresh")}
          </SellerButton>
        </div>
      </div>

      {offline && <Note tone="amber">{t("offline")}</Note>}

      {state === "error" || !report ? (
        <SellerCard className="sui-rise">
          <EmptyState icon={LineChart} title={t("errorTitle")} description={t("errorDescription")} />
        </SellerCard>
      ) : (
        <>
          <div className="sui-rise grid grid-cols-2 gap-3.5 [animation-delay:.05s] max-[480px]:gap-2.5">
            <KpiCard icon={Eye} label={t("views")} footer={t("viewsHint")} value={formatNumber(report.views, locale, { maximumFractionDigits: 0 })} />
            <KpiCard icon={Users} tone="accent" label={t("visitors")} footer={t("visitorsHint")} value={formatNumber(report.visitors, locale, { maximumFractionDigits: 0 })} />
          </div>
          <SellerCard className="sui-rise pb-4 [animation-delay:.1s]">
            <SellerCardHeader title={t("chartTitle")} description={t("chartDescription")} />
            <ViewsChart data={report.daily} />
          </SellerCard>
          <p className="text-pretty text-xs text-(--s-faint)">{t("delayNote")}</p>
        </>
      )}
    </>
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
      <div className="h-[260px] w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-(--s-faint) [&_.recharts-surface]:outline-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 4" className="stroke-(--s-line-soft)" />
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
              cursor={{ stroke: "var(--s-line)" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as StoreViewsReport["daily"][number] | undefined;
                if (!active || !point) return null;
                return (
                  <div className="rounded-[10px] bg-(--s-solid) px-2.5 py-2 text-xs leading-normal text-(--s-solid-fg) shadow-(--s-shadow-menu)">
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
        <div className="absolute inset-0 grid place-items-center text-center text-[13px] text-(--s-muted)">
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-(--s-line) bg-(--s-surface) px-[18px] py-3">
            <b className="font-bold text-(--s-ink)">{t("emptyTitle")}</b>
            <span>{t("emptyDescription")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
