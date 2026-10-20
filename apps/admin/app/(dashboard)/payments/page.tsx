import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { logServerError } from "@workspace/db/log";
import { formatCurrency } from "@workspace/lib";
import { getPaymentsOverviewForAdmin, type AdminPaymentsOverview } from "@workspace/lib/admin/server";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { AdminTable, type AdminTableColumn } from "../_components/admin-table/admin-table";
import { MetricCard } from "../_components/cards/metric-card";
import { formatPaymentMethodLabel, getStatusLabel } from "../orders/orders.lib";
import { formatAdminDate } from "../stores/stores.lib";
import { summarizePayments, type PaymentGroup } from "./payments.lib";

export const dynamic = "force-dynamic";

const GROUP_CARDS: { group: PaymentGroup; title: string; help: string }[] = [
  { group: "received", title: "Received", help: "Paid online or collected on delivery" },
  { group: "pending", title: "Awaiting payment", help: "Pending or authorized" },
  { group: "failed", title: "Failed", help: "Payment attempts that failed" },
  { group: "refunded", title: "Refunded", help: "Fully or partly refunded" },
];

const METHOD_COLUMNS: AdminTableColumn[] = [
  { id: "method", header: "Method", sortable: true },
  { id: "orders", header: "Orders", sortable: true, descFirst: true, align: "end" },
  { id: "received", header: "Received", sortable: true, descFirst: true, align: "end" },
  { id: "pending", header: "Awaiting", sortable: true, descFirst: true, align: "end" },
  { id: "failed", header: "Failed / refunded", sortable: true, descFirst: true, align: "end" },
  { id: "amount", header: "Order value", sortable: true, descFirst: true, align: "end" },
];

const TRANSACTION_COLUMNS: AdminTableColumn[] = [
  { id: "createdAt", header: "Date", sortable: true, descFirst: true },
  { id: "order", header: "Order", sortable: true },
  { id: "method", header: "Method", sortable: true },
  { id: "status", header: "Status", sortable: true },
  { id: "transactionId", header: "Transaction" },
  { id: "amount", header: "Amount", sortable: true, descFirst: true, align: "end" },
];

const TOP_UP_COLUMNS: AdminTableColumn[] = [
  { id: "provider", header: "Provider", sortable: true },
  { id: "status", header: "Status", sortable: true },
  { id: "count", header: "Top-ups", sortable: true, descFirst: true, align: "end" },
  { id: "amount", header: "Amount", sortable: true, descFirst: true, align: "end" },
];

const STATUS_CLASSES: Record<string, string> = {
  paid: "bg-green-100 text-green-900 border-green-200",
  collected: "bg-green-100 text-green-900 border-green-200",
  approved: "bg-green-100 text-green-900 border-green-200",
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  authorized: "bg-blue-100 text-blue-900 border-blue-200",
  failed: "bg-red-100 text-red-900 border-red-200",
  rejected: "bg-red-100 text-red-900 border-red-200",
  refunded: "bg-gray-100 text-gray-800 border-gray-200",
  partially_refunded: "bg-gray-100 text-gray-800 border-gray-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`font-normal ${STATUS_CLASSES[status] ?? ""}`}>
      {getStatusLabel(status)}
    </Badge>
  );
}

const money = (amount: number) => formatCurrency(amount);

/**
 * Money coming in, from the database: customer payments as recorded on
 * orders, online gateway transactions (`payments`) and seller store top-ups.
 * Read-only; payments are changed from the order or the top-up review.
 */
