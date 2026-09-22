"use client";

import { useMemo } from "react";
import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  PackageCheck,
  PiggyBank,
  ShoppingCart,
  Tag,
  Wallet as WalletIcon,
} from "lucide-react";

import { Card, CardContent } from "@workspace/ui/components/card";

import { DataTable } from "../_components/data-table/data-table";
import type { DataTableFilter } from "../_components/data-table/data-table.types";
import { getAffiliateColumns } from "./_components/table-columns";
import {
  AFFILIATE_EARNINGS_OPTIONS,
  AFFILIATE_PERFORMANCE_OPTIONS,
  AFFILIATE_STATUS_OPTIONS,
  money,
} from "./affiliate.lib";
import { AFFILIATES_DEFAULT_SORT } from "./affiliate.params";
import type { AffiliateListRow, AffiliateStats } from "./affiliate.types";

const AFFILIATE_FILTERS: DataTableFilter[] = [
  { id: "status", title: "Status", options: AFFILIATE_STATUS_OPTIONS },
  {
    id: "performance",
    title: "Performance",
    type: "select",
    allLabel: "All performance",
    options: AFFILIATE_PERFORMANCE_OPTIONS,
  },
  {
    id: "earnings",
    title: "Earnings",
    type: "select",
    allLabel: "All earnings",
    options: AFFILIATE_EARNINGS_OPTIONS,
  },
  { id: "created", title: "Joined", type: "dateRange" },
];

export function AffiliateClientWrapper({
  stats,
  rows,
  totalCount,
}: {
  stats: AffiliateStats;
  rows: AffiliateListRow[];
  totalCount: number;
}) {
  const columns = useMemo(() => getAffiliateColumns(), []);

  const tiles = [
    { label: "Total Affiliates", value: stats.totalAffiliates.toLocaleString(), icon: Tag },
    { label: "Active Affiliates", value: stats.activeAffiliates.toLocaleString(), icon: CheckCircle2 },
    { label: "Total Referred Orders", value: stats.totalReferredOrders.toLocaleString(), icon: ShoppingCart },
    { label: "Delivered Orders", value: stats.deliveredOrders.toLocaleString(), icon: PackageCheck },
    { label: "Pending Profit", value: money(stats.pendingProfit), icon: CircleDollarSign },
    { label: "Total Affiliate Profit", value: money(stats.totalProfit), icon: Banknote },
    { label: "Total Wallet Balance", value: money(stats.totalWalletBalance), icon: WalletIcon },
    { label: "Customer Savings", value: money(stats.customerSavings), icon: PiggyBank },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-primary/10 p-2">
                <tile.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tile.label}</p>
                <p className="text-lg font-semibold">{tile.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(row) => row.affiliateId}
        filterableColumns={AFFILIATE_FILTERS}
        enableRowSelection={false}
        emptyMessage="No affiliates match these filters."
        serverSide={{
          rowCount: totalCount,
          defaultSort: AFFILIATES_DEFAULT_SORT,
          searchPlaceholder: "Search by name, email, or affiliate code…",
        }}
      />
    </div>
  );
}
