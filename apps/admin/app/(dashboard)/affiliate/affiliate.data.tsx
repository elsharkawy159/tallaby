import { Suspense } from "react";
import { getAffiliates, getAffiliateStats } from "@/actions/affiliates";
import { AffiliateClientWrapper } from "./affiliate.client";
import { AffiliateSkeleton } from "./affiliate.skeleton";
import type { AffiliatesPageProps } from "./affiliate.types";

type AffiliateDataProps = AffiliatesPageProps;

async function AffiliateDataContent({ searchParams }: AffiliateDataProps) {
  const params = await searchParams;

  const [statsResult, listResult] = await Promise.all([
    getAffiliateStats(),
    getAffiliates({
      status: params?.status as "active" | "inactive" | undefined,
      performance: params?.performance as
        | "has_orders"
        | "no_orders"
        | "has_delivered"
        | undefined,
      earnings: params?.earnings as "has_pending" | "has_earned" | undefined,
      search: params?.search,
    }),
  ]);

  if (!statsResult.success || !listResult.success) {
    throw new Error(
      (!statsResult.success && statsResult.error) ||
        (!listResult.success && listResult.error) ||
        "Failed to load affiliates"
    );
  }

  return (
    <AffiliateClientWrapper
      initialStats={statsResult.data}
      initialRows={listResult.data.rows}
      initialTruncated={listResult.data.truncated}
    />
  );
}

export function AffiliateData({ searchParams }: AffiliateDataProps) {
  return (
    <Suspense fallback={<AffiliateSkeleton />}>
      <AffiliateDataContent searchParams={searchParams} />
    </Suspense>
  );
}
