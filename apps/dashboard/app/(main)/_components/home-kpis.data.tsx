import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Banknote, ShoppingBag, Star, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/i18n/format";
import { getHomeSnapshot, getSalesOverview } from "./home.queries";
import type { HomeChannel, HomeRange } from "./home.shared";
import { DeltaBadge, HomeCard, IconTile, StarRating, percentChange } from "./home-ui";

export async function HomeKpisData({ range, channel = "all" }: { range: HomeRange; channel?: HomeChannel }) {
  const [snapshot, sales, t, locale] = await Promise.all([
    getHomeSnapshot(),
    getSalesOverview(range, channel),
    getTranslations("home.kpis"),
    getLocale(),
  ]);

  const num = (value: number, digits = 0) =>
    formatNumber(value, locale, { maximumFractionDigits: digits });
  const currency = t("currency");
  const hasSales = sales.orders > 0 || sales.previousOrders > 0;
  const rating = snapshot?.storeRating;
  const hasRating = rating != null && (snapshot?.totalRatings ?? 0) > 0;

  return (
    <KpiGrid>
      <KpiCard
        label={t("sales")}
        icon={Banknote}
        value={num(sales.revenue)}
        unit={currency}
        footer={hasSales ? t("vsPrevious") : t("noSales")}
        delta={hasSales ? percentChange(sales.revenue, sales.previousRevenue) : null}
      />
      <KpiCard
        label={t("orders")}
        icon={ShoppingBag}
        value={num(sales.orders)}
        unit={t("ordersUnit")}
        footer={
          sales.orders > 0
            ? t("averageOrder", { value: num(sales.revenue / sales.orders), currency })
            : t("noOrders")
        }
        delta={hasSales ? percentChange(sales.orders, sales.previousOrders) : null}
      />
      <KpiCard
        label={t("wallet")}
        icon={Wallet}
        value={num(snapshot?.walletBalance ?? 0, 2)}
        unit={currency}
        footer={
          (snapshot?.walletBalance ?? 0) > 0 ? (
            <Link href="/financial" className="text-primary-ink hover:underline">
              {t("withdraw")}
            </Link>
          ) : (
            t("walletEmpty")
          )
        }
      />
      <KpiCard
        label={t("rating")}
        icon={Star}
        value={hasRating ? num(rating!, 1) : "—"}
        unit={hasRating ? "/ 5" : undefined}
        footer={
          hasRating ? (
            <span className="flex flex-wrap items-center gap-2">
              <StarRating value={rating!} label={t("ratingLabel", { rating: num(rating!, 1) })} />
              {snapshot?.positiveRatingPercent != null && (
                <span>
                  {t("positive", {
                    percent: formatNumber(snapshot.positiveRatingPercent / 100, locale, {
                      style: "percent",
                      maximumFractionDigits: 0,
                    }),
                  })}
                </span>
              )}
            </span>
          ) : (
            t("noRatings")
          )
        }
      />
    </KpiGrid>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 xl:grid-cols-4">
      {children}
    </div>
  );
}

/** One headline number with its icon, unit, footnote and optional period delta. */
export function KpiCard({
  label,
  icon,
  value,
  unit,
  footer,
  delta,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  unit?: string;
  footer?: React.ReactNode;
  /** Omit for metrics that are not period-based. */
  delta?: number | null;
}) {
  return (
    <HomeCard className="flex flex-col gap-3.5 p-3.5 sm:px-5 sm:py-[18px]">
      <div className="flex items-center justify-between gap-2 text-[13px] text-muted-foreground">
        <span>{label}</span>
        <IconTile icon={icon} />
      </div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <b className="font-montserrat text-[22px] font-extrabold leading-none tabular-nums sm:text-[28px]">
          {value}
        </b>
        {unit && <span className="text-[13px] text-muted-foreground">{unit}</span>}
      </div>
      <div className="flex min-h-[22px] items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="min-w-0">{footer}</span>
        {delta !== undefined && <DeltaBadge value={delta} />}
      </div>
    </HomeCard>
  );
}
