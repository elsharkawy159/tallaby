import { getSellerStats } from "./sellers.server";
import { SellersClientWrapper } from "./sellers.client";
import type { SellersPageProps } from "./sellers.types";

export default async function SellersPage({ searchParams }: SellersPageProps) {
  // Parse search params for initial filters
  const resolvedSearchParams = await searchParams;
  const initialFilters = {
    status: resolvedSearchParams?.status,
    search: resolvedSearchParams?.search,
  };

  // Get initial stats
  const statsResult = await getSellerStats();
  const initialStats = statsResult.success
    ? statsResult.data
    : {
        totalSellers: 0,
        activeSellers: 0,
        pendingSellers: 0,
        suspendedSellers: 0,
        totalProducts: 0,
        totalRevenue: 0,
      };

  return (
    <div className="space-y-6">
      <SellersClientWrapper
        initialFilters={initialFilters as any}
        initialStats={
          initialStats || {
            totalSellers: 0,
            activeSellers: 0,
            pendingSellers: 0,
            suspendedSellers: 0,
            totalProducts: 0,
            totalRevenue: 0,
          }
        }
      />
    </div>
  );
}
