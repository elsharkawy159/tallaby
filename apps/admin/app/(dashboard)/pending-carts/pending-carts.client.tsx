"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { TableSection } from "@workspace/ui/components/table-section";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  getPendingCartById,
  getPendingCarts,
} from "@/actions/pending-carts";
import { toast } from "sonner";
import type { PendingCart, PendingCartsTab } from "./pending-carts.types";
import { PendingCartsHeader } from "./pending-carts.chunks";
import { getPendingCartsColumns } from "./_components/table-columns";
import { CartQuickViewDialog } from "./_components/cart-quick-view-dialog";

export function PendingCartsClientWrapper({
  initialCarts = [],
}: {
  initialCarts?: PendingCart[];
}) {
  const [carts, setCarts] = useState<PendingCart[]>(initialCarts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<PendingCartsTab>("all");
  const [selectedCart, setSelectedCart] = useState<PendingCart | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadCarts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const result = await getPendingCarts({ limit: 200 });

      if (result.success) {
        setCarts((result.data || []) as PendingCart[]);
      } else {
        toast.error(result.error || "Failed to load pending carts");
      }
    } catch {
      toast.error("Failed to load pending carts");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadCarts();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadCarts]);

  const handleRefresh = () => {
    loadCarts();
  };

  const handleQuickView = async (cart: PendingCart) => {
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
  };

  const getFilteredCarts = () => {
    switch (activeTab) {
      case "with-items":
        return carts.filter((cart) => cart.itemCount > 0);
      case "abandoned":
        return carts.filter((cart) => cart.isAbandoned);
      default:
        return carts;
    }
  };

  const filteredCarts = getFilteredCarts();
  const columns = getPendingCartsColumns(handleQuickView);

  const actionButtons = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PendingCartsHeader
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as PendingCartsTab)}
      >
        <TabsList>
          <TabsTrigger value="all">All ({carts.length})</TabsTrigger>
          <TabsTrigger value="with-items">
            With items ({carts.filter((c) => c.itemCount > 0).length})
          </TabsTrigger>
          <TabsTrigger value="abandoned">
            Abandoned ({carts.filter((c) => c.isAbandoned).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="p-0 mt-4">
          <TableSection
            rows={filteredCarts}
            columns={columns}
            buttons={actionButtons}
            searchColumnId="id"
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </TabsContent>
      </Tabs>

      <CartQuickViewDialog
        cart={selectedCart}
        open={!!selectedCart}
        isLoadingItems={isLoadingDetail}
        onOpenChange={() => setSelectedCart(null)}
      />
    </div>
  );
}
