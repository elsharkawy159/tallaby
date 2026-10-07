import { Suspense } from "react";
import { getAdminCoupons } from "@/actions/coupons";
import { CouponsContent } from "./coupons.client";
import { parseCouponsParams } from "./coupons.params";
import { CouponsSkeleton } from "./coupons.skeleton";
import type { CouponsPageProps } from "./coupons.types";

async function CouponsDataContent({ searchParams }: CouponsPageProps) {
  // Awaited inside the Suspense boundary so the skeleton shows immediately.
  const result = await getAdminCoupons(parseCouponsParams(await searchParams));

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch coupons");
  }

  return (
    <CouponsContent
      coupons={result.data}
      totalCount={result.totalCount}
      stats={result.stats}
    />
  );
}

export function CouponsData({ searchParams }: CouponsPageProps) {
  return (
    <Suspense fallback={<CouponsSkeleton />}>
      <CouponsDataContent searchParams={searchParams} />
    </Suspense>
  );
}
