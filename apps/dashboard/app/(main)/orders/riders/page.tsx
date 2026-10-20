import { Suspense } from "react";
import { ShippingData } from "../delivery/shipping.data";
import { ShippingSkeleton } from "../delivery/shipping.skeleton";

// Per-seller data read from the session cookie.
export const dynamic = "force-dynamic";

/** Riders (PLAN.md §7.2, P3-06): the delivery workspace opened on its riders view. */
export default function RidersPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Suspense fallback={<ShippingSkeleton />}>
        <ShippingData view="riders" />
      </Suspense>
    </div>
  );
}
