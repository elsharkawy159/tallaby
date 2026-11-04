"use client";

import { LineChart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactNumber, formatDate, formatNumber } from "@/lib/i18n/format";
import { IconTile, SellerButton } from "@/components/seller-ui";
import { useRange } from "./home-range.client";

export type SalesChartPoint = { day: string; revenue: number; orders: number };

const REVENUE = "var(--s-primary)";
const ORDERS = "var(--accent)";

/** Revenue line over daily order bars. RTL puts the newest day on the left. */
export function SalesChart({
  data,
  hasOrders,
  unit,
}: {
  data: SalesChartPoint[];
  /** The currency the revenue line is in. */
  unit: string;
  /** Whether the store has ever had an order (picks the empty-state copy). */
  hasOrders: boolean;
}) {
  const t = useTranslations("home.chart");
  const locale = useLocale();
  const { range, setRange } = useRange();
  const rtl = locale.startsWith("ar");
  const labelOf = (day: string) =>
    formatDate(`${day}T00:00:00`, locale, { day: "numeric", month: "short" });
  const number = { format: (v: number) => formatNumber(v, locale, { maximumFractionDigits: 0 }) };

  const empty = data.every((p) => p.revenue === 0 && p.orders === 0);
  const maxOrders = Math.max(1, ...data.map((p) => p.orders));
  // Thin out x labels on long ranges, always keeping the latest day.
  const every = data.length <= 7 ? 1 : data.length <= 30 ? 5 : 15;
  const ticks = data.filter((_, i) => (data.length - 1 - i) % every === 0).map((p) => p.day);

  return (
    <div className="relative">
      <div className="h-[240px] w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-faint [&_.recharts-surface]:outline-hidden">
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
            yAxisId="revenue"
            orientation={rtl ? "right" : "left"}
            width={44}
            tickLine={false}
            axisLine={false}
            tickCount={5}
            tickFormatter={(v: number) => formatCompactNumber(v, locale)}
            className="font-montserrat text-[11px]"
          />
          {/* Bars get their own hidden scale so they stay below the revenue line. */}
          <YAxis yAxisId="orders" hide domain={[0, maxOrders * 2.2]} />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as SalesChartPoint | undefined;
              if (!active || !point) return null;
              return (
                <div className="rounded-[10px] bg-foreground px-2.5 py-2 text-xs leading-normal text-background shadow-lg">
                  <div>{labelOf(point.day)}</div>
                  <b className="font-montserrat">{number.format(point.revenue)}</b> {unit} ·{" "}
                  <b className="font-montserrat">{number.format(point.orders)}</b>{" "}
                  {t("ordersShort", { count: point.orders })}
                </div>
              );
            }}
          />
          <Bar
            yAxisId="orders"
            dataKey="orders"
            fill={ORDERS}
            fillOpacity={0.55}
            radius={3}
            maxBarSize={14}
            isAnimationActive={!empty}
          />
          <Area
            yAxisId="revenue"
            dataKey="revenue"
            type="monotone"
            stroke={REVENUE}
            strokeWidth={2.25}
            fill={REVENUE}
            fillOpacity={0.08}
            activeDot={{ r: 5, strokeWidth: 2.5, fill: "var(--card)", stroke: REVENUE }}
            isAnimationActive={!empty}
          />
        </ComposedChart>
        </ResponsiveContainer>
      </div>

      {empty && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 top-0 grid place-items-center text-center">
          <div className="pointer-events-auto flex flex-col items-center gap-1.5 rounded-[20px] border border-(--s-line) bg-(--s-surface) px-[22px] py-4 shadow-[0_14px_34px_rgb(13_55_67/0.08)]">
            <IconTile icon={LineChart} className="size-10 rounded-[13px]" />
            <b className="text-sm font-bold text-(--s-ink)">{t(hasOrders ? "emptyRangeTitle" : "emptyTitle")}</b>
            <span className="text-[12.5px] text-(--s-subtle)">{t(hasOrders ? "emptyRangeDescription" : "emptyDescription")}</span>
            {hasOrders && range < 30 && (
              <SellerButton variant="mini" size="xs" className="mt-1.5" onClick={() => setRange(30)}>
                {t("try30")}
              </SellerButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
