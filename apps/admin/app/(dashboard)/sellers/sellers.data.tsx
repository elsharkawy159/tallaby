import { Suspense } from "react";
import { getSellers, getSellerStats } from "./sellers.server";
import { SellerStatsCards, SellerRow } from "./sellers.chunks";
import { SellersTableSkeleton } from "./sellers.skeleton";
import type { SellerFilters } from "./sellers.types";

interface SellersDataProps {
  filters?: SellerFilters;
  onAction?: (sellerId: string, action: string) => void;
}

export const SellersData = async ({ filters, onAction }: SellersDataProps) => {
  const [sellersResult, statsResult] = await Promise.all([
    getSellers(filters),
    getSellerStats(),
  ]);

  if (!sellersResult.success) {
    throw new Error(sellersResult.error || "Failed to fetch sellers");
  }

  if (!statsResult.success) {
    throw new Error(statsResult.error || "Failed to fetch seller statistics");
  }

  const sellers = sellersResult.data || [];
  const stats = statsResult.data || {
    totalSellers: 0,
    activeSellers: 0,
    pendingSellers: 0,
    suspendedSellers: 0,
    totalProducts: 0,
    totalRevenue: 0,
  };

  return (
    <>
      <SellerStatsCards stats={stats} />

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-gray-800">
              <th className="py-4 px-4 text-left text-sm font-medium">
                Seller
              </th>
              <th className="py-4 px-4 text-center text-sm font-medium">
                Status
              </th>
              <th className="py-4 px-4 text-center text-sm font-medium">
                Products
              </th>
              <th className="py-4 px-4 text-center text-sm font-medium">
                Rating
              </th>
              <th className="py-4 px-4 text-center text-sm font-medium">
                Commission
              </th>
              <th className="py-4 px-4 text-right text-sm font-medium">
                Balance
              </th>
              <th className="py-4 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller) => (
              <SellerRow key={seller.id} seller={seller} onAction={onAction} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

interface SellersDataWrapperProps {
  filters?: SellerFilters;
  onAction?: (sellerId: string, action: string) => void;
}

export const SellersDataWrapper = ({
  filters,
  onAction,
}: SellersDataWrapperProps) => {
  return (
    <Suspense fallback={<SellersTableSkeleton />}>
      <SellersData filters={filters} onAction={onAction} />
    </Suspense>
  );
};
