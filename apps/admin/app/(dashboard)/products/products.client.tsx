"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { CheckCheck, Plus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import {
  approveAllPendingProducts,
  updateProductStatus,
} from "@/actions/products";
import {
  getProductsColumns,
  getProductsFilters,
} from "./_components/table-columns";
import { DataTable } from "../_components/data-table/data-table";
import { useTableUrlState } from "../_components/data-table/use-table-url-state";
import { PRODUCTS_DEFAULT_SORT } from "./products.params";
import type {
  AdminProductListItem,
  ProductFilterOptions,
  ProductStatus,
} from "./products.types";

interface ProductsClientProps {
  products: AdminProductListItem[];
  totalCount: number;
  pendingCount: number;
  filterOptions: ProductFilterOptions;
}

export function ProductsClient({
  products,
  totalCount,
  pendingCount,
  filterOptions,
}: ProductsClientProps) {
  const router = useRouter();
  const url = useTableUrlState();
  const [isRefreshing, startRefresh] = useTransition();
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    startRefresh(() => router.refresh());
  }, [router]);

  const handleStatusChange = useCallback(
    async (productId: string, status: ProductStatus) => {
      setUpdatingIds((prev) => new Set(prev).add(productId));

      try {
        const result = await updateProductStatus(productId, status);

        if (result.success) {
          toast.success(
            status === "active"
              ? "Product approved"
              : status === "rejected"
                ? "Product rejected"
                : "Product status updated"
          );
          // Re-fetch the current page; URL (page, filters) is untouched.
          refresh();
          return;
        }

        toast.error(result.error || "Failed to update product status");
      } catch (error) {
        console.error("Error updating product status:", error);
        toast.error("Failed to update product status");
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    [refresh]
  );

  const handleApproveAll = useCallback(async () => {
    if (pendingCount === 0) {
      toast.info("No pending products to approve");
      return;
    }

    const confirmed = window.confirm(
      `Approve all ${pendingCount} pending product${pendingCount === 1 ? "" : "s"}?`
    );
    if (!confirmed) return;

    setIsApprovingAll(true);

    try {
      const result = await approveAllPendingProducts();

      if (result.success && result.data) {
        if (result.data.count === 0) {
          toast.info("No pending products to approve");
          return;
        }
        toast.success(
          `Approved ${result.data.count} product${result.data.count === 1 ? "" : "s"}`
        );
        refresh();
        return;
      }

      toast.error(result.error || "Failed to approve pending products");
    } catch (error) {
      console.error("Error approving all pending products:", error);
      toast.error("Failed to approve pending products");
    } finally {
      setIsApprovingAll(false);
    }
  }, [pendingCount, refresh]);

  const columns = useMemo(
    () =>
      getProductsColumns({
        onStatusChange: handleStatusChange,
        isStatusUpdating: (productId) => updatingIds.has(productId),
      }),
    [handleStatusChange, updatingIds]
  );

  const filters = useMemo(
    () => getProductsFilters(filterOptions),
    [filterOptions]
  );

  // A single ?seller= (id or slug, e.g. from the sellers page) gets a banner.
  const sellerParam = url.getList("seller");
  const singleSeller =
    sellerParam.length === 1
      ? filterOptions.sellers.find(
          (seller) =>
            seller.value === sellerParam[0] || seller.slug === sellerParam[0]
        )
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {singleSeller ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Seller:</span>
            <span className="font-medium">{singleSeller.label}</span>
            <span className="text-muted-foreground">
              ({totalCount.toLocaleString()} product
              {totalCount === 1 ? "" : "s"})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => url.setParams({ seller: null })}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => url.setParams({ status: ["pending"] })}
            disabled={pendingCount === 0}
          >
            Review pending
            {pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleApproveAll}
            disabled={isApprovingAll || pendingCount === 0}
            className="text-green-700 border-green-200 hover:bg-green-50"
          >
            {isApprovingAll ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            Approve All
            {pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link href="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        getRowId={(product) => product.id}
        filterableColumns={filters}
        emptyMessage="No products match these filters."
        isLoading={isRefreshing}
        serverSide={{
          rowCount: totalCount,
          defaultSort: PRODUCTS_DEFAULT_SORT,
          searchPlaceholder: "Search title, SKU or product ID…",
        }}
      />
    </div>
  );
}
