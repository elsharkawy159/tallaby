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
import { formatDate, formatMoney, formatNumber } from "@/lib/i18n/format";
import { humanizeStatus, translateStatus } from "@/lib/i18n/status";

interface FinancialDashboardContentProps {
  wallet: {
    walletBalance?: string | null;
    payoutSchedule?: string | null;
    lastPayoutDate?: string | null;
    lastPayoutAmount?: string | null;
  } | null;
  pending: {
    pendingAmount?: number;
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
    description?: string | null;
    createdAt?: string | null;
    order?: { orderNumber?: string | null } | null;
  }>;
  analytics: {
    thisMonthSales?: number;
    lastMonthSales?: number;
  } | null;
}

export function FinancialDashboardContent({
  wallet,
  pending,
  payouts,
  stats,
  transactions,
  analytics,
}: FinancialDashboardContentProps) {
  const t = useTranslations("financial");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const formatCurrency = (value?: string | number | null) =>
    formatMoney(value, locale);
  const walletBalance = wallet?.walletBalance ?? "0";
  const pendingAmount = pending?.pendingAmount ?? 0;
  const pendingCount = pending?.orderCount ?? 0;
  const totalPaid = stats?.total?.totalPaid ?? 0;
  const thisMonth = analytics?.thisMonthSales ?? 0;
  const lastMonth = analytics?.lastMonthSales ?? 0;
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
                  {formatCurrency(thisMonth)}
                </p>
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
                  {formatCurrency(pendingAmount)}
                </p>
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
                  {formatCurrency(walletBalance)}
                </p>
                <p className="text-sm text-muted-foreground">{t("availableBalance")}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <TableHead>{t("columns.order")}</TableHead>
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
                      <TableCell>{tx.order?.orderNumber ?? "—"}</TableCell>
                      <TableCell className="font-semibold text-green-600 dark:text-green-400" dir="ltr">
                        {formatCurrency(tx.amount)}
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
                  <TableHead>{t("columns.method")}</TableHead>
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
                      <TableCell>
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
