"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash, Eye, Package } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
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
import { DataTable } from "@/app/(dashboard)/_components/data-table/data-table";

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  listPrice?: number;
  isDefault: boolean;
  isActive: boolean;
  inventory: number;
  imageUrl?: string;
}

// Mock data for variants
const variants: ProductVariant[] = [
  {
    id: "var_001",
    sku: "SP-X-PRO-BLK-128",
    name: "Black / 128GB",
    attributes: {
      color: "Black",
      storage: "128GB",
    },
    price: 999.99,
    listPrice: 1099.99,
    isDefault: true,
    isActive: true,
    inventory: 45,
    imageUrl: "/images/products/smartphone-black.jpg",
  },
  {
    id: "var_002",
    sku: "SP-X-PRO-BLK-256",
    name: "Black / 256GB",
    attributes: {
      color: "Black",
      storage: "256GB",
    },
    price: 1099.99,
    listPrice: 1199.99,
    isDefault: false,
    isActive: true,
    inventory: 32,
    imageUrl: "/images/products/smartphone-black.jpg",
  },
  {
    id: "var_003",
    sku: "SP-X-PRO-BLK-512",
    name: "Black / 512GB",
    attributes: {
      color: "Black",
      storage: "512GB",
    },
    price: 1299.99,
    listPrice: 1399.99,
    isDefault: false,
    isActive: true,
    inventory: 18,
    imageUrl: "/images/products/smartphone-black.jpg",
  },
  {
    id: "var_004",
    sku: "SP-X-PRO-WHT-128",
    name: "White / 128GB",
    attributes: {
      color: "White",
      storage: "128GB",
    },
    price: 999.99,
    listPrice: 1099.99,
    isDefault: false,
    isActive: true,
    inventory: 27,
    imageUrl: "/images/products/smartphone-white.jpg",
  },
  {
    id: "var_005",
    sku: "SP-X-PRO-WHT-256",
    name: "White / 256GB",
    attributes: {
      color: "White",
      storage: "256GB",
    },
    price: 1099.99,
    listPrice: 1199.99,
    isDefault: false,
    isActive: true,
    inventory: 15,
    imageUrl: "/images/products/smartphone-white.jpg",
  },
  {
    id: "var_006",
    sku: "SP-X-PRO-WHT-512",
    name: "White / 512GB",
    attributes: {
      color: "White",
      storage: "512GB",
    },
    price: 1299.99,
    listPrice: 1399.99,
    isDefault: false,
    isActive: false,
    inventory: 0,
    imageUrl: "/images/products/smartphone-white.jpg",
  },
  {
    id: "var_007",
    sku: "SP-X-PRO-BLU-128",
    name: "Blue / 128GB",
    attributes: {
      color: "Blue",
      storage: "128GB",
    },
    price: 999.99,
    listPrice: 1099.99,
    isDefault: false,
    isActive: true,
    inventory: 21,
    imageUrl: "/images/products/smartphone-blue.jpg",
  },
  {
    id: "var_008",
    sku: "SP-X-PRO-BLU-256",
    name: "Blue / 256GB",
    attributes: {
      color: "Blue",
      storage: "256GB",
    },
    price: 1099.99,
    listPrice: 1199.99,
    isDefault: false,
    isActive: true,
    inventory: 3,
    imageUrl: "/images/products/smartphone-blue.jpg",
  },
];

interface ProductVariantsTableProps {
  productId: string;
}

export function ProductVariantsTable({ productId }: ProductVariantsTableProps) {
  // In a real app, you would fetch variants data using the productId
  const [data] = useState<ProductVariant[]>(variants);

  const columns: ColumnDef<ProductVariant>[] = [
    {
      accessorKey: "name",
      header: "Variant",
      cell: ({ row }) => {
        const variant = row.original;
        return (
          <div className="flex items-center gap-2">
            {variant.isDefault && (
              <Badge variant="outline" className="mr-1">
                Default
              </Badge>
            )}
            <span>{variant.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: "SKU",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"));
        const listPrice = row.original.listPrice;

        return (
          <div>
            <div className="font-medium">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(price)}
            </div>
            {listPrice && (
              <div className="text-xs text-gray-500 line-through">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(listPrice)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "inventory",
      header: "Inventory",
      cell: ({ row }) => {
        const inventory = parseInt(row.getValue("inventory"));

        let textColor = "text-green-600";
        if (inventory === 0) {
          textColor = "text-red-600";
        } else if (inventory < 10) {
          textColor = "text-amber-600";
        }

        return (
          <div className="flex items-center">
            <Package className="h-4 w-4 mr-2 text-gray-500" />
            <span className={textColor}>{inventory}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive");

        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "attributes",
      header: "Attributes",
      cell: ({ row }) => {
        const attributes = row.getValue("attributes") as Record<string, string>;

        return (
          <div className="flex flex-wrap gap-1">
            {Object.entries(attributes).map(([key, value]) => (
              <Badge key={key} variant="outline" className="bg-gray-50">
                {key}: {value}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const variant = row.original;

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
                <Link
                  href={`/withAuth/products/${productId}/variants/${variant.id}`}
                  className="w-full flex items-center"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href={`/withAuth/products/${productId}/variants/${variant.id}/edit`}
                  className="w-full flex items-center"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit variant
                </Link>
              </DropdownMenuItem>
              {!variant.isDefault && (
                <DropdownMenuItem>Set as default</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>Update inventory</DropdownMenuItem>
              <DropdownMenuItem>Manage images</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                Delete variant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchableColumns={[
        {
          id: "name",
          title: "Variant Name",
        },
        {
          id: "sku",
          title: "SKU",
        },
      ]}
      filterableColumns={[
        {
          id: "isActive",
          title: "Status",
          options: [
            { label: "Active", value: "true" },
            { label: "Inactive", value: "false" },
          ],
        },
      ]}
    />
  );
}
