"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { MoreVertical, PlusIcon, Upload, ImageIcon } from "lucide-react";
import { getPublicUrl } from "@/lib/utils";
import { deleteProduct, updateProduct } from "@/actions/products";
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
import { UploadExcelButton } from "./upload-excel-button.client";
import { ProductImageUpload } from "./product-image-upload";

export type VendorProduct = {
  id: string;
  title: string;
  sku?: string | null;
  images?: string[] | null;
  isActive: boolean;
  isFeatured?: boolean | null;
  quantity?: number | null;
  basePrice?: string | number | null;
  salePrice?: string | number | null;
  brand?: { name: string } | null;
  category?: { name: string } | null;
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
  total,
}: {
  products: VendorProduct[];
  total: number;
}) {
  const columns: ColumnDef<VendorProduct>[] = [
    {
      id: "image",
      header: "",
      cell: ({ row }) => (
        <ProductImageUpload
          productId={row.original.id}
          images={row.original.images || []}
          productTitle={row.original.title}
        />
      ),
      size: 80,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Title",
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
      accessorKey: "quantity",
      header: "Stock",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {row.original.quantity ?? 0}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge className="bg-green-100 text-green-800">Active</Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            Inactive
          </Badge>
        ),
      size: 80,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
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
            <DropdownMenuItem asChild>
              <Link
                href={`/products/${row.original.id}`}
                className="w-full h-full block"
                tabIndex={0}
              >
                View
              </Link>
            </DropdownMenuItem>
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
  ];

  return (
    <TableSection
      rows={products}
      columns={columns}
      buttons={
        <div className="ml-auto flex items-center gap-2">
          <UploadExcelButton />
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
      }
      onDeleteSelected={async (ids) => {
        await Promise.all(ids.map((id) => deleteProduct(id)));
      }}
      searchColumnId="title"
    />
  );
}
