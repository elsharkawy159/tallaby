import { Suspense } from "react";
import {
  getPendingCartStats,
  getPendingCarts,
} from "@/actions/pending-carts";
import { CartStatsCards } from "./pending-carts.chunks";
import { PendingCartsClientWrapper } from "./pending-carts.client";
import { PendingCartsSkeleton } from "./pending-carts.skeleton";
import type { PendingCart } from "./pending-carts.types";

export async function PendingCartsStatsData() {
  const statsResult = await getPendingCartStats();

  if (!statsResult.success) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">
          {statsResult.error || "Failed to load pending cart stats"}
        </p>
      </div>
    );
  }

  return (
    <>{statsResult.data && <CartStatsCards stats={statsResult.data} />}</>
  );
}

export async function PendingCartsListData() {
  const cartsResult = await getPendingCarts({ limit: 200 });
  const initialCarts = (
    cartsResult.success ? cartsResult.data || [] : []
  ) as PendingCart[];

  if (!cartsResult.success) {
    return (
      <div className="space-y-4">
        <p className="text-center text-red-600">
          {cartsResult.error || "Failed to load pending carts"}
        </p>
        <PendingCartsClientWrapper initialCarts={[]} />
      </div>
    );
  }

  return <PendingCartsClientWrapper initialCarts={initialCarts} />;
}

export function PendingCartsDataWrapper() {
  return (
    <>
      <Suspense fallback={<PendingCartsSkeleton />}>
        <PendingCartsStatsData />
      </Suspense>
      <Suspense fallback={<PendingCartsSkeleton />}>
        <PendingCartsListData />
      </Suspense>
    </>
  );
}
