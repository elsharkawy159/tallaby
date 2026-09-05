import { Suspense } from "react";
import { PendingCartsClientWrapper } from "./pending-carts.client";
import { PendingCartsDataWrapper } from "./pending-carts.data";
import { PendingCartsSkeleton } from "./pending-carts.skeleton";

export const dynamic = "force-dynamic";

export default function PendingCartsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<PendingCartsSkeleton />}>
        <PendingCartsDataWrapper />
      </Suspense>

      <PendingCartsClientWrapper />
    </div>
  );
}
