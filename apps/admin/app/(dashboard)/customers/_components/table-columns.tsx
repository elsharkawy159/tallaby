"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ShoppingCart,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
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
import { StoreSiteLink } from "@/app/(dashboard)/_components/entity/store-site-link";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@workspace/ui/components/avatar";
import { cn } from "@workspace/ui/lib/utils";
import { DataTableColumnHeader } from "@/app/(dashboard)/_components/data-table/data-table-column-header";
import { getSelectColumn } from "@/app/(dashboard)/_components/data-table/data-table-select-column";
import type { DataTableFilter } from "@/app/(dashboard)/_components/data-table/data-table.types";
import { Eye } from "lucide-react";
import type { Customer } from "../customers.types";
import {
  getCustomerInitials,
  getCustomerDisplayName,
  getCustomerDisplayPhone,
} from "../customers.lib";

/** Server-side filters (URL params) for the customers table. */
export const customersFilters: DataTableFilter[] = [
  {
    id: "origin",
    title: "Came from",
    options: [
      { label: "A seller's store", value: "store" },
      { label: "Marketplace", value: "marketplace" },
      { label: "No orders yet", value: "none" },
    ],
  },
  {
    id: "verification",
    title: "Verification",
    options: [
      { label: "Verified", value: "verified" },
      { label: "Unverified", value: "unverified" },
    ],
  },
  {
    id: "accountStatus",
    title: "Status",
    options: [
      { label: "Active", value: "active" },
      { label: "Suspended", value: "suspended" },
    ],
  },
  {
    id: "account",
    title: "Account",
    options: [
      { label: "Registered", value: "registered" },
      { label: "Guest", value: "guest" },
    ],
  },
  { id: "created", title: "Joined", type: "dateRange" },
];

interface GetCustomersColumnsProps {
  onQuickView?: (customer: Customer) => void;
}

export function getCustomersColumns({
  onQuickView,
}: GetCustomersColumnsProps = {}): ColumnDef<Customer>[] {
  return [
    getSelectColumn<Customer>(),
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      enableHiding: false,
      meta: { label: "Name" },
      cell: ({ row }) => {
        const customer = row.original;
        const displayName = getCustomerDisplayName(customer);
        const initials = getCustomerInitials(customer);

        return (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onQuickView?.(customer)}
          >
            <Avatar className="h-9 w-9">
              {customer.avatarUrl && (
                <AvatarImage src={customer.avatarUrl} alt={displayName} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="font-medium group-hover:underline text-left flex items-center gap-2">
                  {displayName}

                  {customer.isSuspended && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  {customer.isVerified && !customer.isSuspended && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">{customer.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      enableSorting: false,
      meta: { label: "Phone" },
      cell: ({ row }) => {
        const customer = row.original;
        const phone = getCustomerDisplayPhone(customer);
        return <div>{phone || "—"}</div>;
      },
    },
    {
      id: "origin",
      header: "Came from",
      enableSorting: false,
      meta: { label: "Came from" },
      cell: ({ row }) => {
        const { originStore, totalOrders } = row.original;
        if (originStore) {
          return (
            <div className="space-y-0.5">
              <StoreSiteLink store={originStore} domain={originStore.domain} />
              {(totalOrders ?? 0) === 0 && (
                <p className="ms-4 text-xs text-muted-foreground">
                  Cart only, no orders yet
                </p>
              )}
            </div>
          );
        }
        return (
          <span className="text-sm text-muted-foreground">
            {(totalOrders ?? 0) > 0 ? "Marketplace" : "No orders yet"}
          </span>
        );
      },
    },
    {
      accessorKey: "isGuest",
      header: "Account",
      enableSorting: false,
      meta: { label: "Account" },
      cell: ({ row }) =>
        row.original.isGuest ? (
          <Badge variant="outline" className="font-normal">Guest</Badge>
        ) : (
          <Badge variant="secondary" className="font-normal">Registered</Badge>
        ),
    },
    {
      accessorKey: "isVerified",
      header: "Verified",
      enableSorting: false,
      meta: { label: "Verified" },
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
      meta: { label: "Orders" },
      cell: ({ row }) => {
        const orders = Number(row.getValue("totalOrders")) || 0;
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
      meta: { label: "Total spent" },
      cell: ({ row }) => {
        const amount = Number(row.getValue("totalSpent")) || 0;
        const formatted = new Intl.NumberFormat("en-EG", {
          style: "currency",
          currency: "EGP",
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
      meta: { label: "Last order" },
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
      accessorKey: "lastLoginAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Login" />
      ),
      meta: { label: "Last login" },
      cell: ({ row }) => {
        const customer = row.original;
        const date = customer.lastLoginAt;

        if (!date) {
          return <div className="text-gray-400">Never</div>;
        }

        const formatted = new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(date));

        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      meta: { label: "Joined" },
      cell: ({ row }) => {
        const date = row.original.createdAt;
        if (!date) return <div className="text-gray-400">—</div>;
        return (
          <div className="whitespace-nowrap">
            {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
              new Date(date)
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
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
              {onQuickView && (
                <DropdownMenuItem onClick={() => onQuickView(customer)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Quick view
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/customers/${customer.id}`} className="w-full">
                  View profile
                </Link>
              </DropdownMenuItem>
              {customer.email && (
                <DropdownMenuItem asChild>
                  <a href={`mailto:${customer.email}`} className="w-full">
                    Send email
                  </a>
                </DropdownMenuItem>
              )}
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
