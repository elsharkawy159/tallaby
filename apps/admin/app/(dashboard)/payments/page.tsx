//@ts-ignore
//@ts-nocheck
"use client";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Input } from "@workspace/ui/components/input";
import {
  Filter,
  RefreshCw,
  Download,
  CreditCard,
  DollarSign,
  BarChart2,
  AlertTriangle,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { format } from "date-fns";
import { DataTable } from "../_components/data-table/data-table";

// Mock data for demonstration
const payments = [
  {
    id: "pay_001",
    orderId: "ord_10001",
    orderNumber: "ORD-10001",
    customerId: "cust_001",
    customerName: "John Smith",
    amount: 124.99,
    method: "Credit Card",
    methodDetails: "Visa •••• 1234",
    currency: "USD",
    status: "paid",
    transactionId: "txn_abc123def456",
    authorizedAt: "2023-10-15T10:30:00Z",
    capturedAt: "2023-10-15T10:31:00Z",
    createdAt: "2023-10-15T10:30:00Z",
  },
  {
    id: "pay_002",
    orderId: "ord_10002",
    orderNumber: "ORD-10002",
    customerId: "cust_002",
    customerName: "Emily Johnson",
    amount: 89.5,
    method: "PayPal",
    methodDetails: "emily.johnson@example.com",
    currency: "USD",
    status: "paid",
    transactionId: "txn_bcd234efg567",
    authorizedAt: "2023-10-14T15:45:00Z",
    capturedAt: "2023-10-14T15:46:00Z",
    createdAt: "2023-10-14T15:45:00Z",
  },
  {
    id: "pay_003",
    orderId: "ord_10003",
    orderNumber: "ORD-10003",
    customerId: "cust_003",
    customerName: "Michael Brown",
    amount: 356.75,
    method: "Credit Card",
    methodDetails: "Mastercard •••• 5678",
    currency: "USD",
    status: "paid",
    transactionId: "txn_cde345fgh678",
    authorizedAt: "2023-10-13T09:15:00Z",
    capturedAt: "2023-10-13T09:16:00Z",
    createdAt: "2023-10-13T09:15:00Z",
  },
  {
    id: "pay_004",
    orderId: "ord_10004",
    orderNumber: "ORD-10004",
    customerId: "cust_004",
    customerName: "Sarah Davis",
    amount: 67.25,
    method: "Credit Card",
    methodDetails: "Amex •••• 9012",
    currency: "USD",
    status: "pending",
    transactionId: "txn_def456ghi789",
    authorizedAt: "2023-10-12T14:20:00Z",
    capturedAt: null,
    createdAt: "2023-10-12T14:20:00Z",
  },
  {
    id: "pay_005",
    orderId: "ord_10005",
    orderNumber: "ORD-10005",
    customerId: "cust_005",
    customerName: "Robert Wilson",
    amount: 215.0,
    method: "Credit Card",
    methodDetails: "Visa •••• 3456",
    currency: "USD",
    status: "refunded",
    transactionId: "txn_efg567hij890",
    authorizedAt: "2023-10-11T11:50:00Z",
    capturedAt: "2023-10-11T11:51:00Z",
    refundedAt: "2023-10-11T16:30:00Z",
    createdAt: "2023-10-11T11:50:00Z",
  },
  {
    id: "pay_006",
    orderId: "ord_10006",
    orderNumber: "ORD-10006",
    customerId: "cust_006",
    customerName: "Jennifer Lee",
    amount: 178.45,
    method: "Apple Pay",
    methodDetails: "Apple Pay",
    currency: "USD",
    status: "paid",
    transactionId: "txn_fgh678ijk901",
    authorizedAt: "2023-10-10T16:30:00Z",
    capturedAt: "2023-10-10T16:31:00Z",
    createdAt: "2023-10-10T16:30:00Z",
  },
  {
    id: "pay_007",
    orderId: "ord_10007",
    orderNumber: "ORD-10007",
    customerId: "cust_007",
    customerName: "David Garcia",
    amount: 432.0,
    method: "Credit Card",
    methodDetails: "Mastercard •••• 7890",
    currency: "USD",
    status: "failed",
    transactionId: "txn_ghi789jkl012",
    authorizedAt: null,
    capturedAt: null,
    errorMessage: "Insufficient funds",
    createdAt: "2023-10-09T13:25:00Z",
  },
  {
    id: "pay_008",
    orderId: "ord_10008",
    orderNumber: "ORD-10008",
    customerId: "cust_008",
    customerName: "Lisa Martinez",
    amount: 99.99,
    method: "Google Pay",
    methodDetails: "Google Pay",
    currency: "USD",
    status: "authorized",
    transactionId: "txn_hij890klm123",
    authorizedAt: "2023-10-08T10:15:00Z",
    capturedAt: null,
    createdAt: "2023-10-08T10:15:00Z",
  },
];

// Mock data for refunds
const refunds = [
  {
    id: "ref_001",
    paymentId: "pay_005",
    orderId: "ord_10005",
    orderNumber: "ORD-10005",
    customerId: "cust_005",
    customerName: "Robert Wilson",
    amount: 215.0,
    currency: "USD",
    reason: "Customer requested cancellation",
    status: "completed",
    transactionId: "txn_refund_123",
    createdAt: "2023-10-11T16:30:00Z",
    processedAt: "2023-10-11T16:35:00Z",
  },
  {
    id: "ref_002",
    paymentId: "pay_009",
    orderId: "ord_10009",
    orderNumber: "ORD-10009",
    customerId: "cust_009",
    customerName: "Kevin Thompson",
    amount: 45.5,
    currency: "USD",
    reason: "Item damaged during shipping",
    status: "pending",
    transactionId: "txn_refund_456",
    createdAt: "2023-10-07T17:40:00Z",
    processedAt: null,
  },
  {
    id: "ref_003",
    paymentId: "pay_010",
    orderId: "ord_10010",
    orderNumber: "ORD-10010",
    customerId: "cust_010",
    customerName: "Karen Robinson",
    amount: 32.75,
    currency: "USD",
    reason: "Wrong item received",
    status: "completed",
    transactionId: "txn_refund_789",
    createdAt: "2023-10-06T12:50:00Z",
    processedAt: "2023-10-06T14:20:00Z",
  },
];

export default function PaymentsPage() {
  const columns = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div>
            <div className="font-medium">{format(date, "MMM dd, yyyy")}</div>
            <div className="text-xs text-gray-500">
              {format(date, "h:mm a")}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) => {
        const orderId = row.original.orderId;
        const orderNumber = row.getValue("orderNumber") as string;
        return (
          <Link
            href={`/withAuth/orders/${orderId}`}
            className="font-medium hover:underline"
          >
            {orderNumber}
          </Link>
        );
      },
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => {
        const customerId = row.original.customerId;
        const customerName = row.getValue("customerName") as string;
        return (
          <Link
            href={`/withAuth/customers/${customerId}`}
            className="text-blue-600 hover:underline"
          >
            {customerName}
          </Link>
        );
      },
    },
    {
      accessorKey: "method",
      header: "Payment Method",
      cell: ({ row }) => {
        const method = row.getValue("method") as string;
        const details = row.original.methodDetails;

        let icon;
        if (method === "Credit Card")
          icon = <CreditCard className="h-4 w-4 mr-1" />;
        else if (method === "PayPal")
          icon = <DollarSign className="h-4 w-4 mr-1" />;
        else if (method === "Apple Pay")
          icon = <DollarSign className="h-4 w-4 mr-1" />;
        else if (method === "Google Pay")
          icon = <DollarSign className="h-4 w-4 mr-1" />;

        return (
          <div className="flex flex-col">
            <div className="flex items-center">
              {icon}
              {method}
            </div>
            <div className="text-xs text-gray-500">{details}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const currency = row.original.currency;

        return (
          <div className="font-medium text-right">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency,
            }).format(amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <PaymentStatusBadge status={status} />;
      },
    },
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => {
        const txnId = row.getValue("transactionId") as string;
        return <div className="text-xs text-gray-500 font-mono">{txnId}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const payment = row.original;
        const status = payment.status;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/payments/${payment.id}`}
                    className="w-full"
                  >
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/orders/${payment.orderId}`}
                    className="w-full"
                  >
                    View order
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {status === "authorized" && (
                  <DropdownMenuItem className="text-green-600">
                    Capture payment
                  </DropdownMenuItem>
                )}
                {(status === "paid" || status === "authorized") && (
                  <DropdownMenuItem className="text-amber-600">
                    Issue refund
                  </DropdownMenuItem>
                )}
                {status === "pending" && (
                  <DropdownMenuItem className="text-red-600">
                    Cancel payment
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>Print receipt</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const refundColumns = [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div>
            <div className="font-medium">{format(date, "MMM dd, yyyy")}</div>
            <div className="text-xs text-gray-500">
              {format(date, "h:mm a")}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "orderNumber",
      header: "Order",
      cell: ({ row }) => {
        const orderId = row.original.orderId;
        const orderNumber = row.getValue("orderNumber") as string;
        return (
          <Link
            href={`/withAuth/orders/${orderId}`}
            className="font-medium hover:underline"
          >
            {orderNumber}
          </Link>
        );
      },
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => {
        const customerId = row.original.customerId;
        const customerName = row.getValue("customerName") as string;
        return (
          <Link
            href={`/withAuth/customers/${customerId}`}
            className="text-blue-600 hover:underline"
          >
            {customerName}
          </Link>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const currency = row.original.currency;

        return (
          <div className="font-medium text-right">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency,
            }).format(amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.getValue("reason") as string;
        return <div className="text-sm">{reason}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        if (status === "completed") {
          return (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Completed
            </Badge>
          );
        } else if (status === "pending") {
          return (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
              Pending
            </Badge>
          );
        } else {
          return (
            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        }
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const refund = row.original;
        const status = refund.status;

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/refunds/${refund.id}`}
                    className="w-full"
                  >
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href={`/withAuth/orders/${refund.orderId}`}
                    className="w-full"
                  >
                    View order
                  </Link>
                </DropdownMenuItem>
                {status === "pending" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-green-600">
                      Process refund
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      Cancel refund
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Calculate total for each payment status
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === "pending" || p.status === "authorized")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = refunds
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalFailed = payments
    .filter((p) => p.status === "failed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Manage payments, transactions, and refunds
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ArrowUpCircle className="h-4 w-4 mr-2 text-green-500" />
              Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p) => p.status === "paid").length} successful
              payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-amber-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                payments.filter(
                  (p) => p.status === "pending" || p.status === "authorized"
                ).length
              }{" "}
              pending payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ArrowDownCircle className="h-4 w-4 mr-2 text-blue-500" />
              Refunded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(totalRefunded)}
            </div>
            <p className="text-xs text-muted-foreground">
              {refunds.filter((r) => r.status === "completed").length} processed
              refunds
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(totalFailed)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p) => p.status === "failed").length} failed
              payments
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Payment Search</h2>
            <p className="text-sm text-gray-500">
              Find payments by order ID, transaction ID, or customer
            </p>
          </div>
          <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search payments..."
                className="pl-8"
              />
            </div>
            <Button>Search</Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all-payments">
        <TabsList>
          <TabsTrigger value="all-payments">All Payments</TabsTrigger>
          <TabsTrigger value="successful">Successful</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
        </TabsList>
        <TabsContent value="all-payments" className="p-0 mt-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Payment Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Methods</SelectItem>
                  <SelectItem value="card">Credit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="apple-pay">Apple Pay</SelectItem>
                  <SelectItem value="google-pay">Google Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select defaultValue="all">
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="authorized">Authorized</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select defaultValue="date-desc">
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="amount-desc">
                    Amount (High to Low)
                  </SelectItem>
                  <SelectItem value="amount-asc">
                    Amount (Low to High)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={payments}
            searchableColumns={[
              {
                id: "orderNumber",
                title: "Order Number",
              },
              {
                id: "customerName",
                title: "Customer Name",
              },
              {
                id: "transactionId",
                title: "Transaction ID",
              },
            ]}
            filterableColumns={[
              {
                id: "status",
                title: "Status",
                options: [
                  { label: "Paid", value: "paid" },
                  { label: "Pending", value: "pending" },
                  { label: "Authorized", value: "authorized" },
                  { label: "Failed", value: "failed" },
                  { label: "Refunded", value: "refunded" },
                ],
              },
              {
                id: "method",
                title: "Payment Method",
                options: [
                  { label: "Credit Card", value: "Credit Card" },
                  { label: "PayPal", value: "PayPal" },
                  { label: "Apple Pay", value: "Apple Pay" },
                  { label: "Google Pay", value: "Google Pay" },
                ],
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="successful" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={payments.filter((p) => p.status === "paid")}
            searchableColumns={[
              {
                id: "orderNumber",
                title: "Order Number",
              },
              {
                id: "customerName",
                title: "Customer Name",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="pending" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={payments.filter(
              (p) => p.status === "pending" || p.status === "authorized"
            )}
            searchableColumns={[
              {
                id: "orderNumber",
                title: "Order Number",
              },
              {
                id: "customerName",
                title: "Customer Name",
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="refunds" className="p-0 mt-4">
          <DataTable
            columns={refundColumns}
            data={refunds}
            searchableColumns={[
              {
                id: "orderNumber",
                title: "Order Number",
              },
              {
                id: "customerName",
                title: "Customer Name",
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

// Payment status badge component
function PaymentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 justify-center">
          <CheckCircle className="h-3 w-3" />
          Paid
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex items-center gap-1 justify-center">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "authorized":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1 justify-center">
          <CheckCircle className="h-3 w-3" />
          Authorized
        </Badge>
      );
    case "refunded":
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 flex items-center gap-1 justify-center">
          <ArrowDownCircle className="h-3 w-3" />
          Refunded
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1 justify-center">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
  }
}
