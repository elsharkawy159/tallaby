import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, PackageX, Percent, ReceiptText, ShoppingBag, Trophy, Truck, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/i18n/format";
import { isAccessError, requireOrdersStore } from "@/lib/auth/require-seller.server";
import { getHomeTraffic } from "@/lib/analytics/home-traffic.server";
import { isStoreViewsConfigured } from "@/lib/analytics/store-views.server";
import { LEAD_RETENTION_DAYS } from "@workspace/lib/checkout-leads";
import { EmptyState, HeaderLink, HomeCard, HomeCardHeader, ProductThumb } from "../_components/home-ui";
import { KpiCard, KpiGrid, Note as SellerNote, ResponsiveTable } from "@/components/seller-ui";
import type { LucideIcon } from "lucide-react";
import { getStoreReport } from "./reports.server";
import { MoneyText } from "@/components/money";
import { moneyUnitMarked, moneyUnitText } from "@/lib/i18n/format";
import { loadStoreMoney } from "@/lib/stores/account-money.server";
import {
  averageOrderPiastres,
  funnelSteps,
  governorateRows,
  outcomeRates,
  reportPeriod,
  sourceRows,
  sumOutcomes,
  worstProducts,
  type ReportProduct,
  type ReportRange,
} from "./reports.lib";
import { FunnelChart, GovernorateChart, SourcesChart } from "./reports.client";
import { storeProductsHref } from "@/lib/products/product-routes.lib";

/** Governorates drawn in the chart; the table below lists them all. */
const CHART_GOVERNORATES = 8;

/**
 * One store's report (ROADMAP.md F-15a). The store id from the URL is checked
 * against the session's seller, and an activated one, before any query runs.
 */
