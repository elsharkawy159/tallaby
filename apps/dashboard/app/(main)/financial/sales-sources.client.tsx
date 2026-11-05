"use client";

import { useState } from "react";
import { CreditCard, ReceiptText, ShoppingBag, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState, IconTile, Segmented, SellerCard, SellerCardHeader } from "@/components/seller-ui";
import { formatMoney, formatNumber, moneyDir } from "@/lib/i18n/format";
import { Money } from "@/components/money";
import { humanizeStatus } from "@/lib/i18n/status";
import { MARKETPLACE_CHANNEL, type SalesSourceLine, type SalesSources } from "./financial.lib";

type Period = "month" | "allTime";

/** "Where your sales came from": earnings by sales channel and payment method. */
export function SalesSourcesCard({ sources }: { sources: Record<Period, { currency: string; data: SalesSources }[]> }) {
  const t = useTranslations("financial.sources");
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>("month");
  const blocks = sources[period];

  const channelLabel = (line: SalesSourceLine) =>
    line.key === MARKETPLACE_CHANNEL ? t("marketplace") : (line.name ?? t("unknownStore"));
  const methodLabel = (line: SalesSourceLine) =>
    t.has(`methods.${line.key}`) ? t(`methods.${line.key}`) : humanizeStatus(line.key);

  return (
    <SellerCard aria-labelledby="sales-sources-title">
      <SellerCardHeader
        id="sales-sources-title"
        title={t("title")}
        description={t("subtitle")}
        className="flex-wrap"
        action={
          <Segmented
            label={t("periodLabel")}
            value={period}
            onChange={setPeriod}
            options={(["month", "allTime"] as const).map((value) => ({ value, label: t(`period.${value}`) }))}
          />
        }
      />
      {blocks.length === 0 ? (
        <EmptyState icon={ReceiptText} title={period === "month" ? t("emptyMonth") : t("empty")} />
      ) : (
        <div className="px-[22px] pb-[22px] pt-4 max-[600px]:px-4 max-[600px]:pb-4">
          {blocks.map(({ currency, data }) => (
            <div key={currency} className="not-first:mt-6 not-first:border-t not-first:border-(--s-line-soft) not-first:pt-5">
              <p className="mb-4 text-[13px] text-(--s-muted)">
                {t.rich("total", {
                  amount: formatMoney(data.total, locale, { currency }),
                  count: data.orders,
                  strong: (chunks) => <span className="font-bold text-(--s-ink)">{chunks}</span>,
                })}
              </p>
              <div className="grid grid-cols-2 gap-7 max-[860px]:grid-cols-1">
                <SourceList
                  title={t("byChannel")}
                  currency={currency}
                  lines={data.channels}
                  label={channelLabel}
                  hint={(line) => (line.key === MARKETPLACE_CHANNEL ? t("marketplaceHint") : t("storeHint"))}
                  icon={(line) => (line.key === MARKETPLACE_CHANNEL ? ShoppingBag : Store)}
                />
                <SourceList
                  title={t("byPaymentMethod")}
                  currency={currency}
                  lines={data.paymentMethods}
                  label={methodLabel}
                  icon={() => CreditCard}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SellerCard>
  );
}

function SourceList({
  title,
  currency,
  lines,
  label,
  hint,
  icon,
}: {
  title: string;
  currency: string;
  lines: SalesSourceLine[];
  label: (line: SalesSourceLine) => string;
  hint?: (line: SalesSourceLine) => string;
  icon: (line: SalesSourceLine) => typeof Store;
}) {
  const t = useTranslations("financial.sources");
  const locale = useLocale();

  return (
    <section>
      <h3 className="mb-3 text-[13.5px] font-bold text-(--s-text)">{title}</h3>
      <ul className="flex flex-col gap-3.5">
        {lines.map((line) => {
          const share = formatNumber(line.share, locale, { maximumFractionDigits: 1 });
          return (
            <li key={line.key}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <IconTile icon={icon(line)} tone="neutral" />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold text-(--s-text)">{label(line)}</p>
                    <p className="text-xs text-(--s-subtle)">
                      {hint ? `${hint(line)} · ` : ""}
                      {t("orders", { count: line.orders })}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-end">
                  <p className="font-montserrat text-[13.5px] font-bold text-(--s-ink) tabular-nums" dir={moneyDir(locale, { currency })}>
                    <Money value={line.amount} locale={locale} unit={{ currency }} />
                  </p>
                  <p className="text-xs text-(--s-subtle)">{t("share", { value: share })}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-(--s-fill)" aria-hidden>
                <div className="h-full rounded-full bg-(--s-primary)" style={{ width: `${Math.max(line.share, 1)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
