import { Suspense } from "react";
import type { RawSearchParams } from "../_components/data-table/search-params";
import { getSellerStats, getSellers } from "./sellers.server";
import { SellersClientWrapper } from "./sellers.client";
import { parseSellersParams } from "./sellers.params";
import { SellersTableSkeleton } from "./sellers.skeleton";
import type { Seller, SellerStats } from "./sellers.types";

export const dynamic = "force-dynamic";

const EMPTY_STATS: SellerStats = {
  totalSellers: 0,
  activeSellers: 0,
  pendingSellers: 0,
  suspendedSellers: 0,
  totalProducts: 0,
  totalRevenue: 0,
};

async function SellersPageData({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const query = parseSellersParams(await searchParams);
  // Sequential to stay within the serverless DB pool.
  const statsResult = await getSellerStats();
  const sellersResult = await getSellers(query);

  return (
    <div className="space-y-6">
      {!sellersResult.success && (
        <p className="text-center text-red-600">
          {sellersResult.error || "Failed to fetch sellers"}
        </p>
      )}
      <SellersClientWrapper
        sellers={(sellersResult.success ? sellersResult.data : []) as Seller[]}
        totalCount={sellersResult.success ? (sellersResult.totalCount ?? 0) : 0}
        stats={(statsResult.success && statsResult.data) || EMPTY_STATS}
      />
    </div>
  );
}

export default function SellersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <Suspense fallback={<SellersTableSkeleton />}>
      <SellersPageData searchParams={searchParams} />
    </Suspense>
  );
}
