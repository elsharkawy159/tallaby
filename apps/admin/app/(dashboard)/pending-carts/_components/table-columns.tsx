"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { CheckCheck, Package } from "lucide-react";
import { DataTableColumnHeader } from "../../_components/data-table/data-table-column-header";
import type { DataTableFilter } from "../../_components/data-table/data-table.types";
import type { PendingCart } from "../pending-carts.types";
import {
  formatCurrency,
  formatDate,
  getCustomerEmail,
  getCustomerName,
  shortenId,
} from "../pending-carts.lib";

/** Server-side filters (URL params) for the pending carts table. */
export const pendingCartsFilters: DataTableFilter[] = [
  {
    id: "reminder",
    title: "Reminder",
    options: [
      { value: "reminded", label: "Reminded" },
      { value: "not-reminded", label: "Not reminded" },
    ],
  },
  {
    id: "customer",
    title: "Customer type",
    options: [
      { value: "registered", label: "Registered" },
      { value: "guest", label: "Guest" },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    options: [
      { value: "opted-in", label: "Opted in" },
      { value: "opted-out", label: "Opted out" },
    ],
  },
];

export function getPendingCartsColumns(
  onQuickView: (cart: PendingCart) => void
): ColumnDef<PendingCart>[] {
  return [
    {
      accessorKey: "id",
      header: "Cart ID",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const cart = row.original;
        return (
          <button
            type="button"
            onClick={() => onQuickView(cart)}
            className="font-mono font-medium text-blue-600 hover:underline text-left"
          >
            {shortenId(cart.id)}
          </button>
        );
      },
    },
    {
      id: "customer",
      accessorFn: (cart) => getCustomerName(cart),
      header: "Customer",
      enableSorting: false,
      meta: { label: "Customer" },
      cell: ({ row }) => {
        const cart = row.original;
        return (
          <button
            type="button"
            onClick={() => onQuickView(cart)}
            className="flex flex-col text-left"
          >
            <span className="font-medium hover:underline">
              {getCustomerName(cart)}
            </span>
            <span className="text-xs text-muted-foreground">
              {getCustomerEmail(cart)}
            </span>
          </button>
        );
      },
    },
    {
      accessorKey: "itemCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Items" />
      ),
      meta: { label: "Items" },
      cell: ({ row }) => (
        <div className="flex items-center">
          <Package className="h-4 w-4 mr-1 text-muted-foreground" />
          {row.original.itemCount}
        </div>
      ),
    },
    {
      accessorKey: "totalValue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Value" />
      ),
      meta: { label: "Value" },
      cell: ({ row }) => (
        <div className="font-medium">
          {formatCurrency(row.original.totalValue)}
        </div>
      ),
    },
    {
      id: "reminder",
      accessorFn: (cart) => (cart.reminderSentAt ? "reminded" : "not-reminded"),
      header: "Reminder",
      enableSorting: false,
      meta: { label: "Reminder" },
      cell: ({ row }) =>
        row.original.reminderSentAt ? (
          <Badge
            className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
            title={formatDate(row.original.reminderSentAt)}
          >
            <CheckCheck className="mr-1 h-3 w-3" />
            Reminded
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "guest",
      accessorFn: (cart) => (cart.user?.isGuest ? "guest" : "registered"),
      header: "Account",
      enableSorting: false,
      meta: { label: "Account" },
      cell: ({ row }) =>
        row.original.user?.isGuest ? (
          <Badge variant="outline">Guest</Badge>
        ) : (
          <Badge variant="secondary">Registered</Badge>
        ),
    },
    {
      id: "marketing",
      accessorFn: (cart) => cart.user?.receiveMarketingEmails ?? false,
      header: "Marketing",
      enableSorting: false,
      meta: { label: "Marketing" },
      cell: ({ row }) =>
        row.original.user?.receiveMarketingEmails ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Opted in
          </Badge>
        ) : (
          <Badge variant="outline">Opted out</Badge>
        ),
    },
    {
      accessorKey: "lastActivity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last activity" />
      ),
      meta: { label: "Last activity" },
      cell: ({ row }) => {
        const cart = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm">{formatDate(cart.lastActivity)}</span>
            {cart.isAbandoned && (
              <Badge className="mt-1 w-fit bg-amber-100 text-amber-800 hover:bg-amber-100">
                Abandoned
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      meta: { label: "Created" },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];
}
