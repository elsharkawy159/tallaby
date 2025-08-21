import { Suspense } from "react";
import { VendorOrdersData } from "./_components/vendor-orders.data";
import { VendorOrdersSkeleton } from "./_components/vendor-orders.skeleton";

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-2">
          Manage customer orders and track fulfillment
        </p>
      </div>

      <Suspense fallback={<VendorOrdersSkeleton />}>
        <VendorOrdersData />
      </Suspense>
    </div>
  );
}
