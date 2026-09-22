"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { DataTableColumnHeader } from "../../_components/data-table/data-table-column-header";
import type { DataTableFilter } from "../../_components/data-table/data-table.types";
import {
  PayoutRequestActions,
  TopUpRequestActions,
  WalletLedgerButton,
} from "../wallets.chunks";
import {
  PAYOUT_STATUS_OPTIONS,
  TOP_UP_STATUS_OPTIONS,
  WALLET_STATUS_OPTIONS,
  describeDestination,
  formatDateTime,
  formatTopUpProvider,
  money,
  payoutStatusVariant,
  topUpStatusVariant,
  walletStatusVariant,
} from "../wallets.lib";
import type {
  PayoutRequestRow,
  TopUpRequestRow,
  WalletRow,
} from "../wallets.types";

export const payoutFilters: DataTableFilter[] = [
  { id: "status", title: "Status", options: PAYOUT_STATUS_OPTIONS },
];
export const topUpFilters: DataTableFilter[] = [
  { id: "status", title: "Status", options: TOP_UP_STATUS_OPTIONS },
];
export const walletFilters: DataTableFilter[] = [
  { id: "status", title: "Status", options: WALLET_STATUS_OPTIONS },
];

function UserCell({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string | null;
  role: string | null;
}) {
  return (
    <div className="min-w-0">
      <div className="max-w-52 truncate font-medium">{name ?? "—"}</div>
      <div className="max-w-52 truncate text-xs text-muted-foreground">
        {email ?? "—"} · {role ?? "—"}
      </div>
    </div>
  );
}

function WalletFiguresCell({
  balance,
  reserved,
}: {
  balance: string;
  reserved: string;
}) {
  return (
    <div>
      <div className="text-sm">{money(balance)}</div>
      <div className="text-xs text-muted-foreground">
        reserved {money(reserved)}
      </div>
    </div>
  );
}

export function getPayoutColumns(
  onChanged: () => void
): ColumnDef<PayoutRequestRow>[] {
  return [
    {
      id: "user",
      header: "User",
      enableHiding: false,
      cell: ({ row }) => (
        <UserCell
          name={row.original.userName}
          email={row.original.userEmail}
          role={row.original.userRole}
        />
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      meta: { label: "Amount" },
      cell: ({ row }) => (
        <span className="font-semibold">{money(row.original.amount)}</span>
      ),
    },
    {
      id: "destination",
      header: "Destination",
      meta: { label: "Destination" },
      cell: ({ row }) => (
        <div>
          <div className="text-sm">{row.original.method}</div>
          <div className="text-xs text-muted-foreground">
            {describeDestination(row.original.destination)}
          </div>
        </div>
      ),
    },
    {
      id: "wallet",
      header: "Wallet",
      meta: { label: "Wallet" },
      cell: ({ row }) => (
        <WalletFiguresCell
          balance={row.original.walletBalance}
          reserved={row.original.walletReservedBalance}
        />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      meta: { label: "Status" },
      cell: ({ row }) => (
        <Badge variant={payoutStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Requested" />
      ),
      meta: { label: "Requested" },
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      cell: ({ row }) => (
        <PayoutRequestActions request={row.original} onChanged={onChanged} />
      ),
    },
  ];
}

export function getTopUpColumns(
  onChanged: () => void
): ColumnDef<TopUpRequestRow>[] {
  return [
    {
      id: "user",
      header: "User",
      enableHiding: false,
      cell: ({ row }) => (
        <UserCell
          name={row.original.userName}
          email={row.original.userEmail}
          role={row.original.userRole}
        />
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      meta: { label: "Amount" },
      cell: ({ row }) => (
        <span className="font-semibold">{money(row.original.amount)}</span>
      ),
    },
    {
      id: "method",
      header: "Method",
      meta: { label: "Method" },
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div>
            <div className="text-sm">{formatTopUpProvider(request.provider)}</div>
            {request.paymentSelfReported ? (
              <div className="text-xs text-emerald-600">
                Self-reported
                {request.paymentSelfReportedAt
                  ? ` · ${formatDateTime(request.paymentSelfReportedAt)}`
                  : ""}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Awaiting transfer
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "wallet",
      header: "Wallet",
      meta: { label: "Wallet" },
      cell: ({ row }) => (
        <WalletFiguresCell
          balance={row.original.walletBalance}
          reserved={row.original.walletReservedBalance}
        />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      meta: { label: "Status" },
      cell: ({ row }) => (
        <div>
          <Badge variant={topUpStatusVariant(row.original.status)}>
            {row.original.status}
          </Badge>
          {row.original.failureReason ? (
            <div
              className="mt-1 max-w-40 truncate text-xs text-muted-foreground"
              title={row.original.failureReason}
            >
              {row.original.failureReason}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Requested" />
      ),
      meta: { label: "Requested" },
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      cell: ({ row }) => (
        <TopUpRequestActions request={row.original} onChanged={onChanged} />
      ),
    },
  ];
}

export function getWalletColumns(): ColumnDef<WalletRow>[] {
  return [
    {
      id: "user",
      header: "User",
      enableHiding: false,
      cell: ({ row }) => (
        <UserCell
          name={row.original.userName}
          email={row.original.userEmail}
          role={row.original.userRole}
        />
      ),
    },
    {
      accessorKey: "availableBalance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Available" />
      ),
      meta: { label: "Available" },
      cell: ({ row }) => (
        <span className="font-semibold">
          {money(row.original.availableBalance)}
        </span>
      ),
    },
    {
      accessorKey: "balance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Balance" />
      ),
      meta: { label: "Balance" },
      cell: ({ row }) => money(row.original.balance),
    },
    {
      accessorKey: "reservedBalance",
      header: "Reserved",
      enableSorting: false,
      meta: { label: "Reserved" },
      cell: ({ row }) => money(row.original.reservedBalance),
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      meta: { label: "Status" },
      cell: ({ row }) => (
        <Badge variant={walletStatusVariant(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Opened" />
      ),
      meta: { label: "Opened" },
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="text-right">
          <WalletLedgerButton wallet={row.original} />
        </div>
      ),
    },
  ];
}
