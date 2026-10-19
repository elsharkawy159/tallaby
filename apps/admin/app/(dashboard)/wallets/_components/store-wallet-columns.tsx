"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
import type { AdminStoreWalletEntryRow, AdminStoreWalletRow, StoreWalletAuditRow } from "@workspace/lib/admin/server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { DataTableColumnHeader } from "../../_components/data-table/data-table-column-header";
import type { DataTableFilter } from "../../_components/data-table/data-table.types";
import { auditActionLabel, describeChange } from "../../sellers/[id]/seller-admin.lib";
import { TopUpReviewActions } from "../store-wallet-actions.client";
import type { StoreTopUpWithProof } from "../store-wallets.data";
import {
  BALANCE_OPTIONS,
  CHECK_OPTIONS,
  DIRECTION_OPTIONS,
  ENTRY_TYPE_OPTIONS,
  TOP_UP_PROVIDER_OPTIONS,
  TOP_UP_STATUS_LABELS,
  TOP_UP_STATUS_OPTIONS,
  WALLET_STATUS_LABELS,
  WALLET_STATUS_OPTIONS,
  cairoDateTime,
  egp,
  entryTypeLabel,
  shortId,
  signClass,
  topUpProviderLabel,
} from "../store-wallets.lib";

export const storeWalletFilters: DataTableFilter[] = [
  { id: "balance", title: "Balance", options: BALANCE_OPTIONS },
  { id: "status", title: "Wallet status", options: WALLET_STATUS_OPTIONS },
  { id: "check", title: "Ledger check", options: CHECK_OPTIONS },
];

export const storeWalletEntryFilters: DataTableFilter[] = [
  { id: "type", title: "Type", options: ENTRY_TYPE_OPTIONS },
  { id: "direction", title: "Direction", type: "select", options: DIRECTION_OPTIONS, allLabel: "Credits and debits" },
  { id: "created", title: "Date", type: "dateRange" },
];

export const storeTopUpFilters: DataTableFilter[] = [
  { id: "status", title: "Status", options: TOP_UP_STATUS_OPTIONS },
  { id: "provider", title: "Method", options: TOP_UP_PROVIDER_OPTIONS },
];

const sellerWalletHref = (sellerId: string) => `/wallets/sellers/${sellerId}`;

function SellerLink({ sellerId, name }: { sellerId: string; name: string | null }) {
  return (
    <Link href={sellerWalletHref(sellerId)} className="block max-w-52 truncate font-medium hover:underline">
      {name ?? shortId(sellerId)}
    </Link>
  );
}

function Money({ value, bold = false }: { value: string | null; bold?: boolean }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return <span className={`tabular-nums ${bold ? "font-semibold" : ""} ${signClass(value)}`}>{egp(value)}</span>;
}

/* Wallets ------------------------------------------------------------------ */

