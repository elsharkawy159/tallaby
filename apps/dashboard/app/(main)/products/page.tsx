import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Search, Upload, Edit, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";
import { VendorProductsData } from "./_components/vendor-products.data";
import { VendorProductsSkeleton } from "./_components/vendor-products.skeleton";

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600 mt-2">
          Manage your product catalog and inventory
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 transform text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            className="pl-10 border-gray-300 h-10"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-5 mb-6">
          <Button asChild>
            <Link href="/products/new">
              <Plus className="size-4" />
              Add Product
            </Link>
          </Button>
          <Button
            variant="destructive"
            className="hover:bg-red-600 text-white px-4 py-3 h-10 font-bold"
          >
            <Trash2 className="size-4" />
            Deactivate
          </Button>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 px-4 py-3 h-10 font-bold"
          >
            <Upload className="size-4" />
            Upload Sheet
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Suspense fallback={<VendorProductsSkeleton />}>
        <VendorProductsData />
      </Suspense>
    </div>
  );
}