export async function StoreReportData({ storeId, range }: { storeId: string; range: ReportRange }) {
  let access;
  try {
    access = await requireOrdersStore(storeId);
  } catch (error) {
    if (isAccessError(error)) notFound();
    throw error;
  }
  const { seller, store } = access;
  const [locale, t, storeMoney] = await Promise.all([getLocale(), getTranslations("reports"), loadStoreMoney(seller.sellerId)]);
  const storeUnit = { currency: storeMoney[store.id]?.currency ?? "EGP", label: storeMoney[store.id]?.label };
  const unit = <MoneyText locale={locale}>{moneyUnitMarked(locale, storeUnit)}</MoneyText>;
  const period = reportPeriod(range);
  const [report, traffic] = await Promise.all([
    getStoreReport(seller.sellerId, store.id, period.start, locale, storeUnit.currency),
    getHomeTraffic(seller.sellerId, [store.id], range),
  ]);
  if (!report) notFound();

  const governorates = governorateRows(report.governorates, locale, t("governorates.unknown"));
  const totals = sumOutcomes(governorates);
  const rates = outcomeRates(totals);
  // Old orders from before the seller's own store may come from tallaby.com; the row shows only when they exist.
  const sources = sourceRows(report.sources).filter((s) => s.source !== "marketplace" || s.orders > 0);
  const storeSales = sources.find((s) => s.source === "store") ?? { orders: 0, revenuePiastres: 0 };
  const aov = averageOrderPiastres(storeSales.revenuePiastres, storeSales.orders);
  const steps = funnelSteps({
    views: traffic ? traffic.visits : null,
    abandonedCheckouts: report.abandonedCheckouts,
    orders: totals.orders,
    delivered: totals.delivered,
  });
  const worst = worstProducts(report.worstCandidates, report.best);

  const money = (piastres: number) => formatNumber(piastres / 100, locale, { maximumFractionDigits: 0 });
  const pct = (value: number | null) =>
    value === null ? "—" : formatNumber(value, locale, { style: "percent", maximumFractionDigits: 1 });
  const ga4 = isStoreViewsConfigured();

  return (
    <div className="flex flex-col gap-3.5">
      <KpiGrid className="grid-cols-3 max-[1180px]:grid-cols-2 [&>*>div:last-child]:hidden">
        <KpiCard icon={Wallet} label={t("kpi.revenue")} value={money(storeSales.revenuePiastres)} unit={unit} />
        <KpiCard icon={ShoppingBag} label={t("kpi.orders")} value={formatNumber(totals.orders, locale)} />
        <KpiCard icon={ReceiptText} label={t("kpi.aov")} value={aov === null ? "—" : money(aov)} unit={aov === null ? undefined : unit} />
        <KpiCard icon={Truck} tone="success" label={t("kpi.deliveryRate")} value={pct(rates.deliveryRate)} />
        <KpiCard icon={Percent} tone="danger" label={t("kpi.refusalRate")} value={pct(rates.refusalRate)} />
        <KpiCard icon={Ban} tone="accent" label={t("kpi.cancelRate")} value={pct(rates.cancelRate)} />
      </KpiGrid>

      <div className="grid grid-cols-2 gap-3.5 max-[1020px]:grid-cols-1">
        <HomeCard aria-labelledby="funnel-title" className="flex flex-col pb-4">
          <HomeCardHeader
            id="funnel-title"
            title={t("funnel.title")}
            description={t("funnel.description")}
            action={<HeaderLink href={`/stores/${store.id}/analytics`}>{t("funnel.viewAnalytics")}</HeaderLink>}
          />
          <div className="px-3 pt-3">
            <FunnelChart steps={steps} />
          </div>
          <ul className="mx-5 grid grid-cols-2 gap-2 text-xs text-(--s-subtle) max-[600px]:mx-4 sm:grid-cols-4">
            {steps.map((s) => (
              <li key={s.key} className="rounded-xl bg-(--s-tint) px-2.5 py-2">
                <span className="block truncate">{t(`funnel.${s.key}`)}</span>
                <b className="font-montserrat text-sm text-(--s-ink) tabular-nums">{formatNumber(s.value, locale)}</b>
                {s.fromPrevious !== null && <span className="ms-1 tabular-nums">({pct(s.fromPrevious)})</span>}
              </li>
            ))}
          </ul>
          <Note>
            {!ga4 ? t("funnel.noViews") : !traffic ? t("funnel.viewsUnavailable") : t("funnel.viewsNote")}{" "}
            {range > LEAD_RETENTION_DAYS && t("funnel.leadsRetention", { days: LEAD_RETENTION_DAYS })}
          </Note>
        </HomeCard>

        <HomeCard aria-labelledby="sources-title" className="flex flex-col pb-5">
          <HomeCardHeader id="sources-title" title={t("sources.title")} description={t("sources.description")} />
          <div className="px-5 pt-4 max-[600px]:px-4">
            <SourcesChart rows={sources} unit={moneyUnitText(locale, storeUnit)} />
          </div>
        </HomeCard>
      </div>

      <HomeCard aria-labelledby="gov-title" className="pb-5">
        <HomeCardHeader id="gov-title" title={t("governorates.title")} description={t("governorates.description")} />
        {governorates.length === 0 ? (
          <EmptyState icon={Truck} title={t("governorates.emptyTitle")} description={t("governorates.emptyDescription")} />
        ) : (
          <div className="grid gap-5 px-5 pt-4 max-[600px]:px-4 min-[1500px]:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <GovernorateChart rows={governorates.slice(0, CHART_GOVERNORATES)} />
            <ResponsiveTable
              label={t("governorates.title")}
              rows={governorates}
              rowKey={(g) => g.key}
              columns={[
                { key: "name", header: t("governorates.governorate"), phone: "title", cell: (g) => g.label },
                { key: "orders", header: t("governorates.orders"), phone: "end", className: "font-montserrat tabular-nums", cell: (g) => formatNumber(g.orders, locale) },
                { key: "delivered", header: t("governorates.delivered"), className: "font-montserrat tabular-nums", cell: (g) => formatNumber(g.delivered, locale) },
                { key: "refused", header: t("governorates.refused"), className: "font-montserrat tabular-nums", cell: (g) => formatNumber(g.refused, locale) },
                { key: "refusalRate", header: t("governorates.refusalRate"), className: "font-montserrat tabular-nums", cell: (g) => pct(g.refusalRate) },
                { key: "cancelRate", header: t("governorates.cancelRate"), className: "font-montserrat tabular-nums", cell: (g) => pct(g.cancelRate) },
              ]}
            />
          </div>
        )}
        <Note>{t("governorates.note")}</Note>
      </HomeCard>

      <div className="grid grid-cols-2 gap-3.5 max-[1020px]:grid-cols-1">
        <ProductsCard
          id="best-title"
          title={t("products.bestTitle")}
          description={t("products.bestDescription")}
          icon={Trophy}
          products={report.best}
          empty={t("products.bestEmpty")}
          money={money}
          unit={unit}
          t={t}
          storeId={storeId}
        />
        <ProductsCard
          id="worst-title"
          title={t("products.worstTitle")}
          description={t("products.worstDescription")}
          icon={PackageX}
          products={worst}
          empty={t("products.worstEmpty")}
          money={money}
          unit={unit}
          t={t}
          storeId={storeId}
        />
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <SellerNote className="mx-5 mt-4 max-[600px]:mx-4">{children}</SellerNote>;
}

function ProductsCard({
  id,
  storeId,
  title,
  description,
  icon,
  products,
  empty,
  money,
  unit,
  t,
}: {
  id: string;
  /** The report's store: product links open its Products pages (F-87c). */
  storeId: string;
  title: string;
  description: string;
  icon: LucideIcon;
  products: ReportProduct[];
  empty: string;
  money: (piastres: number) => string;
  unit: React.ReactNode;
  t: Awaited<ReturnType<typeof getTranslations<"reports">>>;
}) {
  return (
    <HomeCard aria-labelledby={id}>
      <HomeCardHeader id={id} title={title} description={description} />
      {products.length === 0 ? (
        <EmptyState icon={icon} title={empty} description={t("products.emptyDescription")} />
      ) : (
        <ul className="flex flex-col gap-1.5 px-3 pb-3 pt-2">
          {products.map((p) => (
            <li key={p.productId}>
              <Link href={storeProductsHref(storeId, `/${p.productId}/edit`)} className="flex min-h-14 items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors duration-150 hover:bg-(--s-tint)">
                <ProductThumb src={p.image} />
                <b className="min-w-0 flex-1 truncate text-[13px] font-semibold text-(--s-text)">{p.title || "—"}</b>
                <span className="whitespace-nowrap text-end text-xs text-(--s-subtle)">
                  <b className="block font-montserrat text-sm text-(--s-ink) tabular-nums">
                    {money(p.revenuePiastres)} {unit}
                  </b>
                  {t("products.units", { count: p.units })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  );
}
