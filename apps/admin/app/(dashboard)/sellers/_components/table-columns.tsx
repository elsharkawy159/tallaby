"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, MoreHorizontal, Star } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { DataTableColumnHeader } from "../../_components/data-table/data-table-column-header";
import type { DataTableFilter } from "../../_components/data-table/data-table.types";
import {
  CommissionExemptToggle,
  FreeDeliveryToggle,
  StatusBadge,
} from "../sellers.chunks";
import {
  canApproveSeller,
  canReactivateSeller,
  canSuspendSeller,
  formatCurrency,
  formatDate,
  getBusinessTypeOptions,
  getInitials,
  getRatingDisplay,
  getStatusOptions,
} from "../sellers.lib";
import type { Seller } from "../sellers.types";

/** Server-side filters (URL params) for the sellers table. */
export const sellersFilters: DataTableFilter[] = [
  { id: "status", title: "Status", options: getStatusOptions() },
  {
    id: "businessType",
    title: "Business type",
    options: getBusinessTypeOptions(),
  },
  {
    id: "verification",
    title: "Verification",
    options: [
      { value: "verified", label: "Verified" },
      { value: "unverified", label: "Unverified" },
    ],
  },
  {
    id: "commission",
    title: "Commission",
    options: [
      { value: "exempt", label: "Fee exempt" },
      { value: "charged", label: "Commission charged" },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    options: [
      { value: "free", label: "Free delivery" },
      { value: "paid", label: "Paid delivery" },
    ],
  },
  { id: "joined", title: "Joined", type: "dateRange" },
];

export function getSellersColumns(
  onAction: (sellerId: string, action: string) => void
): ColumnDef<Seller>[] {
  return [
    {
      accessorKey: "businessName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Seller" />
      ),
      enableHiding: false,
      meta: { label: "Seller" },
      cell: ({ row }) => {
        const seller = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={seller.logoUrl || undefined} />
              <AvatarFallback>{getInitials(seller.businessName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link
                href={`/sellers/${seller.id}`}
                className="block max-w-52 truncate font-medium hover:underline"
                title={seller.businessName}
              >
                {seller.businessName}
              </Link>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="max-w-44 truncate">{seller.displayName}</span>
                {seller.isVerified && (
                  <CheckCircle className="h-3 w-3 shrink-0 text-blue-500" />
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      meta: { label: "Status" },
      cell: ({ row }) => <StatusBadge status={row.original.status || "pending"} />,
    },
    {
      accessorKey: "productCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Products" />
      ),
      meta: { label: "Products" },
      cell: ({ row }) => (
        <Link
          href={`/products?seller=${encodeURIComponent(row.original.slug)}`}
          className="hover:underline"
        >
          {row.original.productCount}
        </Link>
      ),
    },
    {
      accessorKey: "storeRating",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rating" />
      ),
      meta: { label: "Rating" },
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="ml-1 font-medium">
              {getRatingDisplay(row.original)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.totalRatings} reviews
          </div>
        </div>
      ),
    },
    {
      id: "commission",
      accessorFn: (seller) =>
        seller.isCommissionExempt ? 0 : seller.commissionRate,
      header: "Commission",
      enableSorting: false,
      meta: { label: "Commission" },
      cell: ({ row }) =>
        row.original.isCommissionExempt ? (
          <span className="text-sm text-muted-foreground">0%</span>
        ) : (
          <span>{row.original.commissionRate}%</span>
        ),
    },
    {
      accessorKey: "isCommissionExempt",
      header: "Fee exempt",
      enableSorting: false,
      meta: { label: "Fee exempt" },
      cell: ({ row }) => (
        <CommissionExemptToggle
          sellerId={row.original.id}
          isCommissionExempt={row.original.isCommissionExempt}
        />
      ),
    },
    {
      accessorKey: "freeDelivery",
      header: "Free delivery",
      enableSorting: false,
      meta: { label: "Free delivery" },
      cell: ({ row }) => (
        <FreeDeliveryToggle
          sellerId={row.original.id}
          freeDelivery={row.original.freeDelivery}
        />
      ),
    },
    {
      accessorKey: "walletBalance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Balance" />
      ),
      meta: { label: "Balance" },
      cell: ({ row }) => (
        <div className="font-medium whitespace-nowrap">
          {formatCurrency(row.original.walletBalance)}
        </div>
      ),
    },
    {
      accessorKey: "joinDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      meta: { label: "Joined" },
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-sm">
          {formatDate(row.original.joinDate)}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const seller = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            {canApproveSeller(seller) && (
              <Button
                size="sm"
                onClick={() => onAction(seller.id, "approve")}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
            )}
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
                  <Link href={`/sellers/${seller.id}`} className="w-full">
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/sellers/${seller.id}/edit`} className="w-full">
                    Edit seller
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={`/products?seller=${encodeURIComponent(seller.slug)}`}
                    className="w-full"
                  >
                    View products
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/sellers/${seller.id}/orders`} className="w-full">
                    View orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/sellers/${seller.id}/payouts`} className="w-full">
                    Manage payouts
                  </Link>
                </DropdownMenuItem>
                {(canSuspendSeller(seller) || canReactivateSeller(seller)) && (
                  <DropdownMenuSeparator />
                )}
                {canSuspendSeller(seller) && (
                  <DropdownMenuItem
                    onClick={() => onAction(seller.id, "suspend")}
                    className="text-red-600"
                  >
                    Suspend seller
                  </DropdownMenuItem>
                )}
                {canReactivateSeller(seller) && (
                  <DropdownMenuItem
                    onClick={() => onAction(seller.id, "reactivate")}
                    className="text-green-600"
                  >
                    Reactivate seller
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
