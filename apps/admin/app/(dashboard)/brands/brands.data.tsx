import { Suspense } from "react";
import { getAdminBrands } from "@/actions/brands-list";
import type { Brand, BrandsPageProps } from "./brands.types";
import { BrandsContent } from "./brands.client";
import { parseBrandsParams } from "./brands.params";
import { BrandsSkeleton } from "./brands.skeleton";

async function BrandsDataContent({ searchParams }: BrandsPageProps) {
  // Awaited here, inside the Suspense boundary, rather than in the page — so
  // the skeleton still shows immediately instead of the route blocking on it.
  const result = await getAdminBrands(parseBrandsParams(await searchParams));

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch brands");
  }

  return (
    <BrandsContent
      brands={result.data as Brand[]}
      totalCount={result.totalCount}
      stats={result.stats}
    />
  );
}

export function BrandsData({ searchParams }: BrandsPageProps) {
  return (
    <Suspense fallback={<BrandsSkeleton />}>
      <BrandsDataContent searchParams={searchParams} />
    </Suspense>
  );
}