export default async function PaymentsPage() {
  await getCurrentAdminUser();
  let data: AdminPaymentsOverview;
  try {
    data = await getPaymentsOverviewForAdmin();
  } catch (error) {
    logServerError("admin", "payments overview failed", {}, error);
    return <p className="text-sm text-destructive">Payments could not be loaded. Try again.</p>;
  }
  const { totals, methods } = summarizePayments(data.byMethod);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Customer payments recorded on orders, online gateway transactions and seller store top-ups. To mark an
          order paid, open the order; top-ups are reviewed in Store top-ups.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GROUP_CARDS.map(({ group, title, help }) => (
          <MetricCard
            key={group}
            title={title}
            value={money(totals[group].amount)}
            helpText={`${totals[group].orders.toLocaleString()} ${totals[group].orders === 1 ? "order" : "orders"} · ${help}`}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By payment method</CardTitle>
          <CardDescription>Every order, grouped by how the customer chose to pay. Open a method to see its orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTable
            columns={METHOD_COLUMNS}
            defaultSort={{ id: "orders", desc: true }}
            emptyMessage="No orders yet."
            rows={methods.map((m) => ({
              id: m.method,
              sortValues: {
                method: formatPaymentMethodLabel(m.method),
                orders: m.orders,
                received: m.groups.received.amount,
                pending: m.groups.pending.amount,
                failed: m.groups.failed.orders + m.groups.refunded.orders,
                amount: m.amount,
              },
              cells: {
                method: (
                  <Link href={`/orders?paymentMethod=${encodeURIComponent(m.method)}`} className="font-medium hover:underline">
                    {formatPaymentMethodLabel(m.method)}
                  </Link>
                ),
                orders: <span className="tabular-nums">{m.orders.toLocaleString()}</span>,
                received: <Amount value={m.groups.received.amount} count={m.groups.received.orders} />,
                pending: <Amount value={m.groups.pending.amount} count={m.groups.pending.orders} />,
                failed: (
                  <span className="tabular-nums">
                    {m.groups.failed.orders} / {m.groups.refunded.orders}
                  </span>
                ),
                amount: <span className="tabular-nums font-medium">{money(m.amount)}</span>,
              },
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Online transactions</CardTitle>
          <CardDescription>The latest 100 gateway payments (card and wallet checkouts).</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTable
            columns={TRANSACTION_COLUMNS}
            defaultSort={{ id: "createdAt", desc: true }}
            emptyMessage="No online payments recorded yet."
            rows={data.transactions.map((tx) => ({
              id: tx.id,
              className: "align-top",
              sortValues: {
                createdAt: tx.createdAt,
                order: tx.orderNumber,
                method: formatPaymentMethodLabel(tx.method),
                status: tx.status,
                amount: tx.amount,
              },
              cells: {
                createdAt: <span className="whitespace-nowrap text-xs text-muted-foreground">{formatAdminDate(tx.createdAt)}</span>,
                order: (
                  <Link href={`/orders/${tx.orderId}`} className="font-medium hover:underline">
                    #{tx.orderNumber}
                  </Link>
                ),
                method: <span className="text-sm">{formatPaymentMethodLabel(tx.method)}</span>,
                status: (
                  <>
                    <StatusBadge status={tx.status} />
                    {tx.errorMessage && <p className="mt-1 max-w-64 text-xs text-destructive">{tx.errorMessage}</p>}
                  </>
                ),
                transactionId: (
                  <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                    {tx.transactionId ?? "—"}
                  </span>
                ),
                amount: <span className="tabular-nums">{money(tx.amount)}</span>,
              },
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Store wallet top-ups</CardTitle>
            <CardDescription>What sellers paid into their store wallets, by provider and status.</CardDescription>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/store-top-ups">Review top-ups</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <AdminTable
            columns={TOP_UP_COLUMNS}
            defaultSort={{ id: "count", desc: true }}
            emptyMessage="No store top-ups yet."
            rows={data.topUps.map((row) => ({
              id: `${row.provider}:${row.status}`,
              sortValues: {
                provider: formatPaymentMethodLabel(row.provider),
                status: row.status,
                count: row.count,
                amount: row.amount,
              },
              cells: {
                provider: <span className="text-sm">{formatPaymentMethodLabel(row.provider)}</span>,
                status: <StatusBadge status={row.status} />,
                count: <span className="tabular-nums">{row.count.toLocaleString()}</span>,
                amount: <span className="tabular-nums">{money(row.amount)}</span>,
              },
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Amount({ value, count }: { value: number; count: number }) {
  if (!count) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="tabular-nums">
      {money(value)}
      <span className="block text-xs text-muted-foreground">
        {count.toLocaleString()} {count === 1 ? "order" : "orders"}
      </span>
    </span>
  );
}
