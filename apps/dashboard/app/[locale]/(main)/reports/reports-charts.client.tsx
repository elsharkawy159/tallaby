"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FunnelStep, SourceRow } from "./reports.lib";
import type { GovernorateChartRow } from "./reports.client";

/*
 * The recharts parts of Dashboard › Reports, loaded as their own chunk by the
 * chart components in reports.client.tsx (docs/plans/dashboard-performance.md A6).
 * Each one fills the sized box its caller renders; copy and tooltips come from the caller.
 */

export type FunnelBarDatum = FunnelStep & { label: string; fill: string };

export function FunnelBars({
  data,
  rtl,
  tooltip,
}: {
  data: FunnelBarDatum[];
  rtl: boolean;
  tooltip: (step: FunnelBarDatum) => React.ReactNode;
}) {
  return (
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
            const step = payload?.[0]?.payload as FunnelBarDatum | undefined;
            if (!active || !step) return null;
            return tooltip(step);
          }}
        />
        <Bar dataKey="value" radius={6} maxBarSize={30} minPointSize={2}>
          {data.map((s) => (
            <Cell key={s.key} fill={s.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SourcesDonut({
  data,
  colors,
  tooltip,
}: {
  data: SourceRow[];
  colors: Record<SourceRow["source"], string>;
  tooltip: (row: SourceRow) => React.ReactNode;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="revenuePiastres" nameKey="source" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
          {data.map((r) => (
            <Cell key={r.source} fill={colors[r.source]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as SourceRow | undefined;
            if (!active || !row) return null;
            return tooltip(row);
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function GovernorateBars({
  rows,
  rtl,
  series,
  tooltip,
}: {
  rows: GovernorateChartRow[];
  rtl: boolean;
  series: readonly { key: "delivered" | "refused" | "cancelled" | "open"; fill: string }[];
  tooltip: (row: GovernorateChartRow) => React.ReactNode;
}) {
  return (
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
            return tooltip(row);
          }}
        />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} stackId="outcome" fill={s.fill} maxBarSize={20} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
