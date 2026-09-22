import { Suspense } from "react";
import { getAffiliates, getAffiliateStats } from "@/actions/affiliates";
import { AffiliateClientWrapper } from "./affiliate.client";
import { parseAffiliateParams } from "./affiliate.params";
import { AffiliateSkeleton } from "./affiliate.skeleton";
import type { AffiliatesPageProps } from "./affiliate.types";

async function AffiliateDataContent({ searchParams }: AffiliatesPageProps) {
  const filters = parseAffiliateParams(await searchParams);

  // Sequential to stay within the serverless DB pool.
  const statsResult = await getAffiliateStats();
  const listResult = await getAffiliates(filters);

  if (!statsResult.success || !listResult.success) {
    throw new Error(
      (!statsResult.success && statsResult.error) ||
        (!listResult.success && listResult.error) ||
        "Failed to load affiliates"
    );
  }

  return (
    <AffiliateClientWrapper
      stats={statsResult.data}
      rows={listResult.data.rows}
      totalCount={listResult.data.totalCount}
    />
  );
}

export function AffiliateData({ searchParams }: AffiliatesPageProps) {
  return (
    <Suspense fallback={<AffiliateSkeleton />}>
      <AffiliateDataContent searchParams={searchParams} />
    </Suspense>
  );
}
