"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Package } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
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
import { DataTableColumnHeader } from "@/app/(dashboard)/_components/data-table/data-table-column-header";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  items: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export function getOrdersColumns(): ColumnDef<Order>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order Number" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <Link
              href={`/orders/${row.original.id}`}
              className="font-medium hover:underline"
            >
              {row.getValue("orderNumber")}
            </Link>
            <div className="text-xs text-gray-500">{row.original.id}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <span className="font-medium">{row.getValue("customerName")}</span>
            <span className="text-xs text-gray-500">
              {row.original.customerEmail}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalAmount"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);

        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: "items",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Items" />
      ),
      cell: ({ row }) => {
        const items = parseInt(row.getValue("items"));
        return (
          <div className="flex items-center">
            <Package className="h-4 w-4 mr-1 text-gray-500" />
            <span>{items}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;

        let variant: "default" | "secondary" | "destructive" | "outline" =
          "default";
        let label = status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

        switch (status) {
          case "pending":
            variant = "outline";
            break;
          case "confirmed":
          case "shipping_soon":
            variant = "secondary";
            break;
          case "shipped":
          case "out_for_delivery":
          case "delivered":
            variant = "default";
            break;
          case "cancelled":
            variant = "destructive";
            break;
        }

        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: "paymentStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("paymentStatus") as string;

        let variant: "default" | "secondary" | "destructive" | "outline" =
          "default";
        let label = status.charAt(0).toUpperCase() + status.slice(1);

        switch (status) {
          case "pending":
            variant = "outline";
            break;
          case "paid":
            variant = "default";
            break;
          case "failed":
            variant = "destructive";
            break;
          case "refunded":
            variant = "secondary";
            break;
        }

        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        const formatted = new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date);

        return <div>{formatted}</div>;
      },
    },
    {
      id: "actions",
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
              <DropdownMenuItem>
                <Link href={`/orders/${order.id}`} className="w-full">
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href={`/orders/${order.id}/edit`} className="w-full">
                  Edit order
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Update status</DropdownMenuItem>
              <DropdownMenuItem>Send notification</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Cancel order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
