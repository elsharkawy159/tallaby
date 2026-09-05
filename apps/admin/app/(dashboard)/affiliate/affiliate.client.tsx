"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
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
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

import { getAffiliates, getAffiliateStats } from "@/actions/affiliates";
import { DataTable } from "../_components/data-table/data-table";
import { getAffiliateColumns } from "./_components/table-columns";
import {
  AFFILIATE_EARNINGS_OPTIONS,
  AFFILIATE_PERFORMANCE_OPTIONS,
  AFFILIATE_STATUS_OPTIONS,
  money,
} from "./affiliate.lib";
import type {
  AffiliateFilters,
  AffiliateListRow,
  AffiliateStats,
} from "./affiliate.types";

const ALL = "all";

export function AffiliateClientWrapper({
  initialStats,
  initialRows,
  initialTruncated,
}: {
  initialStats: AffiliateStats;
  initialRows: AffiliateListRow[];
  initialTruncated: boolean;
}) {
  const [stats, setStats] = useState(initialStats);
  const [rows, setRows] = useState(initialRows);
  const [truncated, setTruncated] = useState(initialTruncated);
  const [filters, setFilters] = useState<AffiliateFilters>({});
  const [isLoading, startLoading] = useTransition();

  const columns = getAffiliateColumns();

  const refresh = useCallback((nextFilters: AffiliateFilters) => {
    startLoading(async () => {
      const [listResult, statsResult] = await Promise.all([
        getAffiliates(nextFilters),
        getAffiliateStats(),
      ]);

      if (!listResult.success) {
        toast.error(listResult.error);
        return;
      }
      setRows(listResult.data.rows);
      setTruncated(listResult.data.truncated);
      if (statsResult.success) setStats(statsResult.data);
    });
  }, []);

  // Skip the empty-filter mount run so SSR data is kept.
  const isFirstEffect = useRef(true);
  useEffect(() => {
    if (isFirstEffect.current) {
      isFirstEffect.current = false;
      return;
    }
    const timer = setTimeout(() => refresh(filters), 300);
    return () => clearTimeout(timer);
  }, [filters, refresh]);

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

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or affiliate code…"
            className="pl-10"
            value={filters.search ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                search: event.target.value || undefined,
              }))
            }
          />
        </div>
        <Select
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setFilters((current) => ({
              ...current,
              status: value === ALL ? undefined : (value as AffiliateFilters["status"]),
            }))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {AFFILIATE_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.performance ?? ALL}
          onValueChange={(value) =>
            setFilters((current) => ({
              ...current,
              performance:
                value === ALL ? undefined : (value as AffiliateFilters["performance"]),
            }))
          }
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All performance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All performance</SelectItem>
            {AFFILIATE_PERFORMANCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.earnings ?? ALL}
          onValueChange={(value) =>
            setFilters((current) => ({
              ...current,
              earnings: value === ALL ? undefined : (value as AffiliateFilters["earnings"]),
            }))
          }
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All earnings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All earnings</SelectItem>
            {AFFILIATE_EARNINGS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {truncated && (
        <p className="text-xs text-muted-foreground">
          Showing the first {rows.length} matching affiliates. Narrow your
          search or filters to see a more specific set.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2 rounded-md border p-4">
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-64 animate-pulse rounded bg-muted" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No affiliates yet.
        </p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  );
}
