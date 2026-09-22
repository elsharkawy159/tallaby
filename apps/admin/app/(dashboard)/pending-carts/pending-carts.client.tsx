"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { getPendingCartById } from "@/actions/pending-carts";
import { toast } from "sonner";
import { DataTable } from "../_components/data-table/data-table";
import { useTableUrlState } from "../_components/data-table/use-table-url-state";
import type {
  PendingCart,
  PendingCartStats,
  PendingCartsTab,
} from "./pending-carts.types";
import { PendingCartsHeader } from "./pending-carts.chunks";
import {
  getPendingCartsColumns,
  pendingCartsFilters,
} from "./_components/table-columns";
import { CartQuickViewDialog } from "./_components/cart-quick-view-dialog";
import {
  PENDING_CARTS_DEFAULT_SORT,
  PENDING_CARTS_VIEW_PARAM,
} from "./pending-carts.params";

const AUTO_REFRESH_MS = 10 * 60 * 1000;

export function PendingCartsClientWrapper({
  carts,
  totalCount,
  stats,
}: {
  carts: PendingCart[];
  totalCount: number;
  stats: PendingCartStats | null;
}) {
  const router = useRouter();
  const url = useTableUrlState();
  const [isRefreshing, startRefresh] = useTransition();
  const [selectedCart, setSelectedCart] = useState<PendingCart | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const activeTab = (url.get(PENDING_CARTS_VIEW_PARAM) ||
    "all") as PendingCartsTab;

  const refresh = useCallback(() => {
    startRefresh(() => router.refresh());
  }, [router]);

  useEffect(() => {
    const interval = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleQuickView = useCallback(async (cart: PendingCart) => {
    setSelectedCart(cart);
    setIsLoadingDetail(true);

    try {
      const result = await getPendingCartById(cart.id);
      if (result.success && result.data) {
        setSelectedCart(result.data as PendingCart);
      } else {
        toast.error(result.error || "Failed to load cart details");
      }
    } catch {
      toast.error("Failed to load cart details");
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const handleReminded = useCallback(
    (cartId: string, reminderSentAt: string | null) => {
      setSelectedCart((current) =>
        current?.id === cartId
          ? { ...current, reminderSentAt: reminderSentAt ?? current.reminderSentAt ?? new Date().toISOString() }
          : current
      );
      refresh();
    },
    [refresh]
  );

  const columns = useMemo(
    () => getPendingCartsColumns(handleQuickView),
    [handleQuickView]
  );

  return (
    <div className="space-y-6">
      <PendingCartsHeader onRefresh={refresh} isRefreshing={isRefreshing} />

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          url.setParams({
            [PENDING_CARTS_VIEW_PARAM]: value === "all" ? null : value,
          })
        }
      >
        <TabsList>
          <TabsTrigger value="all">
            All{stats ? ` (${stats.activeCarts.toLocaleString()})` : ""}
          </TabsTrigger>
          <TabsTrigger value="with-items">
            With items{stats ? ` (${stats.withItems.toLocaleString()})` : ""}
          </TabsTrigger>
          <TabsTrigger value="abandoned">
            Abandoned{stats ? ` (${stats.abandoned.toLocaleString()})` : ""}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={carts}
        getRowId={(cart) => cart.id}
        filterableColumns={pendingCartsFilters}
        enableRowSelection={false}
        emptyMessage="No pending carts match these filters."
        isLoading={url.isPending}
        serverSide={{
          rowCount: totalCount,
          defaultSort: PENDING_CARTS_DEFAULT_SORT,
          searchPlaceholder: "Search name, email, phone or cart ID…",
        }}
      />

      <CartQuickViewDialog
        cart={selectedCart}
        open={!!selectedCart}
        isLoadingItems={isLoadingDetail}
        onOpenChange={() => setSelectedCart(null)}
        onReminded={handleReminded}
      />
    </div>
  );
}
