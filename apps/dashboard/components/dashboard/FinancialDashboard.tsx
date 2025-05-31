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

const revenueData = [
  {
    period: "January 2024",
    revenue: "$12,450",
    profit: "$3,680",
    growth: "+12.5%",
  },
  {
    period: "December 2023",
    revenue: "$11,200",
    profit: "$3,200",
    growth: "+8.2%",
  },
  {
    period: "November 2023",
    revenue: "$10,800",
    profit: "$2,950",
    growth: "+5.1%",
  },
  {
    period: "October 2023",
    revenue: "$10,300",
    profit: "$2,800",
    growth: "+3.8%",
  },
];

const payouts = [
  {
    id: "PAY-001",
    amount: "$2,450",
    status: "Completed",
    date: "2024-01-15",
    method: "Bank Transfer",
  },
  {
    id: "PAY-002",
    amount: "$1,890",
    status: "Pending",
    date: "2024-01-14",
    method: "PayPal",
  },
  {
    id: "PAY-003",
    amount: "$3,200",
    status: "Completed",
    date: "2024-01-10",
    method: "Bank Transfer",
  },
];

export const FinancialDashboard = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Financial Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Track your earnings and financial performance
            </p>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$45,890</p>
                <p className="text-sm text-green-600">+15.2% this month</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-gray-900">$13,280</p>
                <p className="text-sm text-green-600">+12.8% this month</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-gray-900">$1,890</p>
                <p className="text-sm text-yellow-600">2 pending</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">$4,560</p>
                <p className="text-sm text-gray-600">Ready for withdrawal</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue History */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Growth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.period}</TableCell>
                    <TableCell className="font-semibold">
                      {item.revenue}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {item.profit}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-green-600">
                        {item.growth}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Payouts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payout ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.id}</TableCell>
                    <TableCell className="font-semibold">
                      {payout.amount}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payout.status === "Completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{payout.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
