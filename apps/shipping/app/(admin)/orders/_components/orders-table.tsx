import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

import { formatAddress, formatCurrency } from "@/lib/format";
import {
  getPaymentStatusColor,
  getStatusColor,
  getStatusLabel,
} from "@/lib/shipping-status";
import type { ShippingOrderRow } from "../orders.types";

interface OrdersTableProps {
  rows: ShippingOrderRow[];
}

export function OrdersTable({ rows }: OrdersTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-white p-10 text-center dark:bg-gray-950">
        <p className="text-sm text-muted-foreground">
          No orders match these filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-white shadow-sm dark:bg-gray-950">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="min-w-64">Address</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Rider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.orderId}>
              <TableCell className="font-medium">
                <Link
                  href={`/orders/${row.orderId}`}
                  className="hover:underline"
                >
                  {row.orderNumber}
                </Link>
              </TableCell>
              <TableCell>{row.customerName ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {row.addressPhone ?? row.customerPhone ?? "—"}
              </TableCell>
              <TableCell className="max-w-80 truncate text-muted-foreground">
                {formatAddress(
                  row.addressLine1
                    ? {
                        addressLine1: row.addressLine1,
                        addressLine2: row.addressLine2,
                        city: row.city ?? "",
                        state: row.state ?? "",
                        postalCode: row.postalCode,
                        country: row.country,
                      }
                    : null
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right">
                {formatCurrency(Number(row.totalAmount))}
              </TableCell>
              <TableCell>
                <Badge className={getPaymentStatusColor(row.paymentStatus ?? "")}>
                  {getStatusLabel(row.paymentStatus ?? "unknown")}
                </Badge>
              </TableCell>
              <TableCell>{row.providerName ?? "—"}</TableCell>
              <TableCell>{row.riderName ?? "—"}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(row.shippingStatus)}>
                  {getStatusLabel(row.shippingStatus)}
                </Badge>
              </TableCell>
              <TableCell>
                <Link
                  href={`/orders/${row.orderId}`}
                  aria-label={`Open order ${row.orderNumber}`}
                  className="inline-flex text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="size-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
