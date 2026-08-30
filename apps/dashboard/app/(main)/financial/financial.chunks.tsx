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

const formatCurrency = (value?: string | number | null) => {
  const num =
    value == null ? 0 : typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
  }).format(num);
};

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
  const walletBalance = wallet?.walletBalance ?? "0";
  const pendingAmount = pending?.pendingAmount ?? 0;
  const pendingCount = pending?.orderCount ?? 0;
  const totalPaid = stats?.total?.totalPaid ?? 0;
  const thisMonth = analytics?.thisMonthSales ?? 0;
  const lastMonth = analytics?.lastMonthSales ?? 0;
  const growth =
    lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Financial Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track your earnings and financial performance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(thisMonth)}
                </p>
                <p
                  className={`text-sm ${growth >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {growth >= 0 ? "+" : ""}
                  {growth.toFixed(1)}% vs last month
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid Out</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalPaid)}
                </p>
                <p className="text-sm text-gray-600">
                  {stats?.total?.payoutCount ?? 0} payouts
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(pendingAmount)}
                </p>
                <p className="text-sm text-yellow-600">
                  {pendingCount} delivered items
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(walletBalance)}
                </p>
                <p className="text-sm text-gray-600">Available balance</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Wallet Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      No transactions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="capitalize">{tx.type}</TableCell>
                      <TableCell>
                        {tx.order?.orderNumber ?? "—"}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        {tx.createdAt
                          ? new Date(tx.createdAt).toLocaleDateString()
                          : "—"}
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
            <CardTitle>Recent Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      No payouts yet
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-semibold">
                        {formatCurrency(payout.netAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payout.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {payout.status ?? "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {payout.method?.replace(/_/g, " ") ?? "—"}
                      </TableCell>
                      <TableCell>
                        {(payout.processedAt ?? payout.createdAt)
                          ? new Date(
                              payout.processedAt ?? payout.createdAt!
                            ).toLocaleDateString()
                          : "—"}
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
