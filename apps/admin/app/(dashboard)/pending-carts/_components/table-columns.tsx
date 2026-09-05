"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Package } from "lucide-react";
import type { PendingCart } from "../pending-carts.types";
import {
  formatCurrency,
  formatDate,
  getCustomerEmail,
  getCustomerName,
  shortenId,
} from "../pending-carts.lib";

export function getPendingCartsColumns(
  onQuickView: (cart: PendingCart) => void
): ColumnDef<PendingCart>[] {
  return [
    {
      accessorKey: "id",
      header: "Cart ID",
      cell: ({ row }) => {
        const cart = row.original;
        return (
          <button
            type="button"
            onClick={() => onQuickView(cart)}
            className="font-medium text-blue-600 hover:underline text-left"
          >
            {shortenId(cart.id)}
          </button>
        );
      },
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const cart = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{getCustomerName(cart)}</span>
            <span className="text-xs text-muted-foreground">
              {getCustomerEmail(cart)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "itemCount",
      header: "Items",
      cell: ({ row }) => {
        const count = row.original.itemCount;
        return (
          <div className="flex items-center">
            <Package className="h-4 w-4 mr-1 text-muted-foreground" />
            {count}
          </div>
        );
      },
    },
    {
      accessorKey: "totalValue",
      header: "Value",
      cell: ({ row }) => (
        <div className="font-medium">
          {formatCurrency(row.original.totalValue)}
        </div>
      ),
    },
    {
      accessorKey: "isGuest",
      header: "Guest",
      cell: ({ row }) =>
        row.original.user?.isGuest ? (
          <Badge variant="outline">Guest</Badge>
        ) : (
          <Badge variant="secondary">Registered</Badge>
        ),
    },
    {
      accessorKey: "receiveMarketingEmails",
      header: "Marketing",
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
      header: "Last activity",
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
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];
}
