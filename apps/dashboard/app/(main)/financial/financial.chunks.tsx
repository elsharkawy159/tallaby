import { Banknote, CreditCard, History, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  EmptyState,
  KpiCard,
  KpiGrid,
  PageContainer,
  PageHeader,
  ResponsiveTable,
  SellerCard,
  SellerCardHeader,
  StatusBadge,
  TwoColumns,
} from "@/components/seller-ui";
import { formatDate, formatMoney, formatNumber, formatWalletMoney, moneyUnitMarked, splitHeadline, moneyDir, walletMoneyDir } from "@/lib/i18n/format";
import { WalletAmount } from "@/components/wallet-amount";
import { MoneyLines, MoneyText } from "@/components/money";
import { humanizeStatus, translateStatus } from "@/lib/i18n/status";
import { cn } from "@/lib/utils";
import type { SalesSources } from "./financial.lib";
import { SalesSourcesCard } from "./sales-sources.client";

interface FinancialDashboardContentProps {
  wallet: {
    walletBalance?: string | null;
    walletCurrency?: string | null;
    payoutSchedule?: string | null;
    lastPayoutDate?: string | null;
    lastPayoutAmount?: string | null;
  } | null;
  pending: {
    /** Per currency, EGP first. */
    byCurrency?: { currency: string; total: number }[];
    orderCount?: number;
  } | null;
  payouts: Array<{
    id: string;
    netAmount: string;
    status: string | null;
    processedAt?: string | null;
    createdAt?: string | null;
    method?: string | null;
  }>;
  stats: {
    monthly?: Array<{ month: string; totalAmount: number; count: number }>;
    total?: {
      totalPaid?: number;
      totalFees?: number;
      payoutCount?: number;
    };
  } | null;
  transactions: Array<{
    id: string;
    type: string;
    amount: string;
    /** The entry's own currency: older rows stay in EGP after the USD switch. */
    currency?: string | null;
    description?: string | null;
    createdAt?: string | null;
    order?: { orderNumber?: string | null } | null;
  }>;
  /** One row per currency. */
  analytics: { currency: string; thisMonthSales: number; lastMonthSales: number }[] | null;
  sources: Record<"month" | "allTime", { currency: string; data: SalesSources }[]> | null;
  /** EGP per USD: a USD wallet amount shows in EGP (owner, 2026-11-09). */
  egpRate?: number | null;
  /** What an empty card is in: the seller's one currency, or EGP. */
  fallbackCurrency: string;
}

