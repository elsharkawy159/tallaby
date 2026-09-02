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

const formatCurrency = (amount?: string | number | null) => {
  const value =
    amount == null
      ? 0
      : typeof amount === "string"
        ? parseFloat(amount)
        : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
  }).format(value);
};

const CopyableTitle = ({ title }: { title: string }) => {
  const [copied, setCopied] = useState(false);

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
          <p>{copied ? "Copied!" : "Copy"}</p>
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
        meta: { label: "Image" },
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
        header: "Title",
        meta: { label: "Title" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <CopyableTitle title={row.original.title} />
            <div className="text-xs text-gray-500">
              SKU: {row.original.sku || "N/A"}
            </div>
          </div>
        ),
        size: 280,
      },
      {
        id: "category",
        header: "Category",
        meta: { label: "Category" },
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.category?.name || "-"}
          </span>
        ),
        size: 140,
      },
      {
        id: "brand",
        header: "Brand",
        meta: { label: "Brand" },
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.brand?.name || "-"}
          </span>
        ),
        size: 120,
      },
      {
        id: "price",
        header: "Price",
        meta: { label: "Price" },
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
                  Sale
                </Badge>
              )}
            </div>
          );
        },
        size: 140,
      },
      {
        id: "rating",
        header: "Rating",
        meta: { label: "Rating" },
        cell: ({ row }) => {
          const rating = row.original.averageRating ?? 0;
          const count = row.original.reviewCount ?? 0;
          return (
            <div className="flex items-center gap-1 text-sm">
              <Star
                className={`h-4 w-4 ${rating > 0 ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
              />
              <span>{rating > 0 ? rating.toFixed(1) : "—"}</span>
              <span className="text-xs text-muted-foreground">({count})</span>
            </div>
          );
        },
        size: 100,
      },
      {
        id: "quantity",
        accessorKey: "quantity",
        header: "Stock",
        meta: { label: "Stock" },
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {row.original.quantity ?? 0}
          </span>
        ),
        size: 80,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        meta: { label: "Status" },
        cell: ({ row }) => {
          const status = row.original.status;
          const styles: Record<string, string> = {
            draft: "bg-gray-100 text-gray-800",
            pending: "bg-amber-100 text-amber-800",
            active: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
          };
          return (
            <Badge className={styles[status] ?? "bg-gray-100 text-gray-800"}>
              {status}
            </Badge>
          );
        },
        size: 80,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        meta: { label: "Actions" },
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex h-8 w-8 p-0"
                aria-label="Open row actions"
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
                    View
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link
                  href={`/products/${row.original.id}/edit`}
                  className="w-full h-full block"
                  tabIndex={0}
                >
                  Edit
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
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 30,
        enableHiding: false,
      },
    ],
    []
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
        <div className="ml-auto flex items-center gap-2">
          <ManageColumnsDialog table={table} />
          <ImportExportButton table={table} />
          <Button asChild variant="outline">
            <Link href="/products/add">
              <PlusIcon
                className="-ms-1 opacity-60"
                size={16}
                aria-hidden="true"
              />
              Add new product
            </Link>
          </Button>
        </div>
      )}
      onDeleteSelected={async (ids) => {
        await Promise.all(ids.map((id) => deleteProduct(id)));
      }}
      searchColumnId="title"
    />
  );
}
