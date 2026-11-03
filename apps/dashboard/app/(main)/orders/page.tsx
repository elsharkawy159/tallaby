import { Suspense } from "react";
import { VendorOrdersData } from "./vendor-orders.data";
import { VendorOrdersSkeleton } from "./orders-chunks";
import type { OrdersListFilters } from "./orders-view.lib";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  // Filters and paging live in the URL. `order` (from the header search) opens that order on load.
  searchParams: Promise<Partial<Record<keyof OrdersListFilters | "order", string | string[] | undefined>>>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <Suspense fallback={<VendorOrdersSkeleton />}>
        <VendorOrdersData searchParams={params} />
      </Suspense>
    </div>
  );
}
