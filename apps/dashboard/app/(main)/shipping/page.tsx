import { Suspense } from "react";
import { ShippingData } from "./shipping.data";
import { ShippingSkeleton } from "./shipping.skeleton";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

export default function ShippingPage() {
  return (
    <div className="min-h-screen p-6">
      <Suspense fallback={<ShippingSkeleton />}>
        <ShippingData />
      </Suspense>
    </div>
  );
}
