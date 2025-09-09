"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Package } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

export function getOrdersColumns(
  onAction?: (orderId: string, action: string) => void
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
            <DropdownMenuContent align="end">
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

              {order.status === "pending" && onAction && (
                <DropdownMenuItem onClick={() => onAction(order.id, "confirm")}>
                  Confirm Order
                </DropdownMenuItem>
              )}

              {(order.status === "confirmed" ||
                order.status === "shipping_soon") &&
                onAction && (
                  <DropdownMenuItem onClick={() => onAction(order.id, "ship")}>
                    Mark as Shipped
                  </DropdownMenuItem>
                )}

              {order.status === "shipped" && onAction && (
                <DropdownMenuItem onClick={() => onAction(order.id, "deliver")}>
                  Mark as Delivered
                </DropdownMenuItem>
              )}

              {order.status !== "cancelled" &&
                order.status !== "delivered" &&
                onAction && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onAction(order.id, "cancel")}
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
