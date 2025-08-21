"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Star } from "lucide-react";
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

interface Product {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  averageRating: number;
  reviewCount: number;
  brand: string;
  mainCategory: string;
  status: "active" | "inactive";
  inventory: number;
  createdAt: string;
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
        <div className="text-xs text-gray-500">{row.getValue("id")}</div>
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
              className="font-medium hover:underline"
            >
              {row.getValue("title")}
            </Link>
            <div className="text-xs text-gray-500">{row.original.slug}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "basePrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("basePrice"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);

        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: "brand",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Brand" />
      ),
    },
    {
      accessorKey: "mainCategory",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
    },
    {
      accessorKey: "averageRating",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rating" />
      ),
      cell: ({ row }) => {
        const rating = parseFloat(row.getValue("averageRating"));
        return (
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-gray-500 text-xs ml-1">
              ({row.original.reviewCount})
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "inventory",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Inventory" />
      ),
      cell: ({ row }) => {
        const inventory = parseInt(row.getValue("inventory"));

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
        const status = row.getValue("status") as string;

        return (
          <Badge
            className={status === "active" ? "bg-green-700" : "bg-red-600"}
          >
            {status === "active" ? "Active" : "Inactive"}
          </Badge>
        );
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

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Link href={`/products/${product.id}`} className="w-full">
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href={`/products/${product.id}/edit`} className="w-full">
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
        );
      },
    },
  ];
}
