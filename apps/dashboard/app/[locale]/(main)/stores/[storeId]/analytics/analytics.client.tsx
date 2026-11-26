"use client";

import { useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, LineChart, RefreshCw, Users } from "lucide-react";
import { EmptyState, KpiCard, Note, PageTabs, SellerButton, SellerCard, SellerCardHeader } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { formatNumber, formatRelativeTime } from "@/lib/i18n/format";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { STORE_VIEWS_AUTO_REFRESH_MS, STORE_VIEWS_RANGES, type StoreViewsRange, type StoreViewsReport } from "@/lib/analytics/store-views.lib";
import { refreshStoreViews } from "./analytics.server";

// recharts loads as its own chunk; the sized box in ViewsChart holds the space meanwhile.
const ViewsChartCanvas = dynamic(() => import("./analytics-chart.client").then((m) => m.ViewsChartCanvas));

export function StoreViews({
  storeId,
  range,
  report,
  state,
  offline,
}: {
  storeId: string;
  range: StoreViewsRange;
  report: StoreViewsReport | null;
  state: "ready" | "notConfigured" | "error";
  /** The website is not published, so it has no visitors to count. */
  offline: boolean;
}) {
  const t = useTranslations("storeAnalytics");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  useAutoRefresh(STORE_VIEWS_AUTO_REFRESH_MS, state !== "notConfigured");

  const refresh = () => {
    startTransition(async () => {
      const result = await refreshStoreViews(storeId);
      if (!result.success) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      router.refresh();
    });
  };

  if (state === "notConfigured") {
    return (
      <SellerCard className="sui-rise">
        <EmptyState icon={LineChart} title={t("notConfiguredTitle")} description={t("notConfiguredDescription")} />
      </SellerCard>
    );
  }

  return (
    <>
      <div className="sui-rise flex flex-wrap items-center justify-between gap-3">
        <PageTabs
          sticky={false}
          label={t("rangeLabel")}
          value={String(range)}
          className="max-[600px]:w-full"
          tabs={STORE_VIEWS_RANGES.map((days) => ({ key: String(days), label: t("range", { days }), href: `/stores/${storeId}/analytics?range=${days}` }))}
        />
        <div className="flex items-center gap-3 max-[600px]:w-full max-[600px]:justify-between">
          {report && <span className="text-xs text-(--s-subtle)">{t("updated", { time: formatRelativeTime(report.fetchedAt, locale) })}</span>}
          <SellerButton variant="mini" size="sm" onClick={refresh} disabled={isPending}>
            <RefreshCw className={cn(isPending && "animate-spin")} aria-hidden />
            {t("refresh")}
          </SellerButton>
        </div>
      </div>

      {offline && <Note tone="amber">{t("offline")}</Note>}

      {state === "error" || !report ? (
        <SellerCard className="sui-rise">
          <EmptyState icon={LineChart} title={t("errorTitle")} description={t("errorDescription")} />
        </SellerCard>
      ) : (
        <>
          <div className="sui-rise grid grid-cols-2 gap-3.5 [animation-delay:.05s] max-[480px]:gap-2.5">
            <KpiCard icon={Eye} label={t("views")} footer={t("viewsHint")} value={formatNumber(report.views, locale, { maximumFractionDigits: 0 })} />
            <KpiCard icon={Users} tone="accent" label={t("visitors")} footer={t("visitorsHint")} value={formatNumber(report.visitors, locale, { maximumFractionDigits: 0 })} />
          </div>
          <SellerCard className="sui-rise pb-4 [animation-delay:.1s]">
            <SellerCardHeader title={t("chartTitle")} description={t("chartDescription")} />
            <ViewsChart data={report.daily} />
          </SellerCard>
          <p className="text-pretty text-xs text-(--s-faint)">{t("delayNote")}</p>
        </>
      )}
    </>
  );
}

/** Daily views (area) and visitors (line). RTL puts the newest day on the left. */
function ViewsChart({ data }: { data: StoreViewsReport["daily"] }) {
  const t = useTranslations("storeAnalytics");
  const empty = data.every((d) => d.views === 0);

  return (
    <div className="relative px-3 pt-3">
      <div className="h-[260px] w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-(--s-faint) [&_.recharts-surface]:outline-hidden">
        <ViewsChartCanvas data={data} empty={empty} />
      </div>
      {empty && (
        <div className="absolute inset-0 grid place-items-center text-center text-[13px] text-(--s-muted)">
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-(--s-line) bg-(--s-surface) px-[18px] py-3">
            <b className="font-bold text-(--s-ink)">{t("emptyTitle")}</b>
            <span>{t("emptyDescription")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
