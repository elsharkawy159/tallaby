import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Banknote, Eye, Percent, Receipt, ShoppingBag, Star, UserPlus, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { formatNumber } from "@/lib/i18n/format";
import {
  getHomeChannelStores,
  getHomeSnapshot,
  getHomeTrafficFor,
  getNewCustomers,
  getSalesOverview,
  getStoreFunnel,
} from "./home.queries";
import type { HomeChannel, HomeRange } from "./home.shared";
import { DeltaBadge, HomeCard, IconTile, Sparkline, StarRating, percentChange, type Tone } from "./home-ui";
import { walletKpiState } from "./wallet-kpi.lib";

/** Sales, orders, store-website visits and conversion for the period, each linking to its page. */
export async function HomeKpisData({ range, channel = "all" }: { range: HomeRange; channel?: HomeChannel }) {
  const [sales, traffic, funnel, { storeIds, analyticsStoreId }, t, locale] = await Promise.all([
    getSalesOverview(range, channel),
    getHomeTrafficFor(range, channel),
    getStoreFunnel(range, channel),
    getHomeChannelStores(channel),
    getTranslations("home.kpis"),
    getLocale(),
  ]);

  const num = (value: number, digits = 0) => formatNumber(value, locale, { maximumFractionDigits: digits });
  const hasSales = sales.orders > 0 || sales.previousOrders > 0;
  const analyticsHref = analyticsStoreId ? `/stores/${analyticsStoreId}/analytics` : "/stores";

  // Visits only exist for store websites (GA4); marketplace sales have none.
  const storesOnly = storeIds.length === 0;
  const visits = traffic?.visits ?? 0;
  const hasVisits = visits > 0 || (traffic?.previousVisits ?? 0) > 0;
  const conversion = visits > 0 ? (funnel.orders / visits) * 100 : null;
  const previousConversion =
    traffic && traffic.previousVisits > 0 ? (funnel.previousOrders / traffic.previousVisits) * 100 : null;
  const dailyConversion = traffic
    ? traffic.daily.map((v, i) => (v > 0 ? (funnel.dailyOrders[i] ?? 0) / v : 0))
    : [];

  return (
    <KpiGrid>
      <KpiCard
        href="/financial"
        label={t("sales")}
        icon={Banknote}
        value={num(sales.revenue)}
        unit={t("currency")}
        trend={sales.series.map((p) => p.revenue)}
        footer={hasSales ? t("vsPrevious") : t("noSales")}
        delta={hasSales ? percentChange(sales.revenue, sales.previousRevenue) : null}
      />
      <KpiCard
        href="/orders"
        label={t("orders")}
        icon={ShoppingBag}
        value={num(sales.orders)}
        unit={t("ordersUnit")}
        trend={sales.series.map((p) => p.orders)}
        footer={hasSales ? t("vsPrevious") : t("noOrders")}
        delta={hasSales ? percentChange(sales.orders, sales.previousOrders) : null}
      />
      <KpiCard
        href={analyticsHref}
        label={t("visits")}
        icon={Eye}
        value={traffic ? num(visits) : "—"}
        unit={traffic ? t("visitsUnit") : undefined}
        trend={traffic?.daily ?? []}
        footer={storesOnly ? t("visitsStoresOnly") : hasVisits ? t("vsPrevious") : t("noVisits")}
        delta={hasVisits ? percentChange(visits, traffic?.previousVisits ?? 0) : null}
      />
      <KpiCard
        href={analyticsHref}
        label={t("conversion")}
        icon={Percent}
        value={conversion === null ? "—" : num(conversion, 1)}
        unit={conversion === null ? undefined : "%"}
        trend={dailyConversion}
        footer={storesOnly ? t("visitsStoresOnly") : conversion === null ? t("noVisits") : t("conversionHint")}
        delta={
          conversion !== null && previousConversion !== null ? percentChange(conversion, previousConversion) : null
        }
      />
    </KpiGrid>
  );
}

