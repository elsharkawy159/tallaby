"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { TableSection } from "@workspace/ui/components/table-section";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { restoreProductsAction, trashProductsAction } from "../trash/trash.server";
import {
  reconcileColumnOrder,
  useProductColumnsStore,
} from "@/stores/product-columns.store";
import { formatNumber } from "@/lib/i18n/format";
import { useTableSectionLabels } from "@/lib/i18n/table-labels";
import { ManageColumnsDialog } from "./manage-columns-dialog.client";
import {
  DiscountBadge,
  ProductActionsMenu,
  ProductPrice,
  StockBadge,
} from "./product-card.client";
import { ProductImageUpload } from "./product-image-upload";
import { ProductStatusCell } from "./product-publish-toggle.client";
import { ProductViewsCell, useProductViewsColumnLabel } from "./product-views.client";
import { discountPercent } from "./products-view.lib";
import type { VendorProduct } from "./vendor-products.section";

const CopyableTitle = ({ title }: { title: string }) => {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("products.list");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="text-sm font-semibold text-foreground truncate max-w-[300px] cursor-pointer hover:text-primary-ink transition-colors"
            onClick={handleCopy}
          >
            {title}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? t("copied") : t("copy")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** Table view of the products page. Rows arrive already filtered and sorted. */
export function VendorProductsTable({
  products,
  onDelete,
  selectedIds,
  onSelectedIdsChange,
}: {
  products: VendorProduct[];
  onDelete: (product: VendorProduct) => void;
  /** Selection owned by the products section (bulk edit, F-24b). */
  selectedIds?: Set<string>;
  onSelectedIdsChange?: (ids: Set<string>) => void;
}) {
  const { visibility, order, setVisibility, setOrder } =
    useProductColumnsStore();
  const t = useTranslations("products.list");
  const locale = useLocale();
  const viewsLabel = useProductViewsColumnLabel();
  const tableLabels = useTableSectionLabels();
  const router = useRouter();

  // The store persists with `skipHydration`, so read localStorage only after
  // mount — otherwise the first client render would disagree with the server.
  useEffect(() => {
    void useProductColumnsStore.persist.rehydrate();
  }, []);

  // Memoized: TanStack rebuilds column state on every new array identity, and
  // the table now carries a columnOrder.
  const columns = useMemo<ColumnDef<VendorProduct, any>[]>(
    () => [
      {
        id: "image",
        header: "",
        meta: { label: t("columns.image") },
        cell: ({ row }) => (
          <ProductImageUpload
            productId={row.original.id}
            images={row.original.images || []}
            productTitle={row.original.title}
          />
        ),
        size: 80,
      },
      {
        id: "title",
        accessorKey: "title",
        header: t("columns.title"),
        meta: { label: t("columns.title") },
        cell: ({ row }) => (
          <div className="min-w-0">
            <CopyableTitle title={row.original.title} />
            <div className="text-[11px] text-faint">
              {t("sku")}: <span dir="ltr">{row.original.sku || t("notAvailable")}</span>
            </div>
          </div>
        ),
        size: 280,
      },
      {
        id: "category",
        header: t("columns.category"),
        meta: { label: t("columns.category"), hideOnMobile: true },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.category?.name || "-"}
          </span>
        ),
        size: 140,
      },
      {
        id: "brand",
        header: t("columns.brand"),
        meta: { label: t("columns.brand"), hideOnMobile: true },
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.brand?.name || "-"}
          </span>
        ),
        size: 120,
      },
      {
        id: "price",
        header: t("columns.price"),
        meta: { label: t("columns.price") },
        cell: ({ row }) => <ProductPrice product={row.original} />,
        size: 140,
      },
      {
        id: "discount",
        header: t("discount"),
        meta: { label: t("discount") },
        cell: ({ row }) => {
          const percent = discountPercent(row.original);
          return percent > 0 ? (
            <DiscountBadge percent={percent} />
          ) : (
            <span className="text-faint">—</span>
          );
        },
        size: 80,
      },
      {
        id: "rating",
        header: t("columns.rating"),
        meta: { label: t("columns.rating"), hideOnMobile: true },
        cell: ({ row }) => {
          const rating = row.original.averageRating ?? 0;
          const count = row.original.reviewCount ?? 0;
          return (
            <div className="flex items-center gap-1 text-sm">
              <Star
                className={`h-4 w-4 ${rating > 0 ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/40"}`}
              />
              <span>
                {rating > 0
                  ? formatNumber(rating, locale, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })
                  : "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                ({formatNumber(count, locale)})
              </span>
            </div>
          );
        },
        size: 100,
      },
      {
        id: "quantity",
        accessorKey: "quantity",
        header: t("columns.stock"),
        meta: { label: t("columns.stock") },
        cell: ({ row }) => <StockBadge quantity={row.original.quantity} />,
        size: 110,
      },
      {
        // Store product page views and views → orders (F-15b); "—" without GA4.
        id: "views",
        header: viewsLabel,
        meta: { label: viewsLabel, hideOnMobile: true },
        cell: ({ row }) => <ProductViewsCell productId={row.original.id} />,
        size: 110,
      },
      {
        id: "status",
        accessorKey: "status",
        header: t("columns.status"),
        meta: { label: t("columns.status") },
        cell: ({ row }) => (
          <ProductStatusCell
            productId={row.original.id}
            status={row.original.status}
          />
        ),
        size: 140,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("columns.actions")}</span>,
        meta: { label: t("columns.actions") },
        cell: ({ row }) => (
          <ProductActionsMenu product={row.original} onDelete={onDelete} />
        ),
        size: 30,
        enableHiding: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale, viewsLabel]
  );

  const columnOrder = useMemo(
    () =>
      reconcileColumnOrder(
        order,
        columns.map((column) => (column as { id?: string }).id ?? "")
      ),
    [order, columns]
  );

  return (
    <TableSection<VendorProduct>
      rows={products}
      columns={columns}
      columnVisibility={visibility}
      onColumnVisibilityChange={setVisibility}
      columnOrder={columnOrder}
      onColumnOrderChange={setOrder}
      {...(selectedIds && onSelectedIdsChange
        ? {
            rowSelection: Object.fromEntries([...selectedIds].map((id) => [id, true])),
            onRowSelectionChange: (selection: Record<string, boolean>) =>
              onSelectedIdsChange(new Set(Object.keys(selection).filter((id) => selection[id]))),
          }
        : {})}
      hideViewOptions
      hideSearch
      buttons={(table) => <ManageColumnsDialog table={table} />}
      onDeleteSelected={async (ids) => {
        // Delete moves products to Trash (F-35); the toast offers Undo.
        const res = await trashProductsAction(ids);
        const done = res.success ? res.count : 0;
        if (ids.length - done > 0) toast.error(t("bulkDeleteFailed", { count: ids.length - done }));
        if (res.success && done > 0) {
          toast.success(t("bulkDeleted", { count: done }), {
            action: {
              label: t("undo"),
              onClick: async () => {
                const undone = await restoreProductsAction(res.ids);
                if (undone.success) toast.success(t("restored", { count: undone.count }));
                else toast.error(t("restoreFailed"));
                router.refresh();
              },
            },
          });
        }
        router.refresh();
      }}
      labels={{
        ...tableLabels,
        confirmDescription: () => t("deleteDescription"),
      }}
    />
  );
}
