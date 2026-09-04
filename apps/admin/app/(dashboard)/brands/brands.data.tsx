import { Suspense } from "react";
import { getAllBrands } from "@/actions/brands";
import type {
  Brand,
  BrandStats,
  BrandsPageProps,
  Locale
} from "./brands.types";
import { BrandsContent } from "./brands.client";
import { BrandsSkeleton } from "./brands.skeleton";
import { calculateBrandStats } from "./brands.lib";

type BrandsDataProps = BrandsPageProps;

async function BrandsDataContent({ searchParams }: BrandsDataProps) {
  // Awaited here, inside the Suspense boundary, rather than in the page — so
  // the skeleton still shows immediately instead of the route blocking on it.
  const params = await searchParams;

  const limit = params?.limit ? parseInt(params.limit) : 1000;
  const offset = params?.page ? (parseInt(params.page) - 1) * limit : 0;
  const locale = (params?.locale || "en") as Locale;

  const brandsResult = await getAllBrands({
    locale,
    verified:
      params?.verified !== undefined ? params.verified === "true" : undefined,
    official:
      params?.official !== undefined ? params.official === "true" : undefined,
    search: params?.search,
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
