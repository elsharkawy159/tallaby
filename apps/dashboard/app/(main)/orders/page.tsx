import { Suspense } from "react";
import { VendorOrdersData } from "./vendor-orders.data";
import { VendorOrdersSkeleton } from "./orders-chunks";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return (
    <div className="min-h-screen p-6">
      <Suspense fallback={<VendorOrdersSkeleton />}>
        <VendorOrdersData />
      </Suspense>
    </div>
  );
}
