"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { CheckCircle, ShoppingBag, Star, Package } from "lucide-react";
import { DataTable } from "../_components/data-table/data-table";
import type { DataTableFilter } from "../_components/data-table/data-table.types";
import { useTableUrlState } from "../_components/data-table/use-table-url-state";
import { BRANDS_DEFAULT_SORT } from "./brands.params";
import { getBrandsColumns } from "./_components/table-columns";
import type { Brand, BrandStats, Locale } from "./brands.types";
import { BrandDialog } from "./_components/brands.chunks";
import { toast } from "sonner";
import { updateBrandStatus } from "@/actions/brands";

const BRAND_FILTERS: DataTableFilter[] = [
  {
    id: "verification",
    title: "Verification",
    options: [
      { label: "Verified", value: "verified" },
      { label: "Unverified", value: "unverified" },
    ],
  },
  {
    id: "official",
    title: "Official",
    options: [
      { label: "Official", value: "official" },
      { label: "Not official", value: "not-official" },
    ],
  },
  {
    id: "language",
    title: "Language",
    options: [
      { label: "English", value: "en" },
      { label: "Arabic", value: "ar" },
    ],
  },
];

interface BrandsContentProps {
  brands: Brand[];
  totalCount: number;
  stats: BrandStats;
}

export function BrandsContent({
  brands,
  totalCount,
  stats,
}: BrandsContentProps) {
  const router = useRouter();
  const url = useTableUrlState();
  const currentLocale: Locale = url.get("locale") === "ar" ? "ar" : "en";

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

  return (
    <>
      <div className="flex items-center justify-end mb-6">
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

      {/* Display language for names/descriptions */}
      <Tabs
        value={currentLocale}
        onValueChange={(value) =>
          url.setParams({ locale: value === "en" ? null : value }, { resetPage: false })
        }
      >
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ar">Arabic</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={brands}
          getRowId={(brand) => brand.id}
          filterableColumns={BRAND_FILTERS}
          emptyMessage="No brands match these filters."
          serverSide={{
            rowCount: totalCount,
            defaultSort: BRANDS_DEFAULT_SORT,
            searchPlaceholder: "Search name, slug, description or website…",
          }}
        />
      </div>
    </>
  );
}
