import Link from "next/link";
import { FileText } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { formatNumber } from "@/lib/i18n/format";
import { getHomeSnapshot, getSalesOverview } from "./home.queries";
import type { HomeChannel, HomeRange } from "./home.shared";
import { HomeCard, HomeCardHeader } from "./home-ui";
import { SalesChart } from "./sales-chart.client";

export async function SalesChartData({ range, channel = "all" }: { range: HomeRange; channel?: HomeChannel }) {
  const [sales, snapshot, t, locale] = await Promise.all([
    getSalesOverview(range, channel),
    getHomeSnapshot(),
    getTranslations("home.chart"),
    getLocale(),
  ]);

  return (
    <SalesChartCard
      title={t("title")}
      subtitle={t("lastDays", { count: range })}
      statementLabel={t("statement")}
    >
      <div className="flex flex-wrap gap-7 px-5 pt-3.5">
        <ChartSummary
          label={t("revenue")}
          swatch="bg-primary"
          value={formatNumber(sales.revenue, locale, { maximumFractionDigits: 0 })}
          unit={t("currency")}
        />
        <ChartSummary
          label={t("orders")}
          swatch="bg-accent"
          value={formatNumber(sales.orders, locale)}
        />
      </div>
      <div className="px-5 pb-[18px] pt-2">
        <SalesChart data={sales.series} hasOrders={snapshot?.hasOrders ?? false} />
      </div>
    </SalesChartCard>
  );
}

/** Card frame, shared with the skeleton. */
export function SalesChartCard({
  title,
  subtitle,
  statementLabel,
  children,
}: {
  title: string;
  subtitle: React.ReactNode;
  statementLabel: string;
  children: React.ReactNode;
}) {
  return (
    <HomeCard aria-labelledby="sales-title">
      <HomeCardHeader
        id="sales-title"
        title={title}
        description={subtitle}
        action={
          <Button asChild variant="neutral" size="sm" className="rounded-[9px] text-xs">
            <Link href="/financial">
              <FileText aria-hidden />
              {statementLabel}
            </Link>
          </Button>
        }
      />
      {children}
    </HomeCard>
  );
}

function ChartSummary({
  label,
  swatch,
  value,
  unit,
}: {
  label: string;
  swatch: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex flex-col">
      <small className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <i className={`size-2.5 rounded-[3px] ${swatch}`} aria-hidden />
        {label}
      </small>
      <b className="font-montserrat text-xl font-extrabold tabular-nums">
        {value}
        {unit && <span className="ms-1 font-noto-kufi-arabic text-[13px] font-medium text-muted-foreground">{unit}</span>}
      </b>
    </div>
  );
}
