"use client";

import { useLocale, useTranslations } from "next-intl";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactNumber, formatDate, formatNumber } from "@/lib/i18n/format";
import type { StoreViewsReport } from "@/lib/analytics/store-views.lib";

const VIEWS = "var(--primary)";
const VISITORS = "var(--accent)";

/**
 * The recharts part of the store views chart, loaded as its own chunk by
 * `ViewsChart` (docs/plans/dashboard-performance.md A6). It fills the sized
 * box `ViewsChart` renders around it.
 */
export function ViewsChartCanvas({ data, empty }: { data: StoreViewsReport["daily"]; empty: boolean }) {
  const t = useTranslations("storeAnalytics");
  const locale = useLocale();
  const rtl = locale.startsWith("ar");
  const labelOf = (day: string) => formatDate(`${day}T00:00:00`, locale, { day: "numeric", month: "short" });
  const every = data.length <= 7 ? 1 : data.length <= 30 ? 5 : 15;
  const ticks = data.filter((_, i) => (data.length - 1 - i) % every === 0).map((d) => d.day);

  return (
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
  );
}
