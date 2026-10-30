import { notFound } from "next/navigation";
import { Info, Megaphone, Percent, ShoppingBag, Truck, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { formatNumber } from "@/lib/i18n/format";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { EmptyState, HomeCard, HomeCardHeader, IconTile } from "../../_components/home-ui";
import { reportPeriod, type ReportRange } from "../reports.lib";
import { aggregateCampaigns, deliveryRate, isKnownSource } from "./campaigns.lib";
import { getCampaignRows, getLinkBuilderTargets } from "./campaigns.server";
import { CampaignLinkBuilder } from "./campaigns.client";

/**
 * Campaigns report + link builder for one store (ROADMAP.md F-26a). The
 * store id from the URL is checked against the session's seller first.
 */
export async function CampaignReportData({ storeId, range }: { storeId: string; range: ReportRange }) {
  let access;
  try {
    access = await requireStore(storeId);
  } catch (error) {
    if (isAccessError(error)) notFound();
    throw error;
  }
  const { seller, store } = access;
  const [locale, t] = await Promise.all([getLocale(), getTranslations("campaignReport")]);
  const period = reportPeriod(range);
  const [rows, targets] = await Promise.all([
    getCampaignRows(seller.sellerId, store.id, period.start),
    getLinkBuilderTargets(seller.sellerId, store.id, locale),
  ]);
  if (!rows || !targets) notFound();

  const report = aggregateCampaigns(rows);
  const money = (piastres: number) => formatNumber(piastres / 100, locale, { maximumFractionDigits: 0 });
  const pct = (value: number | null) =>
    value === null ? "—" : formatNumber(value, locale, { style: "percent", maximumFractionDigits: 1 });
  const sourceLabel = (source: string) => (isKnownSource(source) ? t(`sources.${source}`) : source);
  const trackedShare = report.totals.orders > 0 ? report.tracked.orders / report.totals.orders : null;

  return (
    <div className="space-y-4">
      <CampaignLinkBuilder storeUrl={targets.storeUrl} products={targets.products} />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
        <Kpi icon={ShoppingBag} label={t("kpi.orders")} value={formatNumber(report.tracked.orders, locale)} />
        <Kpi icon={Truck} label={t("kpi.delivered")} value={formatNumber(report.tracked.delivered, locale)} />
        <Kpi icon={Wallet} label={t("kpi.revenue")} value={money(report.tracked.revenuePiastres)} unit={t("currency")} />
        <Kpi icon={Percent} label={t("kpi.trackedShare")} value={pct(trackedShare)} />
      </div>

      <HomeCard aria-labelledby="campaigns-title" className="pb-5">
        <HomeCardHeader id="campaigns-title" title={t("table.title")} description={t("table.description")} />
        {report.sources.length === 0 ? (
          <EmptyState icon={Megaphone} title={t("table.emptyTitle")} description={t("table.emptyDescription")} />
        ) : (
          <div className="overflow-x-auto px-5 pt-3">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 text-start font-medium">{t("table.source")}</th>
                  <th className="py-2 text-end font-medium">{t("table.orders")}</th>
                  <th className="py-2 text-end font-medium">{t("table.delivered")}</th>
                  <th className="py-2 text-end font-medium">{t("table.deliveryRate")}</th>
                  <th className="py-2 text-end font-medium">{t("table.revenue")}</th>
                </tr>
              </thead>
              {report.sources.map((group) => (
                <tbody key={group.source} className="tabular-nums">
                  <tr className="border-b bg-muted/40">
                    <td className="py-2 ps-2 font-semibold" dir="auto">
                      {sourceLabel(group.source)}
                    </td>
                    <td className="py-2 text-end font-montserrat font-semibold">{formatNumber(group.orders, locale)}</td>
                    <td className="py-2 text-end font-montserrat">{formatNumber(group.delivered, locale)}</td>
                    <td className="py-2 text-end font-montserrat">{pct(deliveryRate(group.delivered, group.orders))}</td>
                    <td className="py-2 pe-2 text-end font-montserrat">
                      {money(group.revenuePiastres)} {t("currency")}
                    </td>
                  </tr>
                  {group.source !== "direct" &&
                    group.campaigns.map((c) => (
                      <tr key={`${group.source}:${c.campaign ?? ""}`} className="border-b last:border-0">
                        <td className="py-2 ps-6 text-muted-foreground">
                          <span dir="auto">{c.campaign ?? t("table.noCampaign")}</span>
                        </td>
                        <td className="py-2 text-end font-montserrat">{formatNumber(c.orders, locale)}</td>
                        <td className="py-2 text-end font-montserrat">{formatNumber(c.delivered, locale)}</td>
                        <td className="py-2 text-end font-montserrat">{pct(deliveryRate(c.delivered, c.orders))}</td>
                        <td className="py-2 pe-2 text-end font-montserrat">
                          {money(c.revenuePiastres)} {t("currency")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              ))}
            </table>
          </div>
        )}
        <div className="mx-5 mt-4 flex items-start gap-2 rounded-[10px] bg-muted/70 px-3 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-[15px] shrink-0 text-primary-ink" aria-hidden />
          <span>{t("table.note")}</span>
        </div>
      </HomeCard>
    </div>
  );
}

function Kpi({ icon, label, value, unit }: { icon: LucideIcon; label: string; value: string; unit?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-2xl border bg-card p-3.5 text-card-foreground shadow-xs sm:px-4">
      <div className="flex items-center justify-between gap-2 text-[13px] text-muted-foreground">
        <span className="truncate">{label}</span>
        <IconTile icon={icon} className="size-8" />
      </div>
      <div className="flex flex-wrap items-baseline gap-1.5">
        <b className="font-montserrat text-[22px] font-semibold leading-none tabular-nums">{value}</b>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
