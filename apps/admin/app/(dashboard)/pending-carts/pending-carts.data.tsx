import { Suspense } from "react";
import { getPendingCartStats } from "@/actions/pending-carts";
import { CartStatsCards } from "./pending-carts.chunks";
import { PendingCartsSkeleton } from "./pending-carts.skeleton";

export const PendingCartsData = async () => {
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
    <>
      {statsResult.data && <CartStatsCards stats={statsResult.data} />}
    </>
  );
};

export const PendingCartsDataWrapper = () => {
  return (
    <Suspense fallback={<PendingCartsSkeleton />}>
      <PendingCartsData />
    </Suspense>
  );
};
