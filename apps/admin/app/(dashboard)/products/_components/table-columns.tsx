"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Star, SquareArrowOutUpRight } from "lucide-react";
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
import Link from "next/link";
import { DataTableColumnHeader } from "@/app/(dashboard)/_components/data-table/data-table-column-header";
import { formatProductPrice, getStorefrontProductUrl, parseProductPrice } from "../products.lib";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sku: string;
  status: "draft" | "pending" | "active" | "rejected";
  averageRating: number | null;
  reviewCount: number | null;
  quantity: string | number;
  price: any;
  createdAt: string;
  updatedAt: string;
  brand: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name: string;
  } | null;
  seller: {
    id: string;
    businessName: string | null;
    displayName: string | null;
  } | null;
}

export function getProductsColumns(): ColumnDef<Product>[] {
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
      accessorKey: "id",
      header: "ID",
      enableSorting: false,
      enableHiding: true,
      cell: ({ row }) => (
        <div className="text-xs text-gray-500 max-w-10 truncate">
          {row.getValue("id")}
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product Title" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <Link
              href={`/products/${row.original.id}`}
              className="font-medium hover:underline max-w-50 truncate"
              title={row.original.title}
            >
              {row.getValue("title")}
            </Link>
            <div
              className="text-xs text-gray-500 max-w-50 truncate"
              title={row.original.slug}
            >
              {row.original.slug}
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
      cell: ({ row }) => {
        const { final } = parseProductPrice(row.getValue("price"));
        return <div>{formatProductPrice(final)}</div>;
      },
    },
    {
      accessorKey: "brand",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Brand" />
      ),
      cell: ({ row }) => {
        const brand = row.original.brand;
        return <div>{brand?.name || "—"}</div>;
      },
      filterFn: (row, id, value) => {
        const brand = row.original.brand;
        return brand?.name === value;
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => {
        const category = row.original.category;
        return (
          <div className="max-w-40 truncate" title={category?.name || "—"}>
            {category?.name || "—"}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const category = row.original.category;
        return category?.name === value;
      },
    },
    {
      accessorKey: "averageRating",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rating" />
      ),
      cell: ({ row }) => {
        const rating = row.original.averageRating;
        const reviewCount = row.original.reviewCount || 0;

        if (!rating) {
          return <div className="text-gray-400 text-sm">-</div>;
        }

        return (
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-gray-500 text-xs ml-1">({reviewCount})</span>
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Inventory" />
      ),
      cell: ({ row }) => {
        const quantity = row.original.quantity;
        const inventory =
          typeof quantity === "string" ? parseFloat(quantity) : quantity;

        let color = "text-green-600";
        if (inventory === 0) {
          color = "text-red-600";
        } else if (inventory < 20) {
          color = "text-amber-600";
        }

        return <div className={color}>{inventory}</div>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const styles: Record<string, string> = {
          draft: "bg-gray-600",
          pending: "bg-amber-600",
          active: "bg-green-700",
          rejected: "bg-red-600",
        };

        return (
          <Badge className={styles[status] ?? "bg-gray-600"}>{status}</Badge>
        );
      },
      filterFn: (row, id, value) => {
        return row.original.status === value;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        const formatted = new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
        }).format(date);

        return <div>{formatted}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        const needsApproval =
          product.status === "pending" || product.status === "rejected";
        const storefrontUrl = getStorefrontProductUrl(product.slug);

        return (
          <div className="flex items-center gap-2">
            {needsApproval &&
              (storefrontUrl ? (
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
              ))}
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
                <DropdownMenuSeparator />
                <DropdownMenuItem>View variants</DropdownMenuItem>
                <DropdownMenuItem>Manage inventory</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Delete product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