export function getStoreWalletColumns(): ColumnDef<AdminStoreWalletRow>[] {
  return [
    {
      id: "name",
      accessorKey: "sellerName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Seller" />,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="min-w-0">
          <SellerLink sellerId={row.original.sellerId} name={row.original.sellerName} />
          <div className="max-w-52 truncate text-xs text-muted-foreground">{row.original.sellerEmail ?? "—"}</div>
        </div>
      ),
    },
    {
      id: "balance",
      accessorKey: "balance",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Balance" />,
      meta: { label: "Balance" },
      cell: ({ row }) => (
        <div>
          <Money value={row.original.balance} bold />
          {row.original.mismatch && (
            <div className="flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertTriangle className="size-3" aria-hidden /> Ledger {egp(row.original.ledgerTotal)}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "walletStatus",
      header: "Wallet",
      meta: { label: "Wallet" },
      cell: ({ row }) =>
        row.original.walletStatus ? (
          <Badge variant={row.original.walletStatus === "active" ? "outline" : "destructive"}>
            {WALLET_STATUS_LABELS[row.original.walletStatus] ?? row.original.walletStatus}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Not opened yet</span>
        ),
    },
    {
      id: "negativeLimit",
      header: "Negative limit",
      meta: { label: "Negative limit" },
      cell: ({ row }) =>
        row.original.negativeLimit ? (
          <span className="tabular-nums">{egp(`-${row.original.negativeLimit}`)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        ),
    },
    {
      id: "entries",
      header: "Entries",
      meta: { label: "Entries" },
      cell: ({ row }) => <span className="tabular-nums">{row.original.entryCount.toLocaleString()}</span>,
    },
    {
      id: "lastEntryAt",
      accessorKey: "lastEntryAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last entry" />,
      meta: { label: "Last entry" },
      cell: ({ row }) => <span className="whitespace-nowrap text-sm">{cairoDateTime(row.original.lastEntryAt)}</span>,
    },
    {
      id: "pendingTopUps",
      header: "To review",
      meta: { label: "Top-ups to review" },
      cell: ({ row }) =>
        row.original.pendingTopUps > 0 ? (
          <Badge variant="secondary">{row.original.pendingTopUps} top-up{row.original.pendingTopUps > 1 ? "s" : ""}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button asChild size="sm" variant="outline">
            <Link href={sellerWalletHref(row.original.sellerId)}>Open wallet</Link>
          </Button>
        </div>
      ),
    },
  ];
}

/* Ledger ------------------------------------------------------------------- */

function Reference({ entry }: { entry: AdminStoreWalletEntryRow }) {
  if (entry.orderId) {
    return (
      <Link href={`/orders/${entry.orderId}`} className="text-xs hover:underline">
        Order {shortId(entry.orderId)}
      </Link>
    );
  }
  if (!entry.referenceType) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="font-mono text-xs" title={`${entry.referenceType}:${entry.referenceId ?? ""}`}>
      {entry.referenceType}:{(entry.referenceId ?? "").slice(0, 16)}
    </span>
  );
}

export function getStoreWalletEntryColumns({ showSeller }: { showSeller: boolean }): ColumnDef<AdminStoreWalletEntryRow>[] {
  const columns: ColumnDef<AdminStoreWalletEntryRow>[] = [
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      meta: { label: "Date" },
      cell: ({ row }) => <span className="whitespace-nowrap text-sm">{cairoDateTime(row.original.createdAt)}</span>,
    },
  ];
  if (showSeller) {
    columns.push({
      id: "seller",
      header: "Seller",
      meta: { label: "Seller" },
      cell: ({ row }) => <SellerLink sellerId={row.original.sellerId} name={row.original.sellerName} />,
    });
  }
  columns.push(
    {
      id: "type",
      header: "Type",
      meta: { label: "Type" },
      cell: ({ row }) => (
        <div className="max-w-64">
          <div className="font-medium">{entryTypeLabel(row.original.type)}</div>
          {row.original.description && <div className="truncate text-xs text-muted-foreground">{row.original.description}</div>}
          {row.original.reason && row.original.reason !== row.original.description && (
            <div className="truncate text-xs text-muted-foreground" title={row.original.reason}>
              Reason: {row.original.reason}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "store",
      header: "Store",
      meta: { label: "Store" },
      cell: ({ row }) => <span className="text-sm">{row.original.storeName ?? "Account"}</span>,
    },
    {
      id: "reference",
      header: "Reference",
      meta: { label: "Reference" },
      cell: ({ row }) => <Reference entry={row.original} />,
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      meta: { label: "Amount" },
      cell: ({ row }) => <Money value={row.original.amount} bold />,
    },
    {
      id: "balance",
      header: "Balance",
      meta: { label: "Balance before → after" },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
          {row.original.balanceBefore !== null ? egp(row.original.balanceBefore) : "—"} →{" "}
          <span className={signClass(row.original.balanceAfter)}>
            {row.original.balanceAfter !== null ? egp(row.original.balanceAfter) : "—"}
          </span>
        </span>
      ),
    },
    {
      id: "by",
      header: "By",
      meta: { label: "Posted by" },
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.createdBy ? (row.original.createdByName ?? "Admin") : "System"}</span>
      ),
    },
  );
  return columns;
}

/* Top-ups ------------------------------------------------------------------ */

const TOP_UP_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  succeeded: "default",
  failed: "destructive",
  cancelled: "outline",
};

