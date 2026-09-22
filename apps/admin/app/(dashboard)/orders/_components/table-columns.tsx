"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Package, CreditCard } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@workspace/ui/components/dropdown-menu";
import Link from "next/link";
import { DataTableColumnHeader } from "../../_components/data-table/data-table-column-header";
import { getSelectColumn } from "../../_components/data-table/data-table-select-column";
import type { DataTableFilter } from "../../_components/data-table/data-table.types";
import { Order } from "../orders.types";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getPaymentStatusColor,
  getStatusLabel,
  getCustomerName,
  getCustomerEmail,
  getItemsCount,
  isAdminEditablePaymentMethod,
  formatPaymentMethodLabel,
} from "../orders.lib";

export const ORDER_STATUSES = [
  "pending",
  "payment_processing",
  "confirmed",
  "shipping_soon",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund_requested",
  "refunded",
  "returned",
] as const;

const PAYMENT_STATUSES = [
  "pending",
  "authorized",
  "paid",
  "collected",
  "failed",
  "refunded",
  "partially_refunded",
] as const;

/** Server-side filters (URL params) for the orders table. */
export function getOrdersFilters(paymentMethods: string[]): DataTableFilter[] {
  return [
    {
      id: "status",
      title: "Status",
      options: ORDER_STATUSES.map((value) => ({
        value,
        label: getStatusLabel(value),
      })),
    },
    {
      id: "paymentStatus",
      title: "Payment",
      options: PAYMENT_STATUSES.map((value) => ({
        value,
        label: getStatusLabel(value),
      })),
    },
    {
      id: "paymentMethod",
      title: "Method",
      options: paymentMethods.map((value) => ({
        value,
        label: formatPaymentMethodLabel(value),
      })),
    },
    {
      id: "source",
      title: "Source",
      options: [
        { value: "website", label: "Website" },
        { value: "external", label: "External" },
      ],
    },
    { id: "created", title: "Date", type: "dateRange" },
  ];
}

export function getOrdersColumns(
  onAction?: (orderId: string, action: string) => void,
  onPaymentStatusChange?: (orderId: string, paymentStatus: string) => void
): ColumnDef<Order>[] {
  return [
    getSelectColumn<Order>(),
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      enableHiding: false,
      meta: { label: "Order" },
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex flex-col">
            <Link
              href={`/orders/${order.id}`}
              className="font-medium hover:underline text-blue-600"
            >
              {order.orderNumber}
            </Link>
            <div className="max-w-40 truncate font-mono text-xs text-muted-foreground" title={order.id}>
              {order.id}
            </div>
          </div>
        );
      },
    },
    {
      id: "customer",
      accessorFn: (order) => getCustomerName(order),
      header: "Customer",
      enableSorting: false,
      meta: { label: "Customer" },
      cell: ({ row }) => {
        const order = row.original;
        const customerName = getCustomerName(order);
        const customerEmail = getCustomerEmail(order);

        return (
          <div className="flex flex-col">
            <span className="font-medium">{customerName}</span>
            <span className="text-xs text-gray-500">{customerEmail}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      meta: { label: "Total" },
      cell: ({ row }) => {
        const amount = row.original.totalAmount;
        return <div className="font-medium">{formatCurrency(amount)}</div>;
      },
    },
    {
      id: "items",
      accessorFn: (order) => getItemsCount(order),
      header: "Items",
      enableSorting: false,
      meta: { label: "Items" },
      cell: ({ row }) => {
        const order = row.original;
        const itemsCount = getItemsCount(order);
        return (
          <div className="flex items-center">
            <Package className="h-4 w-4 mr-1 text-gray-500" />
            <span>{itemsCount}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      meta: { label: "Status" },
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={getStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      enableSorting: false,
      meta: { label: "Payment" },
      cell: ({ row }) => {
        const { paymentStatus, paymentMethod } = row.original;
        return (
          <div className="flex flex-col items-start gap-1">
            <Badge className={getPaymentStatusColor(paymentStatus)}>
              {getStatusLabel(paymentStatus)}
            </Badge>
            {paymentMethod && (
              <span className="text-xs text-muted-foreground">
                {formatPaymentMethodLabel(paymentMethod)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      meta: { label: "Date" },
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/orders/${order.id}`} className="w-full">
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/orders/${order.id}/edit`} className="w-full">
                  Edit order
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {ORDER_STATUSES.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => onAction?.(order.id, status)}
                      disabled={order.status === status}
                    >
                      {getStatusLabel(status)}
                      {order.status === status && (
                        <span className="ml-auto">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {isAdminEditablePaymentMethod(order.paymentMethod) &&
                order.paymentStatus !== "paid" &&
                onPaymentStatusChange && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        onPaymentStatusChange(order.id, "paid")
                      }
                      className="text-green-600"
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Mark Payment as Paid
                    </DropdownMenuItem>
                  </>
                )}

              {order.status !== "cancelled" &&
                order.status !== "delivered" &&
                onAction && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onAction(order.id, "cancelled")}
                    >
                      Cancel Order
                    </DropdownMenuItem>
                  </>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
