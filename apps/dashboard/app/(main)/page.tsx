import { Suspense } from "react";
// import { VendorDashboardData } from "./_components/vendor-dashboard.data";
// import { VendorDashboardSkeleton } from "./_components/vendor-dashboard.skeleton";

export default function VendorDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      {/* <Suspense fallback={<VendorDashboardSkeleton />}> */}
        {/* <VendorDashboardData /> */}
      {/* </Suspense> */}
    </div>
  );
}