/** Secondary numbers under the KPIs: average order, new customers, store wallet and rating. */
export async function HomeMetricsData({ range, channel = "all" }: { range: HomeRange; channel?: HomeChannel }) {
  const [sales, newCustomers, snapshot, t, tm, locale] = await Promise.all([
    getSalesOverview(range, channel),
    getNewCustomers(range, channel),
    getHomeSnapshot(),
    getTranslations("home.kpis"),
    getTranslations("home.metrics"),
    getLocale(),
  ]);
  const num = (value: number, digits = 0) => formatNumber(value, locale, { maximumFractionDigits: digits });
  const wallet = snapshot?.walletBalance ?? 0;
  const walletState = walletKpiState(wallet);
  const rating = snapshot?.storeRating;
  const hasRating = rating != null && (snapshot?.totalRatings ?? 0) > 0;

  return (
    <MetricsStrip label={tm("label")}>
      <Metric
        href="/orders"
        icon={Receipt}
        label={tm("aov")}
        value={sales.orders > 0 ? num(sales.revenue / sales.orders) : "0"}
        unit={t("currency")}
      />
      <Metric href="/orders" icon={UserPlus} tone="accent" label={tm("newCustomers")} value={num(newCustomers)} unit={tm("customersUnit")} />
      <Metric
        // sellers.wallet_balance mirrors the store wallet, which pays platform fees (no withdrawals).
        href={walletState === "negative" ? "/wallet?topup=1" : "/wallet"}
        icon={Wallet}
        tone={walletState === "negative" ? "danger" : "success"}
        label={t("storeWallet")}
        value={num(wallet, 2)}
        unit={t("currency")}
        note={walletState === "negative" ? t("walletNegative") : undefined}
      />
      <Metric
        href="/reviews"
        icon={Star}
        tone="accent"
        label={t("rating")}
        value={hasRating ? num(rating!, 1) : "—"}
        unit={hasRating ? "/ 5" : undefined}
        note={
          hasRating ? (
            <StarRating value={rating!} label={t("ratingLabel", { rating: num(rating!, 1) })} />
          ) : (
            t("noRatings")
          )
        }
      />
    </MetricsStrip>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 xl:grid-cols-4">{children}</div>;
}

/** One headline number with its icon, unit, trend line, footnote and period delta. The card opens `href`. */
export function KpiCard({
  href,
  label,
  icon,
  value,
  unit,
  trend,
  footer,
  delta,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  value: string;
  unit?: string;
  trend: number[];
  footer?: React.ReactNode;
  /** Omit for metrics that are not period-based. */
  delta?: number | null;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col gap-2.5 rounded-2xl border bg-card p-3.5 text-card-foreground shadow-xs transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:px-5 sm:pb-3.5 sm:pt-[18px]"
    >
      <div className="flex items-center justify-between gap-2 text-[13px] text-muted-foreground">
        <span className="group-hover:text-primary-ink">{label}</span>
        <IconTile icon={icon} />
      </div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <b className="font-montserrat text-[22px] font-semibold leading-none tabular-nums sm:text-[28px]">{value}</b>
        {unit && <span className="text-[13px] text-muted-foreground">{unit}</span>}
      </div>
      <Sparkline values={trend} />
      <div className="flex min-h-[22px] items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="min-w-0">{footer}</span>
        {delta !== undefined && <DeltaBadge value={delta} />}
      </div>
    </Link>
  );
}

export function MetricsStrip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <HomeCard
      aria-label={label}
      // 1px gaps over a border-coloured background draw the dividers at every breakpoint.
      className="grid grid-cols-1 gap-px overflow-hidden bg-border sm:grid-cols-2 xl:grid-cols-4"
    >
      {children}
    </HomeCard>
  );
}

function Metric({
  href,
  icon,
  tone = "primary",
  label,
  value,
  unit,
  note,
}: {
  href: string;
  icon: LucideIcon;
  tone?: Tone;
  label: string;
  value: string;
  unit?: string;
  note?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 bg-card px-5 py-4 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
    >
      <IconTile icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <small className="block text-xs text-muted-foreground group-hover:text-primary-ink">{label}</small>
        <b className="font-montserrat text-lg font-semibold leading-snug tabular-nums">
          {value}
          {unit && <span className="ms-1 font-noto-kufi-arabic text-xs font-medium text-muted-foreground">{unit}</span>}
        </b>
        {note && (
          <small className={cn("block text-[11px]", tone === "danger" ? "font-medium text-destructive" : "text-muted-foreground")}>
            {note}
          </small>
        )}
      </span>
    </Link>
  );
}
