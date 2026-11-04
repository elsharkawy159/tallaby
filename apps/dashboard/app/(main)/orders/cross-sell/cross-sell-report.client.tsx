"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { BadgePercent } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { formatMoney, formatNumber } from "@/lib/i18n/format";
import { ListPager } from "../list-pager.client";
import { CROSS_SELL_REPORT_DAYS, CROSS_SELL_REPORT_PAGE_SIZES, type CrossSellReportDays } from "./cross-sell-report.lib";
import type { CrossSellReport } from "./cross-sell-report.query";

/** Orders › Cross-sell report: the period's totals and one card per offer, paged by the URL. */
export function CrossSellReportView({
  report,
  days,
  storeName,
}: {
  report: CrossSellReport;
  days: CrossSellReportDays;
  /** Shown when the seller has several stores. */
  storeName: string | null;
}) {
  const t = useTranslations("crossSellReport");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const go = (patch: { days?: number; page?: number; size?: number }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (patch.days) params.set("days", String(patch.days));
    if (patch.size) params.set("size", String(patch.size));
    if (patch.page && patch.page > 1) params.set("page", String(patch.page));
    else params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const stats = [
    { label: t("orders"), value: formatNumber(report.totals.orders, locale) },
    { label: t("units"), value: formatNumber(report.totals.units, locale) },
    { label: t("discount"), value: formatMoney(report.totals.discount, locale) },
  ];

  return (
    <div className="space-y-4">
      {storeName && <p className="text-xs font-medium text-muted-foreground">{t("storeLabel", { name: storeName })}</p>}

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("period")}>
        {CROSS_SELL_REPORT_DAYS.map((option) => (
          <Button key={option} type="button" size="sm" variant={option === days ? "default" : "outline"} aria-pressed={option === days} onClick={() => go({ days: option })}>
            {t("lastDays", { days: option })}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold tabular-nums" dir="ltr">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {report.rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <BadgePercent className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">{t("emptyTitle")}</p>
            <p className="text-pretty text-sm text-muted-foreground">{t("emptyBody")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {report.rows.map((row) => (
              <li key={row.offerId}>
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.offerName}</p>
                      {row.mainName && <p className="truncate text-xs text-muted-foreground">{t("withProduct", { name: row.mainName })}</p>}
                    </div>
                    <dl className="grid shrink-0 grid-cols-3 gap-4 text-sm sm:gap-8">
                      <div>
                        <dt className="text-xs text-muted-foreground">{t("orders")}</dt>
                        <dd className="font-semibold tabular-nums">{formatNumber(row.orders, locale)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">{t("units")}</dt>
                        <dd className="font-semibold tabular-nums">{formatNumber(row.units, locale)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">{t("discount")}</dt>
                        <dd className="font-semibold tabular-nums" dir="ltr">
                          {formatMoney(row.discount, locale)}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          <ListPager
            page={report.page}
            pages={report.pages}
            size={report.size}
            sizes={CROSS_SELL_REPORT_PAGE_SIZES}
            total={report.total}
            onPage={(page) => go({ page })}
            onSize={(size) => go({ size })}
          />
        </>
      )}
    </div>
  );
}
