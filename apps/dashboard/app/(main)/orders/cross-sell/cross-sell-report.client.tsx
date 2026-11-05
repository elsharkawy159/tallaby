"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { BadgePercent } from "lucide-react";
import { Chip, Chips, EmptyState, ResponsiveTable, SellerCard } from "@/components/seller-ui";
import { formatNumber, moneyDir, type MoneyUnit } from "@/lib/i18n/format";
import { Money } from "@/components/money";
import { ListPager } from "../list-pager.client";
import { MiniStats } from "../orders-ui";
import { CROSS_SELL_REPORT_DAYS, CROSS_SELL_REPORT_PAGE_SIZES, type CrossSellReportDays } from "./cross-sell-report.lib";
import type { CrossSellReport } from "./cross-sell-report.query";

/** Orders › Cross-sell report: the period's totals and one row per offer, paged by the URL. */
export function CrossSellReportView({
  money,
  report,
  days,
  storeName,
}: {
  /** The store's currency. */
  money?: MoneyUnit;
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

  return (
    <>
      {storeName && <p className="text-xs font-semibold text-(--s-subtle)">{t("storeLabel", { name: storeName })}</p>}

      <Chips role="group" aria-label={t("period")}>
        {CROSS_SELL_REPORT_DAYS.map((option) => (
          <Chip key={option} pressed={option === days} onClick={() => go({ days: option })}>
            {t("lastDays", { days: option })}
          </Chip>
        ))}
      </Chips>

      <MiniStats
        items={[
          { label: t("orders"), value: formatNumber(report.totals.orders, locale) },
          { label: t("units"), value: formatNumber(report.totals.units, locale) },
          { label: t("discount"), value: <Money value={report.totals.discount} locale={locale} unit={money} /> },
        ]}
      />

      {report.rows.length === 0 ? (
        <SellerCard>
          <EmptyState icon={BadgePercent} title={t("emptyTitle")} description={t("emptyBody")} />
        </SellerCard>
      ) : (
        <>
          <SellerCard className="overflow-hidden">
            <ResponsiveTable
              label={t("title")}
              rows={report.rows}
              rowKey={(row) => row.offerId}
              columns={[
                {
                  key: "offer",
                  header: t("offer"),
                  phone: "title",
                  cell: (row) => (
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-(--s-text)">{row.offerName}</p>
                      {row.mainName && <p className="break-words text-xs font-normal text-(--s-subtle)">{t("withProduct", { name: row.mainName })}</p>}
                    </div>
                  ),
                },
                { key: "orders", header: t("orders"), cell: (row) => <b className="font-montserrat font-semibold tabular-nums">{formatNumber(row.orders, locale)}</b> },
                { key: "units", header: t("units"), cell: (row) => <b className="font-montserrat font-semibold tabular-nums">{formatNumber(row.units, locale)}</b> },
                {
                  key: "discount",
                  header: t("discount"),
                  cell: (row) => (
                    <b className="font-montserrat font-semibold tabular-nums" dir={moneyDir(locale, money)}>
                      <Money value={row.discount} locale={locale} unit={money} />
                    </b>
                  ),
                },
              ]}
            />
          </SellerCard>
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
    </>
  );
}
