"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { CheckCircle, ShoppingBag, Star, Package } from "lucide-react";
import { DataTable } from "../_components/data-table/data-table";
import { getBrandsColumns } from "./_components/table-columns";
import type { Brand, BrandStats, Locale } from "./brands.types";
import { BrandDialog } from "./_components/brands.chunks";
import { toast } from "sonner";
import { updateBrandStatus } from "@/actions/brands";

interface BrandsContentProps {
  brands: Brand[];
  stats: BrandStats;
  locale: Locale;
}

export function BrandsContent({
  brands,
  stats,
  locale: initialLocale,
}: BrandsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentLocale, setCurrentLocale] = useState<Locale>(initialLocale);

  const handleLocaleChange = (newLocale: Locale) => {
    setCurrentLocale(newLocale);
    const params = new URLSearchParams(searchParams.toString());
    params.set("locale", newLocale);
    router.push(`?${params.toString()}`);
  };

  const handleStatusUpdate = async (
    brandId: string,
    field: "isVerified" | "isOfficial",
    value: boolean
  ) => {
    try {
      const result = await updateBrandStatus(brandId, { [field]: value });

      if (result.success) {
        toast.success(
          `Brand ${field === "isVerified" ? "verification" : "official status"} updated`
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update brand status");
      }
    } catch (error) {
      console.error("Error updating brand status:", error);
      toast.error("Failed to update brand status");
    }
  };

  const columns = getBrandsColumns({
    locale: currentLocale,
    onStatusUpdate: handleStatusUpdate,
  });

  // Filter brands by locale (client-side filtering until schema is updated)
  // Note: Once locale column is added to schema, this can be moved to server-side
  // For now, show all brands since locale column doesn't exist yet
  const filteredBrands = brands;
  // Once schema is updated, uncomment: .filter((brand) => !brand.locale || brand.locale === currentLocale)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">
            Manage product brands and manufacturers
          </p>
        </div>
        <BrandDialog mode="create" locale={currentLocale} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShoppingBag className="h-4 w-4 mr-2 text-gray-500" />
              Total Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All brands</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-gray-500" />
              Verified Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? Math.round((stats.verified / stats.total) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-gray-500" />
              Official Brands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.official}</div>
            <p className="text-xs text-muted-foreground">Official partners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="h-4 w-4 mr-2 text-gray-500" />
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Across all brands</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Locale */}
      <Tabs
        value={currentLocale}
        onValueChange={(value) => handleLocaleChange(value as Locale)}
      >
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ar">Arabic</TabsTrigger>
        </TabsList>
        <TabsContent value="en" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={filteredBrands}
            searchableColumns={[
              {
                id: "name",
                title: "Brand Name",
              },
              {
                id: "description",
                title: "Description",
              },
            ]}
            filterableColumns={[
              {
                id: "isVerified",
                title: "Status",
                options: [
                  { label: "Verified", value: "true" },
                  { label: "Unverified", value: "false" },
                ],
              },
              {
                id: "isOfficial",
                title: "Official",
                options: [
                  { label: "Official", value: "true" },
                  { label: "Not Official", value: "false" },
                ],
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="ar" className="p-0 mt-4">
          <DataTable
            columns={columns}
            data={filteredBrands}
            searchableColumns={[
              {
                id: "name",
                title: "Brand Name",
              },
              {
                id: "description",
                title: "Description",
              },
            ]}
            filterableColumns={[
              {
                id: "isVerified",
                title: "Status",
                options: [
                  { label: "Verified", value: "true" },
                  { label: "Unverified", value: "false" },
                ],
              },
              {
                id: "isOfficial",
                title: "Official",
                options: [
                  { label: "Official", value: "true" },
                  { label: "Not Official", value: "false" },
                ],
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
