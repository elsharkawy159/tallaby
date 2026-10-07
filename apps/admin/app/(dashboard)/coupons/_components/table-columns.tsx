"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@workspace/ui/lib/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
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
  COUPON_STATE_LABELS,
  DISCOUNT_TYPE_LABELS,
  formatCouponDate,
  formatCouponDiscount,
  formatEgp,
  getCouponState,
} from "../coupons.lib";
import type { AdminCoupon, CouponState } from "../coupons.types";

const STATE_BADGE_CLASS: Record<CouponState, string> = {
  active: "border-transparent bg-primary/10 text-primary",
  scheduled: "border-transparent bg-secondary text-secondary-foreground",
  expired: "border-transparent bg-destructive/10 text-destructive",
  inactive: "text-muted-foreground",
};

export const COUPON_FILTERS: DataTableFilter[] = [
  {
    id: "state",
    title: "Status",
    options: (Object.keys(COUPON_STATE_LABELS) as CouponState[]).map((state) => ({
      value: state,
      label: COUPON_STATE_LABELS[state],
    })),
  },
  {
    id: "type",
    title: "Type",
    options: Object.entries(DISCOUNT_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  },
];

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success(`Copied ${code}`);
  } catch {
    toast.error("Couldn't copy to clipboard");
  }
}

interface CouponColumnsOptions {
  onEdit: (coupon: AdminCoupon) => void;
  onToggleActive: (coupon: AdminCoupon) => void;
  onDelete: (coupon: AdminCoupon) => void;
  isBusy: (couponId: string) => boolean;
}

export function getCouponsColumns({
  onEdit,
  onToggleActive,
  onDelete,
  isBusy,
}: CouponColumnsOptions): ColumnDef<AdminCoupon>[] {
  return [
    {
      id: "code",
      accessorKey: "code",
      meta: { label: "Code" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
      cell: ({ row }) => (
        <div className="min-w-40">
          <div className="flex items-center gap-1">
            <span className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-sm font-medium">
              {row.original.code}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => copyCode(row.original.code)}
              aria-label={`Copy ${row.original.code}`}
            >
              <Copy className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {row.original.name}
          </p>
        </div>
      ),
    },
    {
      id: "discountValue",
      accessorKey: "discountValue",
      meta: { label: "Discount" },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Discount" />
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="font-medium">{formatCouponDiscount(row.original)}</p>
          {row.original.minimumPurchase && (
            <p className="text-xs text-muted-foreground">
              Min. order {formatEgp(row.original.minimumPurchase)}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "usageCount",
      accessorKey: "usageCount",
      meta: { label: "Usage" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Usage" />,
      cell: ({ row }) => {
        const used = row.original.usageCount ?? 0;
        const limit = row.original.usageLimit;
        return (
          <div className="whitespace-nowrap tabular-nums">
            <p className="font-medium">
              {used.toLocaleString()}
              {limit ? (
                <span className="font-normal text-muted-foreground">
                  {" "}
                  / {limit.toLocaleString()}
                </span>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.isOneTimeUse
                ? "Once per customer"
                : row.original.perUserLimit
                  ? `${row.original.perUserLimit} per customer`
                  : "Unlimited per customer"}
            </p>
          </div>
        );
      },
    },
    {
      id: "expiresAt",
      accessorKey: "expiresAt",
      meta: { label: "Validity" },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Validity" />
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-sm">
          <p>{formatCouponDate(row.original.startsAt)}</p>
          <p className="text-muted-foreground">
            → {formatCouponDate(row.original.expiresAt)}
          </p>
        </div>
      ),
    },
    {
      id: "state",
      meta: { label: "Status" },
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const state = getCouponState(row.original);
        return (
          <Badge variant="outline" className={cn(STATE_BADGE_CLASS[state])}>
            {COUPON_STATE_LABELS[state]}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const coupon = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={isBusy(coupon.id)}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(coupon)}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyCode(coupon.code)}>
                  <Copy className="size-4" />
                  Copy code
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(coupon)}>
                  {coupon.isActive ? (
                    <>
                      <XCircle className="size-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle className="size-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(coupon)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
