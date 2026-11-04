import Link from "next/link";
import { FileText } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { SellerButton, SellerCard, SellerCardHeader } from "@/components/seller-ui";
import { formatNumber, moneyUnitMarked, moneyUnitText } from "@/lib/i18n/format";
import { MoneyLines, MoneyText } from "@/components/money";
import { getHomeSnapshot, getSalesOverview } from "./home.queries";
import type { HomeChannel, HomeRange } from "./home.shared";
import { SalesChart } from "./sales-chart.client";

export async function SalesChartData({ range, channel = "all" }: { range: HomeRange; channel?: HomeChannel }) {
  const [sales, snapshot, t, locale] = await Promise.all([
    getSalesOverview(range, channel),
    getHomeSnapshot(),
    getTranslations("home.chart"),
    getLocale(),
  ]);

  return (
    <SellerCard aria-labelledby="sales-title">
      <SellerCardHeader
        id="sales-title"
        title={t("title")}
        description={t("lastDays", { count: range })}
        action={
          <SellerButton asChild variant="mini" size="xs">
            <Link href="/financial">
              <FileText aria-hidden />
              {t("statement")}
            </Link>
          </SellerButton>
        }
      />
      <div className="flex flex-wrap gap-[18px] px-[22px] pt-3.5 max-[600px]:px-4">
        <ChartSummary
          label={t("revenue")}
          swatch="bg-(--s-primary)"
          value={formatNumber(sales.revenue, locale, { maximumFractionDigits: 0 })}
          unit={<MoneyText locale={locale}>{moneyUnitMarked(locale, { currency: sales.currency })}</MoneyText>}
        />
        {sales.otherTotals.length > 0 && (
          <div className="self-end text-xs font-medium text-(--s-subtle) tabular-nums">
            <MoneyLines totals={sales.otherTotals} locale={locale} />
          </div>
        )}
        <ChartSummary label={t("orders")} swatch="bg-accent" value={formatNumber(sales.orders, locale)} />
      </div>
      <div className="px-[22px] pb-[18px] pt-2 max-[600px]:px-4">
        <SalesChart
          data={sales.series}
          unit={moneyUnitText(locale, { currency: sales.currency })}
          hasOrders={snapshot?.hasOrders ?? false}
        />
      </div>
    </SellerCard>
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
  unit?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <small className="flex items-center gap-1.5 text-xs text-(--s-subtle)">
        <i className={`size-2 rounded-[3px] ${swatch}`} aria-hidden />
        {label}
      </small>
      <b className="font-montserrat text-xl font-bold text-(--s-ink) tabular-nums">
        {value}
        {unit && <span className="ms-1 font-sans text-xs font-medium text-(--s-subtle)">{unit}</span>}
      </b>
    </div>
  );
}
