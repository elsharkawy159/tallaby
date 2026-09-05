"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { DataTableColumnHeader } from "@/app/(dashboard)/_components/data-table/data-table-column-header";
import type { AffiliateListRow } from "../affiliate.types";
import { affiliateStatusVariant, formatDate, money } from "../affiliate.lib";

function initialsFor(row: AffiliateListRow): string {
  const source = row.fullName || row.email || "A";
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source[0]?.toUpperCase() || "A";
}

export function getAffiliateColumns(): ColumnDef<AffiliateListRow>[] {
  return [
    {
      accessorKey: "fullName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Affiliate" />
      ),
      cell: ({ row }) => {
        const affiliate = row.original;
        return (
          <Link
            href={`/affiliate/${affiliate.affiliateId}`}
            className="flex items-center gap-3 group"
          >
            <Avatar className="h-9 w-9">
              {affiliate.avatarUrl && (
                <AvatarImage
                  src={affiliate.avatarUrl}
                  alt={affiliate.fullName ?? affiliate.email ?? ""}
                />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initialsFor(affiliate)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium group-hover:underline">
                {affiliate.fullName || "—"}
              </span>
              <span className="text-xs text-gray-500">{affiliate.email}</span>
            </div>
          </Link>
        );
      },
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Affiliate Code" />
      ),
      cell: ({ row }) => (
        <code className="rounded bg-muted px-2 py-1 font-mono text-xs font-medium">
          {row.original.code}
        </code>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={affiliateStatusVariant(row.original.status)} className="capitalize">
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => <div>{formatDate(row.original.createdAt)}</div>,
    },
    {
      accessorKey: "totalOrders",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Orders" />
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.original.totalOrders}</div>
      ),
    },
    {
      accessorKey: "deliveredOrders",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Delivered" />
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.original.deliveredOrders}</div>
      ),
    },
    {
      accessorKey: "pendingProfit",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Pending Profit" />
      ),
      cell: ({ row }) => <div>{money(row.original.pendingProfit)}</div>,
    },
    {
      accessorKey: "totalProfit",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Profit" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{money(row.original.totalProfit)}</div>
      ),
    },
    {
      accessorKey: "walletBalance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Wallet" />
      ),
      cell: ({ row }) => <div>{money(row.original.walletBalance)}</div>,
    },
  ];
}
