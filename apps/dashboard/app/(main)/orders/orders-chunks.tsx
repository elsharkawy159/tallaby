"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { TableSection } from "@workspace/ui/components/table-section";
import { Badge } from "@workspace/ui/components/badge";
import { getPublicUrl } from "@/lib/utils";
import Image from "next/image";
import { formatOrderStatus, orderStatusVariant } from "./orders.lib";
import { OrderDetailsDialog } from "./order-details-dialog.client";

export type VendorOrderRow = {
  /** order_items.id */
  id: string;
  /** orders.id — the UUID `getOrderDetails` expects. */
  orderId: string;
  /** Customer-facing reference (order_number), not the UUID. */
  orderNumber: string;
  createdAt: string;
  customerName: string;
  productTitle: string;
  productImage?: string | null;
  productSlug?: string | null;
  variant?: string | null;
  quantity: number;
  total: string;
  status:
    | "pending"
    | "assigned"
    | "payment_processing"
    | "confirmed"
    | "shipping_soon"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "failed"
    | "returned"
    | "cancelled"
    | "refund_requested"
    | "refunded"
    | string;
};

export function VendorOrdersTable({ rows }: { rows: VendorOrderRow[] }) {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<VendorOrderRow, any>[]>(
    () => [
      {
        id: "order",
        header: "Order",
        size: 140,
        accessorFn: (row) => row.orderNumber,
        cell: ({ row }) => (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setOpenOrderId(row.original.orderId)}
              className="font-medium text-primary hover:underline focus-visible:ring-ring/50 rounded-sm outline-none focus-visible:ring-[3px]"
            >
              #{row.original.orderNumber}
            </button>
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
                <Image
                  src={image}
                  alt={row.original.productTitle}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded object-cover border"
                />
              ) : (
                <div className="h-10 w-10 rounded border bg-muted" />
              )}
              <div className="min-w-0">
                <div className="truncate font-medium max-w-20">
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
          <Badge variant={orderStatusVariant(row.original.status)}>
            {formatOrderStatus(row.original.status)}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <>
      <TableSection<VendorOrderRow>
        rows={rows}
        columns={columns}
        searchColumnId="order"
      />
      <OrderDetailsDialog
        orderId={openOrderId}
        onClose={() => setOpenOrderId(null)}
      />
    </>
  );
}

export function VendorOrdersSkeleton() {
  return <div className="h-48 rounded-md border bg-muted" />;
}
