"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getAllProducts, updateProductStatus } from "@/actions/products";
import { getProductsColumns } from "./_components/table-columns";
import { DataTable } from "../_components/data-table/data-table";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sku: string;
  isActive: boolean;
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

export function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const result = await getAllProducts({
        limit: 1000, // Get all products for now
      });

      if (result.success && result.data) {
        // Sort products: inactive first, then by createdAt desc
        const sortedProducts = [...result.data].sort((a, b) => {
          // First sort by isActive (false/inactive first)
          if (a.isActive !== b.isActive) {
            return a.isActive ? 1 : -1;
          }
          // Then by createdAt (newest first)
          return (
            new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
          );
        });

        setProducts(sortedProducts as unknown as Product[]);
      } else {
        toast.error(result.error || "Failed to load products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleApproveProduct = async (productId: string) => {
    try {
      const result = await updateProductStatus(productId, true);

      if (result.success) {
        toast.success("Product approved successfully");
        // Update local state and re-sort in one operation
        setProducts((prev) => {
          const updated = prev.map((product) =>
            product.id === productId ? { ...product, isActive: true } : product
          );
          // Re-sort after update: inactive first, then by createdAt desc
          return updated.sort((a, b) => {
            if (a.isActive !== b.isActive) {
              return a.isActive ? 1 : -1;
            }
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        });
      } else {
        toast.error(result.error || "Failed to approve product");
      }
    } catch (error) {
      console.error("Error approving product:", error);
      toast.error("Failed to approve product");
    }
  };

  const columns = getProductsColumns(handleApproveProduct);

  // Get unique categories and brands for filters
  const categories = Array.from(
    new Set(
      products
        .map((p) => p.category?.name)
        .filter((name): name is string => Boolean(name))
    )
  ).map((name) => ({ label: name, value: name }));

  const brands = Array.from(
    new Set(
      products
        .map((p) => p.brand?.name)
        .filter((name): name is string => Boolean(name))
    )
  ).map((name) => ({ label: name, value: name }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <DataTable
        columns={columns}
        data={products}
        filterableColumns={[
          {
            id: "isActive",
            title: "Status",
            options: [
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ],
          },
          ...(categories.length > 0
            ? [
                {
                  id: "category",
                  title: "Category",
                  options: categories,
                },
              ]
            : []),
          ...(brands.length > 0
            ? [
                {
                  id: "brand",
                  title: "Brand",
                  options: brands,
                },
              ]
            : []),
        ]}
        searchableColumns={[
          {
            id: "title",
            title: "Product Title",
          },
        ]}
      />
    </div>
  );
}