export function FinancialDashboardContent({
  wallet,
  pending,
  payouts,
  stats,
  transactions,
  analytics,
  sources,
  fallbackCurrency,
  egpRate = null,
}: FinancialDashboardContentProps) {
  const t = useTranslations("financial");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const formatCurrency = (value?: string | number | null) => formatMoney(value, locale);
  const walletBalance = wallet?.walletBalance ?? "0";
  const fallback = fallbackCurrency;
  const pendingAmount = splitHeadline(pending?.byCurrency ?? [], { fallback });
  const pendingCount = pending?.orderCount ?? 0;
  const totalPaid = stats?.total?.totalPaid ?? 0;
  // The lead currency's own months: a percentage across currencies would mean nothing.
  const monthly = splitHeadline(
    (analytics ?? []).map((row) => ({ currency: row.currency, total: row.thisMonthSales })),
    { fallback },
  );
  const thisMonth = monthly.total;
  const lastMonth = analytics?.find((row) => row.currency === monthly.currency)?.lastMonthSales ?? 0;
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  const num = (value: number) => formatNumber(value, locale, { maximumFractionDigits: 2 });
  const unit = (currency: string) => <MoneyText locale={locale}>{moneyUnitMarked(locale, { currency })}</MoneyText>;

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("subtitle")} />

      <KpiGrid>
        <KpiCard
          label={t("thisMonthSales")}
          icon={Banknote}
          tone="success"
          value={num(thisMonth)}
          unit={unit(monthly.currency)}
          also={monthly.others.length > 0 && <MoneyLines totals={monthly.others} locale={locale} />}
          // No sales last month: a percentage would read "+0.0%", so show the dash.
          footer={t("vsLastMonthLabel")}
          delta={lastMonth > 0 ? growth : null}
        />
        <KpiCard
          label={t("totalPaidOut")}
          icon={TrendingUp}
          tone="info"
          value={<bdi>{formatCurrency(totalPaid)}</bdi>}
          footer={t("payoutCount", { count: stats?.total?.payoutCount ?? 0 })}
        />
        <KpiCard
          label={t("pendingEarnings")}
          icon={CreditCard}
          tone="accent"
          value={num(pendingAmount.total)}
          unit={unit(pendingAmount.currency)}
          also={pendingAmount.others.length > 0 && <MoneyLines totals={pendingAmount.others} locale={locale} />}
          footer={t("deliveredItems", { count: pendingCount })}
        />
        <KpiCard
          href="/wallet"
          label={t("walletBalance")}
          icon={Wallet}
          value={<bdi dir={walletMoneyDir(locale, wallet?.walletCurrency, egpRate)}>{formatWalletMoney(walletBalance, wallet?.walletCurrency, locale, egpRate)}</bdi>}
          footer={<span className="text-(--s-link)">{t("viewStoreWallet")}</span>}
        />
      </KpiGrid>

      {sources ? <SalesSourcesCard sources={sources} /> : null}

      <TwoColumns className="gap-3.5">
        <SellerCard aria-labelledby="financial-activity-title" className="overflow-hidden">
          <SellerCardHeader id="financial-activity-title" title={t("recentActivity")} className="pb-3.5" />
          {transactions.length === 0 ? (
            <EmptyState icon={ReceiptText} title={t("noTransactions")} />
          ) : (
            <ResponsiveTable
              label={t("recentActivity")}
              rows={transactions}
              rowKey={(tx) => tx.id}
              columns={[
                {
                  key: "type",
                  header: t("columns.type"),
                  phone: "title",
                  cell: (tx) => translateStatus(tStatus, "transaction", tx.type),
                },
                {
                  key: "order",
                  header: t("columns.order"),
                  phone: "hide",
                  cell: (tx) => tx.order?.orderNumber ?? "—",
                },
                {
                  key: "amount",
                  header: t("columns.amount"),
                  phone: "end",
                  // Fees and refunds are negative: colour by sign, not always green.
                  // A USD row reads in EGP, with the exact dollars the ledger recorded under it.
                  cell: (tx) => (
                    <WalletAmount
                      value={tx.amount}
                      currency={tx.currency}
                      locale={locale}
                      rate={egpRate}
                      signed
                      className={cn(
                        "whitespace-nowrap font-montserrat font-semibold tabular-nums",
                        Number(tx.amount) < 0 ? "text-destructive" : "text-success",
                      )}
                    />
                  ),
                },
                {
                  key: "date",
                  header: t("columns.date"),
                  phone: "sub",
                  cell: (tx) => formatDate(tx.createdAt, locale),
                },
              ]}
            />
          )}
        </SellerCard>

        <SellerCard aria-labelledby="financial-payouts-title" className="overflow-hidden">
          <SellerCardHeader id="financial-payouts-title" title={t("recentPayouts")} className="pb-3.5" />
          {payouts.length === 0 ? (
            <EmptyState icon={History} title={t("noPayouts")} />
          ) : (
            <ResponsiveTable
              label={t("recentPayouts")}
              rows={payouts}
              rowKey={(payout) => payout.id}
              columns={[
                {
                  key: "amount",
                  header: t("columns.amount"),
                  phone: "title",
                  cell: (payout) => (
                    <bdi dir={moneyDir(locale)} className="whitespace-nowrap font-montserrat font-semibold tabular-nums">
                      {formatCurrency(payout.netAmount)}
                    </bdi>
                  ),
                },
                {
                  key: "status",
                  header: t("columns.status"),
                  phone: "end",
                  cell: (payout) => (
                    <StatusBadge tone={payout.status === "completed" ? "success" : "muted"}>
                      {translateStatus(tStatus, "payout", payout.status ?? "pending")}
                    </StatusBadge>
                  ),
                },
                {
                  key: "method",
                  header: t("columns.method"),
                  phone: "hide",
                  cell: (payout) =>
                    payout.method
                      ? t.has(`methods.${payout.method}`)
                        ? t(`methods.${payout.method}`)
                        : humanizeStatus(payout.method)
                      : "—",
                },
                {
                  key: "date",
                  header: t("columns.date"),
                  phone: "sub",
                  cell: (payout) => formatDate(payout.processedAt ?? payout.createdAt, locale),
                },
              ]}
            />
          )}
        </SellerCard>
      </TwoColumns>
    </PageContainer>
  );
}
