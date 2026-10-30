import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, Info, PackageX, Percent, ReceiptText, ShoppingBag, Trophy, Truck, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/i18n/format";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { getHomeTraffic } from "@/lib/analytics/home-traffic.server";
import { isStoreViewsConfigured } from "@/lib/analytics/store-views.server";
import { LEAD_RETENTION_DAYS } from "@workspace/lib/checkout-leads";
import { EmptyState, HeaderLink, HomeCard, HomeCardHeader, IconTile, ProductThumb, type Tone } from "../_components/home-ui";
import type { LucideIcon } from "lucide-react";
import { getStoreReport } from "./reports.server";
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

/** Governorates drawn in the chart; the table below lists them all. */
const CHART_GOVERNORATES = 8;

/**
 * One store's report (ROADMAP.md F-15a). The store id from the URL is checked
 * against the session's seller (requireStore) before any query runs.
 */
export async function StoreReportData({ storeId, range }: { storeId: string; range: ReportRange }) {
  let access;
  try {
    access = await requireStore(storeId);
  } catch (error) {
    if (isAccessError(error)) notFound();
    throw error;
  }
  const { seller, store } = access;
  const [locale, t] = await Promise.all([getLocale(), getTranslations("reports")]);
  const period = reportPeriod(range);
  const [report, traffic] = await Promise.all([
    getStoreReport(seller.sellerId, store.id, period.start, locale),
    getHomeTraffic(seller.sellerId, [store.id], range),
  ]);
  if (!report) notFound();

  const governorates = governorateRows(report.governorates, locale, t("governorates.unknown"));
  const totals = sumOutcomes(governorates);
  const rates = outcomeRates(totals);
  const sources = sourceRows(report.sources);
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={Wallet} label={t("kpi.revenue")} value={money(storeSales.revenuePiastres)} unit={t("currency")} />
        <Kpi icon={ShoppingBag} label={t("kpi.orders")} value={formatNumber(totals.orders, locale)} />
        <Kpi icon={ReceiptText} label={t("kpi.aov")} value={aov === null ? "—" : money(aov)} unit={aov === null ? undefined : t("currency")} />
        <Kpi icon={Truck} tone="success" label={t("kpi.deliveryRate")} value={pct(rates.deliveryRate)} />
        <Kpi icon={Percent} tone="danger" label={t("kpi.refusalRate")} value={pct(rates.refusalRate)} />
        <Kpi icon={Ban} tone="accent" label={t("kpi.cancelRate")} value={pct(rates.cancelRate)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
          <ul className="mx-5 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
            {steps.map((s) => (
              <li key={s.key} className="rounded-[10px] bg-muted/60 px-2.5 py-2">
                <span className="block truncate">{t(`funnel.${s.key}`)}</span>
                <b className="font-montserrat text-sm text-foreground tabular-nums">{formatNumber(s.value, locale)}</b>
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
          <div className="px-5 pt-4">
            <SourcesChart rows={sources} />
          </div>
        </HomeCard>
      </div>

      <HomeCard aria-labelledby="gov-title" className="pb-5">
        <HomeCardHeader id="gov-title" title={t("governorates.title")} description={t("governorates.description")} />
        {governorates.length === 0 ? (
          <EmptyState icon={Truck} title={t("governorates.emptyTitle")} description={t("governorates.emptyDescription")} />
        ) : (
          <div className="grid gap-5 px-5 pt-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <GovernorateChart rows={governorates.slice(0, CHART_GOVERNORATES)} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] text-[13px]">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 text-start font-medium">{t("governorates.governorate")}</th>
                    <th className="py-2 text-end font-medium">{t("governorates.orders")}</th>
                    <th className="py-2 text-end font-medium">{t("governorates.delivered")}</th>
                    <th className="py-2 text-end font-medium">{t("governorates.refused")}</th>
                    <th className="py-2 text-end font-medium">{t("governorates.refusalRate")}</th>
                    <th className="py-2 text-end font-medium">{t("governorates.cancelRate")}</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {governorates.map((g) => (
                    <tr key={g.key} className="border-b last:border-0">
                      <td className="py-2">{g.label}</td>
                      <td className="py-2 text-end font-montserrat">{formatNumber(g.orders, locale)}</td>
                      <td className="py-2 text-end font-montserrat">{formatNumber(g.delivered, locale)}</td>
                      <td className="py-2 text-end font-montserrat">{formatNumber(g.refused, locale)}</td>
                      <td className="py-2 text-end font-montserrat">{pct(g.refusalRate)}</td>
                      <td className="py-2 text-end font-montserrat">{pct(g.cancelRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <Note>{t("governorates.note")}</Note>
      </HomeCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProductsCard
          id="best-title"
          title={t("products.bestTitle")}
          description={t("products.bestDescription")}
          icon={Trophy}
          products={report.best}
          empty={t("products.bestEmpty")}
          money={money}
          t={t}
        />
        <ProductsCard
          id="worst-title"
          title={t("products.worstTitle")}
          description={t("products.worstDescription")}
          icon={PackageX}
          products={worst}
          empty={t("products.worstEmpty")}
          money={money}
          t={t}
        />
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  tone?: Tone;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-2xl border bg-card p-3.5 text-card-foreground shadow-xs sm:px-4">
      <div className="flex items-center justify-between gap-2 text-[13px] text-muted-foreground">
        <span className="truncate">{label}</span>
        <IconTile icon={icon} tone={tone} className="size-8" />
      </div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <b className="font-montserrat text-[22px] font-semibold leading-none tabular-nums">{value}</b>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-5 mt-4 flex items-start gap-2 rounded-[10px] bg-muted/70 px-3 py-2.5 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-[15px] shrink-0 text-primary-ink" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

function ProductsCard({
  id,
  title,
  description,
  icon,
  products,
  empty,
  money,
  t,
}: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  products: ReportProduct[];
  empty: string;
  money: (piastres: number) => string;
  t: Awaited<ReturnType<typeof getTranslations<"reports">>>;
}) {
  return (
    <HomeCard aria-labelledby={id}>
      <HomeCardHeader id={id} title={title} description={description} />
      {products.length === 0 ? (
        <EmptyState icon={icon} title={empty} description={t("products.emptyDescription")} />
      ) : (
        <ul className="flex flex-col gap-3.5 px-5 pb-[18px] pt-3">
          {products.map((p) => (
            <li key={p.productId}>
              <Link href={`/products/${p.productId}/edit`} className="flex items-center gap-3 rounded-lg hover:bg-muted/50">
                <ProductThumb src={p.image} />
                <b className="min-w-0 flex-1 truncate text-[13px] font-semibold">{p.title || "—"}</b>
                <span className="whitespace-nowrap text-end text-xs text-muted-foreground">
                  <b className="block font-montserrat text-sm text-foreground tabular-nums">
                    {money(p.revenuePiastres)} {t("currency")}
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
