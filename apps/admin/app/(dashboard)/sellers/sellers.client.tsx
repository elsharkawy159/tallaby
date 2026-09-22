"use client";

import { useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { updateSellerStatus } from "./sellers.server";
import { SellerStatsCards } from "./sellers.chunks";
import type { Seller, SellerStats, SellerStatus } from "./sellers.types";
import { DataTable } from "../_components/data-table/data-table";
import { useTableUrlState } from "../_components/data-table/use-table-url-state";
import { getSellersColumns, sellersFilters } from "./_components/table-columns";
import { SELLERS_DEFAULT_SORT } from "./sellers.params";

const TAB_STATUSES = ["approved", "pending", "suspended"] as const;

const ACTION_STATUS: Record<string, SellerStatus> = {
  approve: "approved",
  suspend: "suspended",
  reactivate: "approved",
};

export const SellersHeader = () => {
  return (
    <div className="flex items-center justify-end mb-6">
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Seller
        </Button>
      </div>
    </div>
  );
};

interface SellersClientWrapperProps {
  sellers: Seller[];
  totalCount: number;
  stats: SellerStats;
}

export const SellersClientWrapper = ({
  sellers,
  totalCount,
  stats,
}: SellersClientWrapperProps) => {
  const router = useRouter();
  const url = useTableUrlState();
  const [isUpdating, startTransition] = useTransition();

  // Tabs are presets over the `status` filter; a custom mix highlights none.
  const statusParam = url.getList("status");
  const activeTab =
    statusParam.length === 0
      ? "all"
      : statusParam.length === 1 &&
          (TAB_STATUSES as readonly string[]).includes(statusParam[0]!)
        ? statusParam[0]!
        : "";

  const handleAction = useCallback(
    (sellerId: string, action: string) => {
      const status = ACTION_STATUS[action];
      if (!status) {
        toast.error("Invalid action");
        return;
      }
      startTransition(async () => {
        try {
          const result = await updateSellerStatus(sellerId, status);
          if (result.success) {
            toast.success(result.message);
            router.refresh();
          } else {
            toast.error(result.error || "Failed to update seller status");
          }
        } catch (error) {
          console.error("Error updating seller status:", error);
          toast.error("Something went wrong");
        }
      });
    },
    [router]
  );

  const columns = useMemo(() => getSellersColumns(handleAction), [handleAction]);

  return (
    <div className="space-y-6">
      <SellersHeader />

      <SellerStatsCards stats={stats} />

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          url.setParams({ status: value === "all" ? null : [value] })
        }
      >
        <TabsList>
          <TabsTrigger value="all">All Sellers ({stats.totalSellers})</TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({stats.activeSellers})
          </TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pendingSellers})</TabsTrigger>
          <TabsTrigger value="suspended">
            Suspended ({stats.suspendedSellers})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={sellers}
        getRowId={(seller) => seller.id}
        filterableColumns={sellersFilters}
        enableRowSelection={false}
        emptyMessage="No sellers match these filters."
        isLoading={isUpdating}
        serverSide={{
          rowCount: totalCount,
          defaultSort: SELLERS_DEFAULT_SORT,
          searchPlaceholder: "Search name, slug, email or phone…",
        }}
      />
    </div>
  );
};
