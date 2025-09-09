import { Suspense } from "react";
import { VendorDashboardSkeleton } from "./_components/vendor-dashboard.skeleton";
import { VendorDashboardData } from "./_components/vendor-dashboard.data";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

export default function VendorDashboardPage() {
  return (
    <div className="min-h-screen p-6">
      <Suspense fallback={<VendorDashboardSkeleton />}>
        <VendorDashboardData />
      </Suspense>
    </div>
  );
}
