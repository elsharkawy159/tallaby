"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { TableSection } from "@workspace/ui/components/table-section";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { getPublicUrl } from "@/lib/utils";

export type VendorOrderRow = {
  id: string;
  orderId: string;
  createdAt: string;
  customerName: string;
  productTitle: string;
  productImage?: string | null;
  variant?: string | null;
  quantity: number;
  total: string;
  status:
    | "pending"
    | "payment_processing"
    | "confirmed"
    | "shipping_soon"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "refund_requested"
    | "refunded"
    | string;
};

export function VendorOrdersTable({ rows }: { rows: VendorOrderRow[] }) {
  const columns = useMemo<ColumnDef<VendorOrderRow, any>[]>(
    () => [
      {
        id: "order",
        header: "Order",
        size: 140,
        accessorFn: (row) => row.orderId,
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">#{row.original.orderId}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(row.original.createdAt).toLocaleString()}
            </div>
          </div>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        size: 160,
        accessorFn: (row) => row.customerName,
        cell: ({ row }) => <span>{row.original.customerName}</span>,
      },
      {
        id: "item",
        header: "Item",
        size: 320,
        cell: ({ row }) => {
          const image = row.original.productImage
            ? getPublicUrl(row.original.productImage, "products")
            : undefined;
          return (
            <div className="flex items-center gap-3">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt={row.original.productTitle}
                  className="h-10 w-10 rounded object-cover border"
                />
              ) : (
                <div className="h-10 w-10 rounded border bg-muted" />
              )}
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {row.original.productTitle}
                </div>
                {row.original.variant && (
                  <div className="text-xs text-muted-foreground truncate">
                    {row.original.variant}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "qty",
        header: "Qty",
        size: 60,
        accessorFn: (row) => row.quantity,
        cell: ({ row }) => <span>{row.original.quantity}</span>,
      },
      {
        id: "total",
        header: "Total",
        size: 100,
        accessorFn: (row) => row.total,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.total}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        size: 160,
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <Badge variant={statusToVariant(row.original.status)}>
            {formatStatus(row.original.status)}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <TableSection<VendorOrderRow>
      rows={rows}
      columns={columns}
      searchColumnId="order"
    />
  );
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/^\w/, (m) => m.toUpperCase());
}

function statusToVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "pending":
    case "payment_processing":
      return "secondary";
    case "confirmed":
    case "shipping_soon":
    case "shipped":
    case "out_for_delivery":
    case "delivered":
      return "default";
    case "cancelled":
    case "refund_requested":
    case "refunded":
      return "destructive";
    default:
      return "outline";
  }
}

export function VendorOrdersSkeleton() {
  return (
    <div className="h-48 rounded-md border bg-muted" />
  );
}
