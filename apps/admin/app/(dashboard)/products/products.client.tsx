"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getAllProducts } from "@/actions/products";
import { getProductsColumns } from "./_components/table-columns";
import { DataTable } from "../_components/data-table/data-table";

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

const statusSortOrder: Record<Product["status"], number> = {
  pending: 0,
  rejected: 1,
  draft: 2,
  active: 3,
};

export function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const result = await getAllProducts({
        limit: 1000,
      });

      if (result.success && result.data) {
        const sortedProducts = [...result.data].sort((a, b) => {
          const statusDiff =
            statusSortOrder[a.status as Product["status"]] -
            statusSortOrder[b.status as Product["status"]];
          if (statusDiff !== 0) return statusDiff;
          return (
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime()
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

  const columns = getProductsColumns();

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
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage and approve seller products
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadProducts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link href="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        filterableColumns={[
          {
            id: "status",
            title: "Status",
            options: [
              { label: "Draft", value: "draft" },
              { label: "Pending", value: "pending" },
              { label: "Active", value: "active" },
              { label: "Rejected", value: "rejected" },
            ],
          },
          {
            id: "category",
            title: "Category",
            options: categories,
          },
          {
            id: "brand",
            title: "Brand",
            options: brands,
          },
        ]}
      />
    </div>
  );
}
