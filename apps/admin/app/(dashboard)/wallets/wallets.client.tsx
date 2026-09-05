"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

import {
  PayoutRequestRowView,
  TopUpRequestRowView,
  WalletRowView,
  WalletStatsCards,
} from "./wallets.chunks";
import {
  PAYOUT_STATUS_OPTIONS,
  TOP_UP_STATUS_OPTIONS,
  WALLET_STATUS_OPTIONS,
} from "./wallets.lib";
import {
  getPayoutRequests,
  getTopUpRequests,
  getWallets,
  getWalletStats,
} from "./wallets.server";
import { WalletsTableSkeleton } from "./wallets.skeleton";
import type {
  PayoutRequestFilters,
  PayoutRequestRow,
  TopUpRequestFilters,
  TopUpRequestRow,
  WalletFilters,
  WalletRow,
  WalletStats,
} from "./wallets.types";

const ALL = "all";

export function WalletsClientWrapper({
  initialStats,
  initialPayoutRequests,
  initialTopUpRequests,
  initialWallets,
  initialTab,
}: {
  initialStats: WalletStats;
  initialPayoutRequests: PayoutRequestRow[];
  initialTopUpRequests: TopUpRequestRow[];
  initialWallets: WalletRow[];
  initialTab: string;
}) {
  const [stats, setStats] = useState(initialStats);
  const [payoutRequests, setPayoutRequests] = useState(initialPayoutRequests);
  const [topUpRequests, setTopUpRequests] = useState(initialTopUpRequests);
  const [wallets, setWallets] = useState(initialWallets);

  const [payoutFilters, setPayoutFilters] = useState<PayoutRequestFilters>({});
  const [topUpFilters, setTopUpFilters] = useState<TopUpRequestFilters>({});
  const [walletFilters, setWalletFilters] = useState<WalletFilters>({});

  const [isLoadingPayouts, startLoadingPayouts] = useTransition();
  const [isLoadingTopUps, startLoadingTopUps] = useTransition();
  const [isLoadingWallets, startLoadingWallets] = useTransition();

  const refreshPayouts = useCallback(
    (filters: PayoutRequestFilters) => {
      startLoadingPayouts(async () => {
        const [requests, nextStats] = await Promise.all([
          getPayoutRequests(filters),
          getWalletStats(),
        ]);

        if (!requests.success) {
          toast.error(requests.error);
          return;
        }
        setPayoutRequests(requests.data);
        if (nextStats.success) setStats(nextStats.data);
      });
    },
    []
  );

  const refreshTopUps = useCallback((filters: TopUpRequestFilters) => {
    startLoadingTopUps(async () => {
      const [requests, nextStats] = await Promise.all([
        getTopUpRequests(filters),
        getWalletStats(),
      ]);

      if (!requests.success) {
        toast.error(requests.error);
        return;
      }
      setTopUpRequests(requests.data);
      if (nextStats.success) setStats(nextStats.data);
    });
  }, []);

  const refreshWallets = useCallback((filters: WalletFilters) => {
    startLoadingWallets(async () => {
      const result = await getWallets(filters);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setWallets(result.data);
    });
  }, []);

  // Skip the empty-filter mount run so SSR data is kept. Refetch on any
  // later filter change (including clearing back to empty).
  const isFirstPayoutFiltersEffect = useRef(true);
  const isFirstTopUpFiltersEffect = useRef(true);
  const isFirstWalletFiltersEffect = useRef(true);

  useEffect(() => {
    if (isFirstPayoutFiltersEffect.current) {
      isFirstPayoutFiltersEffect.current = false;
      return;
    }

    const timer = setTimeout(() => refreshPayouts(payoutFilters), 300);
    return () => clearTimeout(timer);
  }, [payoutFilters, refreshPayouts]);

  useEffect(() => {
    if (isFirstTopUpFiltersEffect.current) {
      isFirstTopUpFiltersEffect.current = false;
      return;
    }

    const timer = setTimeout(() => refreshTopUps(topUpFilters), 300);
    return () => clearTimeout(timer);
  }, [topUpFilters, refreshTopUps]);

  useEffect(() => {
    if (isFirstWalletFiltersEffect.current) {
      isFirstWalletFiltersEffect.current = false;
      return;
    }

    const timer = setTimeout(() => refreshWallets(walletFilters), 300);
    return () => clearTimeout(timer);
  }, [walletFilters, refreshWallets]);

  const topUpsTabLabel =
    stats.pendingTopUps > 0
      ? `Top-ups (${stats.pendingTopUps})`
      : "Top-ups";

  return (
    <div className="space-y-6">
      <WalletStatsCards stats={stats} />

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="payouts">Payout requests</TabsTrigger>
          <TabsTrigger value="topups">{topUpsTabLabel}</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-64 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                className="pl-10"
                value={payoutFilters.search ?? ""}
                onChange={(event) =>
                  setPayoutFilters((current) => ({
                    ...current,
                    search: event.target.value || undefined,
                  }))
                }
              />
            </div>
            <Select
              value={payoutFilters.status ?? ALL}
              onValueChange={(value) =>
                setPayoutFilters((current) => ({
                  ...current,
                  status:
                    value === ALL
                      ? undefined
                      : (value as PayoutRequestFilters["status"]),
                }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {PAYOUT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingPayouts ? (
            <WalletsTableSkeleton />
          ) : payoutRequests.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No payout requests match these filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutRequests.map((request) => (
                  <PayoutRequestRowView
                    key={request.id}
                    request={request}
                    onChanged={() => refreshPayouts(payoutFilters)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="topups" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-64 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                className="pl-10"
                value={topUpFilters.search ?? ""}
                onChange={(event) =>
                  setTopUpFilters((current) => ({
                    ...current,
                    search: event.target.value || undefined,
                  }))
                }
              />
            </div>
            <Select
              value={topUpFilters.status ?? ALL}
              onValueChange={(value) =>
                setTopUpFilters((current) => ({
                  ...current,
                  status:
                    value === ALL
                      ? undefined
                      : (value as TopUpRequestFilters["status"]),
                }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {TOP_UP_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingTopUps ? (
            <WalletsTableSkeleton />
          ) : topUpRequests.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No top-up requests match these filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUpRequests.map((request) => (
                  <TopUpRequestRowView
                    key={request.id}
                    request={request}
                    onChanged={() => refreshTopUps(topUpFilters)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="wallets" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-64 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                className="pl-10"
                value={walletFilters.search ?? ""}
                onChange={(event) =>
                  setWalletFilters((current) => ({
                    ...current,
                    search: event.target.value || undefined,
                  }))
                }
              />
            </div>
            <Select
              value={walletFilters.status ?? ALL}
              onValueChange={(value) =>
                setWalletFilters((current) => ({
                  ...current,
                  status:
                    value === ALL
                      ? undefined
                      : (value as WalletFilters["status"]),
                }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {WALLET_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingWallets ? (
            <WalletsTableSkeleton />
          ) : wallets.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No wallets match these filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet) => (
                  <WalletRowView key={wallet.id} wallet={wallet} />
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
