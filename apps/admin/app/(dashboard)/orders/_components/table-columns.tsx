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
} from "../orders.lib";

const ORDER_STATUSES = [
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

export function getOrdersColumns(
  onAction?: (orderId: string, action: string) => void,
  onPaymentStatusChange?: (orderId: string, paymentStatus: string) => void
): ColumnDef<Order>[] {
  return [
    {
      accessorKey: "orderNumber",
      header: "Order Number",
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
            <div className="text-xs text-gray-500">{order.id}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "customer",
      header: "Customer",
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
      header: "Total",
      cell: ({ row }) => {
        const amount = row.original.totalAmount;
        return <div className="font-medium">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: "items",
      header: "Items",
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
      cell: ({ row }) => {
        const status = row.original.paymentStatus;
        return (
          <Badge className={getPaymentStatusColor(status)}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return <div>{formatDate(date)}</div>;
      },
    },
    {
      id: "actions",
      header: "Actions",
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

              {order.paymentMethod === "online" &&
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
