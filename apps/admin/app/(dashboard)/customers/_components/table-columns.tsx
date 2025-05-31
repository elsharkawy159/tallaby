"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ShoppingCart,
  Check,
  X,
  User,
  AlertTriangle,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { cn } from "@workspace/ui/lib/utils";
import { DataTableColumnHeader } from "@/app/(dashboard)/_components/data-table/data-table-column-header";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  isSuspended: boolean;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
}

export function getCustomersColumns(): ColumnDef<Customer>[] {
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
      accessorKey: "firstName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const firstName = row?.getValue("firstName") as string;
        const lastName = row?.getValue("lastName") as string;
        const fullName = `${firstName} ${lastName}`;
        const initials = `${firstName?.[0]}${lastName?.[0]}`;

        // Status indicators
        const isVerified = row.original.isVerified;
        const isSuspended = row.original.isSuspended;

        let statusIcon = null;
        if (isSuspended) {
          statusIcon = <AlertTriangle className="h-4 w-4 text-red-500 ml-1" />;
        } else if (!isVerified) {
          statusIcon = (
            <AlertTriangle className="h-4 w-4 text-amber-500 ml-1" />
          );
        }

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center">
                <Link
                  href={`/customers/${row.original.id}`}
                  className="font-medium hover:underline"
                >
                  {fullName}
                </Link>
                {statusIcon}
              </div>
              <div className="text-xs text-gray-500">{row.original.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => {
        return <div>{row.getValue("phone")}</div>;
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as string;

        let badgeVariant: "default" | "secondary" | "outline";
        switch (role) {
          case "admin":
            badgeVariant = "default";
            break;
          case "seller":
            badgeVariant = "secondary";
            break;
          default:
            badgeVariant = "outline";
        }

        return (
          <Badge variant={badgeVariant} className="capitalize">
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isVerified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Verified" />
      ),
      cell: ({ row }) => {
        const isVerified = row.getValue("isVerified") as boolean;

        return isVerified ? (
          <Check className="h-5 w-5 text-green-500 mx-auto" />
        ) : (
          <X className="h-5 w-5 text-red-500 mx-auto" />
        );
      },
    },
    {
      accessorKey: "totalOrders",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Orders" />
      ),
      cell: ({ row }) => {
        const orders = parseInt(row.getValue("totalOrders"));
        return (
          <div className="flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 mr-1 text-gray-500" />
            <span>{orders}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalSpent",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Spent" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalSpent"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);

        const valueClass = cn(
          "font-medium",
          amount > 1000 ? "text-green-600" : "",
          amount === 0 ? "text-gray-400" : ""
        );

        return <div className={valueClass}>{formatted}</div>;
      },
    },
    {
      accessorKey: "lastOrderDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Order" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("lastOrderDate");

        if (!date) {
          return <div className="text-gray-400">No orders</div>;
        }

        const formatted = new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
        }).format(new Date(date as string));

        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        const formatted = new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
        }).format(date);

        return <div>{formatted}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const customer = row.original;

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
                <Link href={`/customers/${customer.id}`} className="w-full">
                  View profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href={`/customers/${customer.id}/edit`}
                  className="w-full"
                >
                  Edit customer
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link
                  href={`/customers/${customer.id}/orders`}
                  className="w-full"
                >
                  View orders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Send email</DropdownMenuItem>
              <DropdownMenuSeparator />
              {customer.isVerified ? (
                <DropdownMenuItem className="text-amber-600">
                  Unverify account
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-green-600">
                  Verify account
                </DropdownMenuItem>
              )}
              {customer.isSuspended ? (
                <DropdownMenuItem className="text-green-600">
                  Reactivate account
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-red-600">
                  Suspend account
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
