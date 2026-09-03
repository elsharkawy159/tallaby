"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
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
  WalletRowView,
  WalletStatsCards,
} from "./wallets.chunks";
import {
  PAYOUT_STATUS_OPTIONS,
  WALLET_STATUS_OPTIONS,
} from "./wallets.lib";
import { getPayoutRequests, getWallets, getWalletStats } from "./wallets.server";
import { WalletsTableSkeleton } from "./wallets.skeleton";
import type {
  PayoutRequestFilters,
  PayoutRequestRow,
  WalletFilters,
  WalletRow,
  WalletStats,
} from "./wallets.types";

const ALL = "all";

export function WalletsClientWrapper({
  initialStats,
  initialPayoutRequests,
  initialWallets,
  initialTab,
}: {
  initialStats: WalletStats;
  initialPayoutRequests: PayoutRequestRow[];
  initialWallets: WalletRow[];
  initialTab: string;
}) {
  const [stats, setStats] = useState(initialStats);
  const [payoutRequests, setPayoutRequests] = useState(initialPayoutRequests);
  const [wallets, setWallets] = useState(initialWallets);

  const [payoutFilters, setPayoutFilters] = useState<PayoutRequestFilters>({});
  const [walletFilters, setWalletFilters] = useState<WalletFilters>({});

  const [isLoadingPayouts, startLoadingPayouts] = useTransition();
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

  // Debounced so typing in the search box does not fire a query per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => refreshPayouts(payoutFilters), 300);
    return () => clearTimeout(timer);
  }, [payoutFilters, refreshPayouts]);

  useEffect(() => {
    const timer = setTimeout(() => refreshWallets(walletFilters), 300);
    return () => clearTimeout(timer);
  }, [walletFilters, refreshWallets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wallets</h1>
        <p className="text-sm text-muted-foreground">
          User wallet balances, the transaction ledger and payout requests.
        </p>
      </div>

      <WalletStatsCards stats={stats} />

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="payouts">Payout requests</TabsTrigger>
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
