import Link from "next/link";
import { DollarSign, TrendingUp, CreditCard, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { useLocale, useTranslations } from "next-intl";
import { formatDate, formatMoney, formatNumber, formatWalletMoney, splitHeadline } from "@/lib/i18n/format";
import { Money, MoneyLines } from "@/components/money";
import { humanizeStatus, translateStatus } from "@/lib/i18n/status";
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
}: FinancialDashboardContentProps) {
  const t = useTranslations("financial");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const formatCurrency = (value?: string | number | null) =>
    formatMoney(value, locale);
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
  const growth =
    lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("thisMonthSales")}</p>
                <p className="text-2xl font-bold text-foreground">
                  <Money value={thisMonth} locale={locale} unit={{ currency: monthly.currency }} />
                </p>
                <MoneyLines totals={monthly.others} locale={locale} className="text-sm font-medium text-muted-foreground" />
                {/* No sales last month: a percentage would read "+0.0%", so say nothing. */}
                {lastMonth > 0 && (
                  <p
                    className={`text-sm ${growth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {t("vsLastMonth", {
                      value: `${growth >= 0 ? "+" : ""}${formatNumber(growth, locale, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}%`,
                    })}
                  </p>
                )}
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("totalPaidOut")}</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalPaid)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("payoutCount", { count: stats?.total?.payoutCount ?? 0 })}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("pendingEarnings")}</p>
                <p className="text-2xl font-bold text-foreground">
                  <Money value={pendingAmount.total} locale={locale} unit={{ currency: pendingAmount.currency }} />
                </p>
                <MoneyLines totals={pendingAmount.others} locale={locale} className="text-sm font-medium text-muted-foreground" />
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {t("deliveredItems", { count: pendingCount })}
                </p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("walletBalance")}</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatWalletMoney(walletBalance, wallet?.walletCurrency, locale)}
                </p>
                <Link href="/wallet" className="text-sm text-primary-ink hover:underline">
                  {t("viewStoreWallet")}
                </Link>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {sources ? <SalesSourcesCard sources={sources} /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.type")}</TableHead>
                  <TableHead className="max-sm:hidden">{t("columns.order")}</TableHead>
                  <TableHead>{t("columns.amount")}</TableHead>
                  <TableHead>{t("columns.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t("noTransactions")}
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {translateStatus(tStatus, "transaction", tx.type)}
                      </TableCell>
                      <TableCell className="max-sm:hidden">{tx.order?.orderNumber ?? "—"}</TableCell>
                      {/* Fees and refunds are negative: colour by sign, not always green. */}
                      <TableCell
                        className={
                          Number(tx.amount) < 0
                            ? "font-semibold text-destructive"
                            : "font-semibold text-green-600 dark:text-green-400"
                        }
                      >
                        <bdi dir="ltr">
                          {Number(tx.amount) > 0 ? "+" : ""}
                          {formatWalletMoney(tx.amount, tx.currency, locale)}
                        </bdi>
                      </TableCell>
                      <TableCell>
                        {formatDate(tx.createdAt, locale)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentPayouts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.amount")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead className="max-sm:hidden">{t("columns.method")}</TableHead>
                  <TableHead>{t("columns.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t("noPayouts")}
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-semibold" dir="ltr">
                        {formatCurrency(payout.netAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payout.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {translateStatus(
                            tStatus,
                            "payout",
                            payout.status ?? "pending"
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-sm:hidden">
                        {payout.method
                          ? t.has(`methods.${payout.method}`)
                            ? t(`methods.${payout.method}`)
                            : humanizeStatus(payout.method)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {formatDate(payout.processedAt ?? payout.createdAt, locale)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
