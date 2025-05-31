//@ts-ignore
//@ts-nocheck
"use client";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Plus } from "lucide-react";
import { getProductsColumns } from "./_components/table-columns";
import { DataTable } from "../_components/data-table/data-table";

// Mock data for demonstration
const products = [
  {
    id: "prod_01",
    title: "Smartphone X Pro",
    slug: "smartphone-x-pro",
    basePrice: 999.99,
    averageRating: 4.7,
    reviewCount: 256,
    brand: "TechBrand",
    mainCategory: "Electronics",
    status: "active",
    inventory: 125,
    createdAt: "2023-10-15T10:30:00Z",
  },
  {
    id: "prod_02",
    title: "Wireless Headphones",
    slug: "wireless-headphones",
    basePrice: 199.99,
    averageRating: 4.5,
    reviewCount: 182,
    brand: "AudioTech",
    mainCategory: "Electronics",
    status: "active",
    inventory: 78,
    createdAt: "2023-10-12T14:20:00Z",
  },
  {
    id: "prod_03",
    title: "Fitness Tracker Watch",
    slug: "fitness-tracker-watch",
    basePrice: 89.99,
    averageRating: 4.2,
    reviewCount: 143,
    brand: "FitWear",
    mainCategory: "Wearables",
    status: "active",
    inventory: 92,
    createdAt: "2023-10-10T09:15:00Z",
  },
  {
    id: "prod_04",
    title: "Laptop Pro 15-inch",
    slug: "laptop-pro-15-inch",
    basePrice: 1299.99,
    averageRating: 4.8,
    reviewCount: 198,
    brand: "TechBrand",
    mainCategory: "Electronics",
    status: "active",
    inventory: 32,
    createdAt: "2023-10-08T16:45:00Z",
  },
  {
    id: "prod_05",
    title: "Smart Home Speaker",
    slug: "smart-home-speaker",
    basePrice: 149.99,
    averageRating: 4.4,
    reviewCount: 127,
    brand: "HomeTech",
    mainCategory: "Smart Home",
    status: "active",
    inventory: 54,
    createdAt: "2023-10-05T11:50:00Z",
  },
  {
    id: "prod_06",
    title: "Camera DSLR Pro",
    slug: "camera-dslr-pro",
    basePrice: 899.99,
    averageRating: 4.6,
    reviewCount: 112,
    brand: "PhotoTech",
    mainCategory: "Photography",
    status: "inactive",
    inventory: 0,
    createdAt: "2023-10-03T13:25:00Z",
  },
  {
    id: "prod_07",
    title: "Gaming Console X",
    slug: "gaming-console-x",
    basePrice: 499.99,
    averageRating: 4.9,
    reviewCount: 321,
    brand: "GameTech",
    mainCategory: "Gaming",
    status: "active",
    inventory: 18,
    createdAt: "2023-10-01T15:30:00Z",
  },
  {
    id: "prod_08",
    title: "Tablet Pro 11-inch",
    slug: "tablet-pro-11-inch",
    basePrice: 699.99,
    averageRating: 4.5,
    reviewCount: 167,
    brand: "TechBrand",
    mainCategory: "Electronics",
    status: "active",
    inventory: 41,
    createdAt: "2023-09-28T10:15:00Z",
  },
  {
    id: "prod_09",
    title: "Wireless Earbuds",
    slug: "wireless-earbuds",
    basePrice: 129.99,
    averageRating: 4.3,
    reviewCount: 208,
    brand: "AudioTech",
    mainCategory: "Electronics",
    status: "active",
    inventory: 67,
    createdAt: "2023-09-25T14:40:00Z",
  },
  {
    id: "prod_10",
    title: "Smart Watch Series 5",
    slug: "smart-watch-series-5",
    basePrice: 299.99,
    averageRating: 4.7,
    reviewCount: 176,
    brand: "WearTech",
    mainCategory: "Wearables",
    status: "active",
    inventory: 29,
    createdAt: "2023-09-22T09:50:00Z",
  },
];

export default function ProductsPage() {
  const columns = getProductsColumns();

  return (
    <div className="h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <Link href="/products/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={products}
        filterableColumns={[
          {
            id: "status",
            title: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
          {
            id: "mainCategory",
            title: "Category",
            options: [
              { label: "Electronics", value: "Electronics" },
              { label: "Wearables", value: "Wearables" },
              { label: "Smart Home", value: "Smart Home" },
              { label: "Photography", value: "Photography" },
              { label: "Gaming", value: "Gaming" },
            ],
          },
          {
            id: "brand",
            title: "Brand",
            options: [
              { label: "TechBrand", value: "TechBrand" },
              { label: "AudioTech", value: "AudioTech" },
              { label: "FitWear", value: "FitWear" },
              { label: "HomeTech", value: "HomeTech" },
              { label: "PhotoTech", value: "PhotoTech" },
              { label: "GameTech", value: "GameTech" },
              { label: "WearTech", value: "WearTech" },
            ],
          },
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
