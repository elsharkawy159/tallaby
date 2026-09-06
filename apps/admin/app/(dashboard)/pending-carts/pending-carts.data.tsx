import { Suspense } from "react";
import {
  getPendingCartStats,
  getPendingCarts,
} from "@/actions/pending-carts";
import { CartStatsCards } from "./pending-carts.chunks";
import { PendingCartsClientWrapper } from "./pending-carts.client";
import { PendingCartsSkeleton } from "./pending-carts.skeleton";
import type { PendingCart, PendingCartStats } from "./pending-carts.types";

/**
 * Stats + list load sequentially in one Suspense boundary.
 * Parallel Suspense sections each open their own DB work; together with the
 * layout sidebar count query they oversubscribed the serverless pool (max:4)
 * and wedged against Supabase's :6543 transaction pooler.
 */
export async function PendingCartsPageData() {
  const statsResult = await getPendingCartStats();
  const cartsResult = await getPendingCarts({ limit: 200 });

  const stats: PendingCartStats | null =
    statsResult.success && statsResult.data ? statsResult.data : null;
  const initialCarts = (
    cartsResult.success ? cartsResult.data || [] : []
  ) as PendingCart[];

  return (
    <div className="space-y-6">
      {stats ? (
        <CartStatsCards stats={stats} />
      ) : (
        <p className="text-center text-red-600">
          {statsResult.error || "Failed to load pending cart stats"}
        </p>
      )}

      {!cartsResult.success && (
        <p className="text-center text-red-600">
          {cartsResult.error || "Failed to load pending carts"}
        </p>
      )}

      <PendingCartsClientWrapper initialCarts={initialCarts} />
    </div>
  );
}

export function PendingCartsDataWrapper() {
  return (
    <Suspense fallback={<PendingCartsSkeleton />}>
      <PendingCartsPageData />
    </Suspense>
  );
}
