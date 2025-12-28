import { Suspense } from "react";
import { getAllBrands } from "@/actions/brands";
import type { Brand, BrandStats, Locale } from "./brands.types";
import { BrandsContent } from "./brands.client";
import { BrandsSkeleton } from "./brands.skeleton";
import { calculateBrandStats } from "./brands.lib";

interface BrandsDataProps {
  searchParams?: {
    locale?: Locale;
    verified?: string;
    official?: string;
    search?: string;
    page?: string;
    limit?: string;
  };
}

async function BrandsDataContent({ searchParams }: BrandsDataProps) {
  const limit = searchParams?.limit ? parseInt(searchParams.limit) : 1000;
  const offset = searchParams?.page
    ? (parseInt(searchParams.page) - 1) * limit
    : 0;
  const locale = (searchParams?.locale || "en") as Locale;

  const brandsResult = await getAllBrands({
    locale,
    verified:
      searchParams?.verified !== undefined
        ? searchParams.verified === "true"
        : undefined,
    official:
      searchParams?.official !== undefined
        ? searchParams.official === "true"
        : undefined,
    search: searchParams?.search,
    limit,
    offset,
  });

  if (!brandsResult.success) {
    throw new Error(brandsResult.error || "Failed to fetch brands");
  }

  const brands = (brandsResult.data || []) as Brand[];

  // Calculate stats from brands data
  const brandStats: BrandStats = calculateBrandStats(brands);

  return <BrandsContent brands={brands} stats={brandStats} locale={locale} />;
}

export function BrandsData({ searchParams }: BrandsDataProps) {
  return (
    <Suspense fallback={<BrandsSkeleton />}>
      <BrandsDataContent searchParams={searchParams} />
    </Suspense>
  );
}