export function getStoreTopUpColumns({ showSeller }: { showSeller: boolean }): ColumnDef<StoreTopUpWithProof>[] {
  const columns: ColumnDef<StoreTopUpWithProof>[] = [
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Requested" />,
      meta: { label: "Requested" },
      cell: ({ row }) => <span className="whitespace-nowrap text-sm">{cairoDateTime(row.original.createdAt)}</span>,
    },
  ];
  if (showSeller) {
    columns.push({
      id: "seller",
      header: "Seller",
      meta: { label: "Seller" },
      cell: ({ row }) => <SellerLink sellerId={row.original.sellerId} name={row.original.sellerName} />,
    });
  }
  columns.push(
    {
      id: "amount",
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      meta: { label: "Amount" },
      cell: ({ row }) => <span className="font-semibold tabular-nums">{egp(row.original.amount)}</span>,
    },
    {
      id: "method",
      header: "Method",
      meta: { label: "Method" },
      cell: ({ row }) => (
        <div>
          <div className="text-sm">{topUpProviderLabel(row.original.provider)}</div>
          <div className="font-mono text-xs text-muted-foreground">
            {row.original.senderPhone ?? row.original.providerTransactionId ?? row.original.providerReference ?? "—"}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      meta: { label: "Status" },
      cell: ({ row }) => (
        <div className="max-w-56">
          <Badge variant={TOP_UP_BADGE[row.original.status] ?? "secondary"}>
            {TOP_UP_STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
          {row.original.failureReason && (
            <div className="truncate text-xs text-red-600" title={row.original.failureReason}>
              {row.original.failureReason}
            </div>
          )}
          {row.original.status !== "pending" && (
            <div className="text-xs text-muted-foreground">Updated {cairoDateTime(row.original.updatedAt)}</div>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => <TopUpReviewActions row={row.original} />,
    },
  );
  return columns;
}

/* Audit -------------------------------------------------------------------- */

export function getStoreWalletAuditColumns({ showSeller }: { showSeller: boolean }): ColumnDef<StoreWalletAuditRow>[] {
  const columns: ColumnDef<StoreWalletAuditRow>[] = [
    {
      id: "createdAt",
      header: "Date",
      meta: { label: "Date" },
      cell: ({ row }) => <span className="whitespace-nowrap text-sm">{cairoDateTime(row.original.createdAt)}</span>,
    },
  ];
  if (showSeller) {
    columns.push({
      id: "seller",
      header: "Seller",
      meta: { label: "Seller" },
      cell: ({ row }) => <SellerLink sellerId={row.original.sellerId} name={row.original.sellerName} />,
    });
  }
  columns.push(
    {
      id: "action",
      header: "Action",
      meta: { label: "Action" },
      cell: ({ row }) => <span className="font-medium">{auditActionLabel(row.original.action)}</span>,
    },
    {
      id: "change",
      header: "Change",
      meta: { label: "Change" },
      cell: ({ row }) => (
        <div className="max-w-80 text-xs text-muted-foreground">
          <div className="truncate" title={describeChange(row.original.before)}>
            Before: {describeChange(row.original.before)}
          </div>
          <div className="truncate" title={describeChange(row.original.after)}>
            After: {describeChange(row.original.after)}
          </div>
        </div>
      ),
    },
    {
      id: "reason",
      header: "Reason",
      meta: { label: "Reason" },
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-64 text-sm" title={row.original.reason}>
          {row.original.reason}
        </span>
      ),
    },
    {
      id: "actor",
      header: "Admin",
      meta: { label: "Admin" },
      cell: ({ row }) => <span className="text-sm">{row.original.actorName ?? "—"}</span>,
    },
  );
  return columns;
}
