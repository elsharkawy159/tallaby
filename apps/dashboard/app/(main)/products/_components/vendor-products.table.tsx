"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, Copy, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { VendorProduct } from "@/actions/vendor";

interface VendorProductsTableProps {
  products: VendorProduct[];
  total: number;
}

const formatCurrency = (amount: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(parseFloat(amount));
};

const getProductImage = (images: any) => {
  if (images && Array.isArray(images) && images.length > 0) {
    return images[0];
  }
  return "/placeholder-product.png";
};

const getStatusBadge = (isActive: boolean) => {
  return isActive ? (
    <Badge variant="default" className="bg-green-100 text-green-800">
      Active
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
      Inactive
    </Badge>
  );
};

export function VendorProductsTable({
  products,
  total,
}: VendorProductsTableProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts((prev) => [...prev, productId]);
    } else {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.389A1.5 1.5 0 0016 11.5V9a1.5 1.5 0 00-1.5-1.5h-5A1.5 1.5 0 008 9v2.5A1.5 1.5 0 006.5 13H4"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first product.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedProducts.length === products.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-gray-700">
              {selectedProducts.length} of {total} selected
            </span>
          </div>
          <span className="text-sm text-gray-500">{total} products</span>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {products.map((product) => (
          <div key={product.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={selectedProducts.includes(product.id)}
                onCheckedChange={(checked) =>
                  handleSelectProduct(product.id, checked as boolean)
                }
              />

              <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={getProductImage(product.images)}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {product.title}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  SKU: {product.listing?.sku || "N/A"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(product.listing?.price || product.basePrice)}
                </p>
                <p className="text-sm text-gray-500">
                  {product.listing?.quantity || 0} in stock
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {getStatusBadge(product.isActive)}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/products/${product.id}`}
                        className="flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
