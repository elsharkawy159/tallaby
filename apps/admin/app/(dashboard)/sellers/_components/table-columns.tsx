"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, MoreHorizontal } from "lucide-react";
import { HEARD_ABOUT_US_LABELS, HEARD_ABOUT_US_SOURCES, isHeardAboutUsSource } from "@workspace/lib/sellers";
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
import { StatusBadge } from "../sellers.chunks";
import {
  canApproveSeller,
  canReactivateSeller,
  canSuspendSeller,
  formatCurrency,
  formatDate,
  getBusinessTypeOptions,
  getInitials,
  getStatusOptions,
} from "../sellers.lib";
import type { Seller } from "../sellers.types";
import { customerHref, ordersHref, sellerHref, sellerWalletHref } from "../../_components/entity/entity-href.lib";
import { PlatformFeeSummary } from "../../_components/entity/platform-fee.chunks";
import { StoreSiteLink } from "../../_components/entity/store-site-link";
import { SellerWhatsAppButton } from "./seller-whatsapp-button";

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
    id: "source",
    title: "Heard from",
    options: [
      ...HEARD_ABOUT_US_SOURCES.map((value) => ({ value, label: HEARD_ABOUT_US_LABELS[value] })),
      { value: "unknown", label: "Not answered" },
    ],
  },
  {
    id: "site",
    title: "Website",
    options: [
      { value: "published", label: "Published" },
      { value: "not_published", label: "Not published" },
    ],
  },
  {
    id: "wallet",
    title: "Wallet",
    options: [
      { value: "negative", label: "Negative balance" },
      { value: "non_negative", label: "Zero or positive" },
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
        const name = seller.ownerName?.trim() || seller.displayName || seller.businessName;
        const contact = seller.ownerEmail || seller.supportEmail;
        const phone = seller.ownerPhone || seller.supportPhone;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={seller.logoUrl || undefined} />
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <Link
                  href={sellerHref(seller.id)}
                  className="block max-w-48 truncate font-medium hover:underline"
                  title={name}
                >
                  {name}
                </Link>
                {seller.isVerified && (
                  <CheckCircle className="h-3 w-3 shrink-0 text-blue-500" aria-label="Verified" />
                )}
              </div>
              <div className="max-w-52 truncate text-xs text-muted-foreground" dir="ltr" title={contact}>
                {contact}
              </div>
              {phone && (
                <div className="text-xs text-muted-foreground tabular-nums" dir="ltr">
                  {phone}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "store",
      header: "Store",
      enableSorting: false,
      meta: { label: "Store" },
      cell: ({ row }) => {
        const seller = row.original;
        const [store, ...more] = seller.stores ?? [];
        if (!store) {
          return <span className="text-sm text-muted-foreground">No store yet</span>;
        }
        return (
          <div className="space-y-0.5">
            <StoreSiteLink store={store} domain={store.domain} />
            {more.length > 0 && (
              <Link
                href={`/stores?seller=${seller.id}`}
                className="ms-4 block text-xs text-muted-foreground hover:underline"
              >
                +{more.length} more {more.length === 1 ? "store" : "stores"}
              </Link>
            )}
          </div>
        );
      },
    },
    {
      id: "heardAboutUs",
      header: "Heard from",
      enableSorting: false,
      meta: { label: "Heard from" },
      cell: ({ row }) => {
        const { heardAboutUs, heardAboutUsOther } = row.original;
        if (!isHeardAboutUsSource(heardAboutUs)) {
          return <span className="text-sm text-muted-foreground">Not answered</span>;
        }
        return (
          <div className="text-sm">
            {HEARD_ABOUT_US_LABELS[heardAboutUs]}
            {heardAboutUsOther && (
              <div className="max-w-40 truncate text-xs text-muted-foreground" title={heardAboutUsOther}>
                {heardAboutUsOther}
              </div>
            )}
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
      id: "platformFee",
      header: "Platform fee",
      enableSorting: false,
      meta: { label: "Platform fee" },
      cell: ({ row }) => <PlatformFeeSummary seller={row.original} compact />,
    },
    {
      id: "lastOrder",
      header: "Last order",
      enableSorting: false,
      meta: { label: "Last order" },
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-sm text-muted-foreground">
          {row.original.lastOrderAt ? formatDate(row.original.lastOrderAt) : "—"}
        </div>
      ),
    },
    {
      accessorKey: "walletBalance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Balance" />
      ),
      meta: { label: "Balance" },
      cell: ({ row }) => (
        <div
          className={
            Number(row.original.walletBalance) < 0
              ? "font-medium whitespace-nowrap text-destructive"
              : "font-medium whitespace-nowrap"
          }
        >
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
            <SellerWhatsAppButton seller={seller} />
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
                  <Link href={sellerHref(seller.id)} className="w-full">
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={customerHref(seller.id)} className="w-full">
                    Owner account
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
                  <Link href={ordersHref({ seller: seller.id })} className="w-full">
                    View orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={sellerWalletHref(seller.id)} className="w-full">
                    Store wallet
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
