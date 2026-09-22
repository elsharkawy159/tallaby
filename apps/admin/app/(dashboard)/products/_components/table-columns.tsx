"use client";

import Image from "next/image";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Package,
  Star,
  SquareArrowOutUpRight,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { DataTableColumnHeader } from "@/app/(dashboard)/_components/data-table/data-table-column-header";
import type { DataTableFilter } from "@/app/(dashboard)/_components/data-table/data-table.types";
import { getPublicUrl } from "@/lib/utils";
import {
  LOW_STOCK_THRESHOLD,
  canApproveProduct,
  canRejectProduct,
  formatProductPrice,
  getStorefrontProductUrl,
  parseProductPrice,
} from "../products.lib";
import type {
  AdminProductListItem,
  ProductFilterOptions,
  ProductStatus,
} from "../products.types";

interface ProductsColumnsOptions {
  onStatusChange?: (
    productId: string,
    status: ProductStatus
  ) => void | Promise<void>;
  isStatusUpdating?: (productId: string) => boolean;
}

const STATUS_STYLES: Record<ProductStatus, string> = {
  draft: "bg-gray-600",
  pending: "bg-amber-600",
  active: "bg-green-700",
  rejected: "bg-red-600",
};

const FLAG_LABELS = [
  ["isFeatured", "Featured"],
  ["isTrending", "Trending"],
  ["isSeasonal", "Seasonal"],
  ["isPlatformChoice", "Platform choice"],
  ["isMostSelling", "Most selling"],
  ["freeDelivery", "Free delivery"],
] as const;

/** Server-side filters (URL params) for the products table. */
export function getProductsFilters(
  options: ProductFilterOptions
): DataTableFilter[] {
  return [
    {
      id: "status",
      title: "Status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Active", value: "active" },
        { label: "Rejected", value: "rejected" },
        { label: "Draft", value: "draft" },
      ],
    },
    { id: "categoryId", title: "Category", options: options.categories },
    { id: "brandId", title: "Brand", options: options.brands },
    { id: "seller", title: "Seller", options: options.sellers },
    {
      id: "stock",
      title: "Stock",
      options: [
        { label: `In stock (≥ ${LOW_STOCK_THRESHOLD})`, value: "in-stock" },
        { label: `Low stock (< ${LOW_STOCK_THRESHOLD})`, value: "low-stock" },
        { label: "Out of stock", value: "out-of-stock" },
      ],
    },
    {
      id: "flags",
      title: "Highlights",
      options: [
        { label: "Featured", value: "featured" },
        { label: "Trending", value: "trending" },
        { label: "Seasonal", value: "seasonal" },
        { label: "Platform choice", value: "platform-choice" },
        { label: "Most selling", value: "most-selling" },
        { label: "Free delivery", value: "free-delivery" },
      ],
    },
    { id: "created", title: "Created", type: "dateRange" },
  ];
}

function resolveImage(image: string | null): string | null {
  if (!image) return null;
  return /^https?:\/\//.test(image) ? image : getPublicUrl(image, "products");
}

export function getProductsColumns(
  options?: ProductsColumnsOptions
): ColumnDef<AdminProductListItem>[] {
  const { onStatusChange, isStatusUpdating } = options ?? {};
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      enableHiding: false,
      meta: { label: "Product" },
      cell: ({ row }) => {
        const product = row.original;
        const image = resolveImage(product.image);
        const flags = FLAG_LABELS.filter(([key]) => product[key]);
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
              {image ? (
                <Image
                  src={image}
                  alt={product.title}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <Link
                href={`/products/${product.id}`}
                className="max-w-60 truncate font-medium hover:underline"
                title={product.title}
              >
                {product.title}
              </Link>
              <span
                className="max-w-60 truncate font-mono text-xs text-muted-foreground"
                title={product.sku ?? undefined}
              >
                {product.sku || "No SKU"}
              </span>
              {flags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {flags.map(([key, label]) => (
                    <Badge
                      key={key}
                      variant="outline"
                      className="px-1.5 py-0 text-[10px] font-normal"
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      meta: { label: "Price" },
      cell: ({ row }) => {
        const { final, list } = parseProductPrice(row.original.price);
        return (
          <div className="whitespace-nowrap">
            <div className="font-medium">{formatProductPrice(final)}</div>
            {list && list > final && (
              <div className="text-xs text-muted-foreground line-through">
                {formatProductPrice(list)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "brand",
      accessorFn: (product) => product.brand?.name ?? "",
      header: "Brand",
      enableSorting: false,
      meta: { label: "Brand" },
      cell: ({ row }) => (
        <div className="max-w-32 truncate" title={row.original.brand?.name}>
          {row.original.brand?.name || "—"}
        </div>
      ),
    },
    {
      id: "seller",
      accessorFn: (product) =>
        product.seller?.businessName || product.seller?.displayName || "",
      header: "Seller",
      enableSorting: false,
      meta: { label: "Seller" },
      cell: ({ row }) => {
        const seller = row.original.seller;
        if (!seller) return <div>—</div>;
        const name = seller.businessName || seller.displayName || "—";
        return (
          <Link
            href={`/sellers/${seller.id}`}
            className="max-w-40 truncate block hover:underline"
            title={name}
          >
            {name}
          </Link>
        );
      },
    },
    {
      id: "category",
      accessorFn: (product) => product.category?.name ?? "",
      header: "Category",
      enableSorting: false,
      meta: { label: "Category" },
      cell: ({ row }) => {
        const name = row.original.category?.name || "—";
        return (
          <div className="max-w-40 truncate" title={name}>
            {name}
          </div>
        );
      },
    },
    {
      accessorKey: "averageRating",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rating" />
      ),
      meta: { label: "Rating" },
      cell: ({ row }) => {
        const rating = row.original.averageRating;
        const reviewCount = row.original.reviewCount || 0;

        if (!rating) {
          return <div className="text-muted-foreground text-sm">—</div>;
        }

        return (
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-muted-foreground text-xs ml-1">
              ({reviewCount})
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Inventory" />
      ),
      meta: { label: "Inventory" },
      cell: ({ row }) => {
        const inventory = row.original.quantity;
        const color =
          inventory <= 0
            ? "text-red-600"
            : inventory < LOW_STOCK_THRESHOLD
              ? "text-amber-600"
              : "text-green-600";
        return <div className={`font-medium ${color}`}>{inventory}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: false,
      meta: { label: "Status" },
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={`capitalize ${STATUS_STYLES[status] ?? "bg-gray-600"}`}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      meta: { label: "Created" },
      cell: ({ row }) => {
        const value = row.original.createdAt;
        if (!value) return <div>—</div>;
        return (
          <div className="whitespace-nowrap">
            {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
              new Date(value)
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;
        const storefrontUrl = getStorefrontProductUrl(product.slug);
        const isUpdating = isStatusUpdating?.(product.id) ?? false;

        return (
          <div className="flex items-center gap-2">
            {canApproveProduct(product.status) && (
              <Button
                size="sm"
                onClick={() => onStatusChange?.(product.id, "active")}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
            )}
            {storefrontUrl ? (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View product on storefront"
                >
                  <SquareArrowOutUpRight className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled
                title="Product slug is missing"
              >
                <SquareArrowOutUpRight className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/products/${product.id}`} className="w-full">
                    View details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="w-full"
                  >
                    Edit product
                  </Link>
                </DropdownMenuItem>
                {canRejectProduct(product.status) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onStatusChange?.(product.id, "rejected")}
                      disabled={isUpdating}
                      className="text-red-600"
                    >
                      Reject product
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
