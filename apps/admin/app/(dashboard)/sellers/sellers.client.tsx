"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Download, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { updateSellerStatus } from "./sellers.server";
import { exportSellers } from "./sellers-export.server";
import { SELLER_EXPORT_SCOPE_OPTIONS, type SellerExportScope } from "./sellers-export.lib";
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

/** Saves a base64 .xlsx returned by a server action. */
function downloadWorkbook(base64: string, fileName: string) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

/** Export menu: the table filters and search apply, plus a website scope. */
const SellersExportMenu = () => {
  const searchParams = useSearchParams();
  const [exporting, setExporting] = useState(false);
  const hasFilters = [...searchParams.keys()].some(
    (key) => !["page", "pageSize", "sort"].includes(key)
  );

  const handleExport = async (scope: SellerExportScope) => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      const result = await exportSellers(params, scope);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      downloadWorkbook(result.base64, result.fileName);
      toast.success(
        `Exported ${result.sellerCount} sellers (${result.rowCount} rows). Open it in Google Sheets with File › Import.`
      );
    } catch (error) {
      console.error("Error exporting sellers:", error);
      toast.error("Failed to export sellers");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {hasFilters
            ? "Spreadsheet (.xlsx), with the table filters and search"
            : "Spreadsheet (.xlsx), one row per store"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SELLER_EXPORT_SCOPE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => void handleExport(option.value)}
            className="flex-col items-start gap-0"
          >
            <span>{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const SellersHeader = () => {
  return (
    <div className="flex items-center justify-end mb-6">
      <div className="flex gap-2">
        <SellersExportMenu />
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
          searchPlaceholder: "Search seller, store, email or phone…",
        }}
      />
    </div>
  );
};
