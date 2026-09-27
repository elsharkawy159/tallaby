"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { MoreVertical, PlusIcon, Star } from "lucide-react";
import { deleteProduct } from "@/actions/products";
import { getStorefrontProductUrl } from "@/lib/constants";
import { TableSection } from "@workspace/ui/components/table-section";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  reconcileColumnOrder,
  useProductColumnsStore,
} from "@/stores/product-columns.store";
import { ImportExportButton } from "./import-export-button.client";
import { ManageColumnsDialog } from "./manage-columns-dialog.client";
import { ProductImageUpload } from "./product-image-upload";
import { ProductStatusCell } from "./product-publish-toggle.client";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatNumber } from "@/lib/i18n/format";
import { useTableSectionLabels } from "@/lib/i18n/table-labels";

export type VendorProduct = {
  id: string;
  title: string;
  slug?: string | null;
  sku?: string | null;
  description?: string | null;
  images?: string[] | null;
  status: "draft" | "pending" | "active" | "rejected";
  condition?: string | null;
  isFeatured?: boolean | null;
  quantity?: number | null;
  basePrice?: string | number | null;
  salePrice?: string | number | null;
  brand?: { name: string } | null;
  category?: { name: string | null } | null;
  averageRating?: number | null;
  reviewCount?: number | null;
};

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
            className="text-sm font-medium text-gray-900 truncate max-w-[240px] cursor-pointer hover:text-blue-600 transition-colors"
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

export function VendorProductsSection({
  products,
}: {
  products: VendorProduct[];
  total?: number;
}) {
  const { visibility, order, setVisibility, setOrder } =
    useProductColumnsStore();
  const t = useTranslations("products.list");
  const locale = useLocale();
  const tableLabels = useTableSectionLabels();
  const formatCurrency = (amount?: string | number | null) =>
    formatMoney(amount, locale);

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
            <div className="text-xs text-gray-500">
              {t("sku")}: <span dir="ltr">{row.original.sku || t("notAvailable")}</span>
            </div>
          </div>
        ),
        size: 280,
      },
      {
        id: "category",
        header: t("columns.category"),
        meta: { label: t("columns.category") },
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.category?.name || "-"}
          </span>
        ),
        size: 140,
      },
      {
        id: "brand",
        header: t("columns.brand"),
        meta: { label: t("columns.brand") },
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.brand?.name || "-"}
          </span>
        ),
        size: 120,
      },
      {
        id: "price",
        header: t("columns.price"),
        meta: { label: t("columns.price") },
        cell: ({ row }) => {
          const base = row.original.basePrice;
          const sale = row.original.salePrice;
          const isOnSale = sale != null && String(sale) !== String(base);
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(sale ?? base)}
              </span>
              {isOnSale && (
                <span className="text-xs text-gray-500 line-through">
                  {formatCurrency(base)}
                </span>
              )}
              {isOnSale && (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  {t("sale")}
                </Badge>
              )}
            </div>
          );
        },
        size: 140,
      },
      {
        id: "rating",
        header: t("columns.rating"),
        meta: { label: t("columns.rating") },
        cell: ({ row }) => {
          const rating = row.original.averageRating ?? 0;
          const count = row.original.reviewCount ?? 0;
          return (
            <div className="flex items-center gap-1 text-sm">
              <Star
                className={`h-4 w-4 ${rating > 0 ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
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
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {formatNumber(row.original.quantity ?? 0, locale)}
          </span>
        ),
        size: 80,
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex h-8 w-8 p-0"
                aria-label={t("openRowActions")}
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {row.original.slug && (
                <DropdownMenuItem asChild>
                  <a
                    href={getStorefrontProductUrl(row.original.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full block"
                    tabIndex={0}
                  >
                    {t("view")}
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link
                  href={`/products/${row.original.id}/edit`}
                  className="w-full h-full block"
                  tabIndex={0}
                >
                  {t("edit")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  // Example: delete action
                  // alert(`Delete ${row.original.id}`);
                }}
              >
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 30,
        enableHiding: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale]
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
      hideViewOptions
      buttons={(table) => (
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <ManageColumnsDialog table={table} />
          <ImportExportButton table={table} />
          <Button asChild variant="outline">
            <Link href="/products/add">
              <PlusIcon
                className="-ms-1 opacity-60"
                size={16}
                aria-hidden="true"
              />
              {t("addNew")}
            </Link>
          </Button>
        </div>
      )}
      onDeleteSelected={async (ids) => {
        await Promise.all(ids.map((id) => deleteProduct(id)));
      }}
      searchColumnId="title"
      labels={tableLabels}
    />
  );
}
