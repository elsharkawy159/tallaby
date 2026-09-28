import { Suspense } from "react";
import { VendorOrdersData } from "./vendor-orders.data";
import { VendorOrdersSkeleton } from "./orders-chunks";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  // `?order=<orders.id>` (from the header search) opens that order on load.
  const { order } = await searchParams;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Suspense fallback={<VendorOrdersSkeleton />}>
        <VendorOrdersData initialOrderId={order ?? null} />
      </Suspense>
    </div>
  );
}
