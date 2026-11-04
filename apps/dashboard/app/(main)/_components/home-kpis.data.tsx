import { Banknote, Eye, Percent, Receipt, ShoppingBag, Star, UserPlus, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { formatNumber, formatWalletMoney, moneyUnitMarked } from "@/lib/i18n/format";
import { MoneyLines, MoneyText } from "@/components/money";
import { KpiCard, KpiGrid, StatItem, StatStrip } from "@/components/seller-ui";
import {
  getHomeChannelStores,
  getHomeSnapshot,
  getHomeTrafficFor,
  getNewCustomers,
  getSalesOverview,
  getStoreFunnel,
} from "./home.queries";
import type { HomeChannel, HomeRange } from "./home.shared";
import { StarRating, percentChange } from "./home-ui";
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

  // Visits only exist for store websites (GA4), not for orders outside a store.
  const storesOnly = storeIds.length === 0;
  const visits = traffic?.visits ?? 0;
  const hasVisits = visits > 0 || (traffic?.previousVisits ?? 0) > 0;
  const conversion = visits > 0 ? (funnel.orders / visits) * 100 : null;
  const previousConversion =
    traffic && traffic.previousVisits > 0 ? (funnel.previousOrders / traffic.previousVisits) * 100 : null;

  return (
    <KpiGrid>
      <KpiCard
        href="/financial"
        label={t("sales")}
        icon={Banknote}
        value={num(sales.revenue)}
        unit={<MoneyText locale={locale}>{moneyUnitMarked(locale, { currency: sales.currency })}</MoneyText>}
        also={sales.otherTotals.length > 0 && <MoneyLines totals={sales.otherTotals} locale={locale} />}
        footer={hasSales ? t("vsPrevious") : t("noSales")}
        delta={hasSales ? percentChange(sales.revenue, sales.previousRevenue) : null}
      />
      <KpiCard
        href="/orders"
        label={t("orders")}
        icon={ShoppingBag}
        value={num(sales.orders)}
        unit={t("ordersUnit")}
        footer={hasSales ? t("vsPrevious") : t("noOrders")}
        delta={hasSales ? percentChange(sales.orders, sales.previousOrders) : null}
      />
      <KpiCard
        href={analyticsHref}
        label={t("visits")}
        icon={Eye}
        value={traffic ? num(visits) : "—"}
        unit={traffic ? t("visitsUnit") : undefined}
        footer={storesOnly ? t("visitsStoresOnly") : hasVisits ? t("vsPrevious") : t("noVisits")}
        delta={hasVisits ? percentChange(visits, traffic?.previousVisits ?? 0) : null}
      />
      <KpiCard
        href={analyticsHref}
        label={t("conversion")}
        icon={Percent}
        value={conversion === null ? "—" : num(conversion, 1)}
        unit={conversion === null ? undefined : "%"}
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
  const usdWallet = snapshot?.walletCurrency === "USD";
  const rating = snapshot?.storeRating;
  const hasRating = rating != null && (snapshot?.totalRatings ?? 0) > 0;

  return (
    <StatStrip aria-label={tm("label")}>
      <StatItem
        href="/orders"
        icon={Receipt}
        label={tm("aov")}
        value={sales.currencyOrders > 0 ? num(sales.revenue / sales.currencyOrders) : "0"}
        unit={<MoneyText locale={locale}>{moneyUnitMarked(locale, { currency: sales.currency })}</MoneyText>}
      />
      <StatItem href="/orders" icon={UserPlus} label={tm("newCustomers")} value={num(newCustomers)} unit={tm("customersUnit")} />
      <StatItem
        // sellers.wallet_balance mirrors the store wallet, which pays platform fees (no withdrawals).
        href={walletState === "negative" ? "/wallet?topup=1" : "/wallet"}
        icon={Wallet}
        tone={walletState === "negative" ? "danger" : "accent"}
        label={t("storeWallet")}
        value={usdWallet ? <bdi dir="ltr">{formatWalletMoney(wallet, "USD", locale)}</bdi> : num(wallet, 2)}
        unit={usdWallet ? undefined : t("currency")}
        note={walletState === "negative" ? t("walletNegative") : undefined}
        noteTone={walletState === "negative" ? "danger" : undefined}
      />
      <StatItem
        href="/reviews"
        icon={Star}
        label={t("rating")}
        value={hasRating ? num(rating!, 1) : "—"}
        unit={hasRating ? "/ 5" : undefined}
        note={hasRating ? <StarRating value={rating!} label={t("ratingLabel", { rating: num(rating!, 1) })} /> : t("noRatings")}
      />
    </StatStrip>
  );
}
