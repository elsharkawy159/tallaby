"use client";

import { useState } from "react";
import { CreditCard, ShoppingBag, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatNumber } from "@/lib/i18n/format";
import { humanizeStatus } from "@/lib/i18n/status";
import { MARKETPLACE_CHANNEL, type SalesSourceLine, type SalesSources } from "./financial.lib";

type Period = "month" | "allTime";

/** "Where your sales came from": earnings by sales channel and payment method. */
export function SalesSourcesCard({ sources }: { sources: Record<Period, SalesSources> }) {
  const t = useTranslations("financial.sources");
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>("month");
  const data = sources[period];

  const channelLabel = (line: SalesSourceLine) =>
    line.key === MARKETPLACE_CHANNEL ? t("marketplace") : (line.name ?? t("unknownStore"));
  const methodLabel = (line: SalesSourceLine) =>
    t.has(`methods.${line.key}`) ? t(`methods.${line.key}`) : humanizeStatus(line.key);

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div role="radiogroup" aria-label={t("periodLabel")} className="flex gap-1.5">
          {(["month", "allTime"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={period === value}
              onClick={() => setPeriod(value)}
              className={
                period === value
                  ? "rounded-full border border-primary bg-primary-soft px-3 py-1 text-xs font-medium text-primary-ink"
                  : "rounded-full border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              {t(`period.${value}`)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {data.channels.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {period === "month" ? t("emptyMonth") : t("empty")}
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              {t.rich("total", {
                amount: formatMoney(data.total, locale),
                count: data.orders,
                strong: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
              })}
            </p>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <SourceList
                title={t("byChannel")}
                lines={data.channels}
                label={channelLabel}
                hint={(line) => (line.key === MARKETPLACE_CHANNEL ? t("marketplaceHint") : t("storeHint"))}
                icon={(line) => (line.key === MARKETPLACE_CHANNEL ? ShoppingBag : Store)}
              />
              <SourceList
                title={t("byPaymentMethod")}
                lines={data.paymentMethods}
                label={methodLabel}
                icon={() => CreditCard}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SourceList({
  title,
  lines,
  label,
  hint,
  icon,
}: {
  title: string;
  lines: SalesSourceLine[];
  label: (line: SalesSourceLine) => string;
  hint?: (line: SalesSourceLine) => string;
  icon: (line: SalesSourceLine) => typeof Store;
}) {
  const t = useTranslations("financial.sources");
  const locale = useLocale();

  return (
    <section>
      <h3 className="mb-3 text-sm font-medium text-foreground">{title}</h3>
      <ul className="space-y-4">
        {lines.map((line) => {
          const Icon = icon(line);
          const share = formatNumber(line.share, locale, { maximumFractionDigits: 1 });
          return (
            <li key={line.key}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{label(line)}</p>
                    <p className="text-xs text-muted-foreground">
                      {hint ? `${hint(line)} · ` : ""}
                      {t("orders", { count: line.orders })}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-end">
                  <p className="text-sm font-semibold text-foreground" dir="ltr">
                    {formatMoney(line.amount, locale)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("share", { value: share })}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(line.share, 1)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
