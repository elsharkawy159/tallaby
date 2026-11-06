import { Suspense } from "react";
import { currentOrderLock, requireSeller } from "@/lib/auth/require-seller.server";
import { OrdersLocked, OrdersLockedNotice } from "@/components/orders/orders-locked";
import { loadOrdersOverview } from "./orders-list.query";
import { PageContainer } from "@/components/seller-ui";
import { VendorOrdersData } from "./vendor-orders.data";
import { ListPageSkeleton } from "./orders-page-frame";
import type { OrdersListFilters } from "./orders-view.lib";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  // Filters and paging live in the URL. `order` (from the header search) opens that order on load.
  searchParams: Promise<Partial<Record<keyof OrdersListFilters | "order", string | string[] | undefined>>>;
}) {
  const lock = await currentOrderLock();
  if (lock.locked) {
    // Not activated: only the seller's own test orders show (F-76), under the top-up message.
    const { sellerId } = await requireSeller();
    if ((await loadOrdersOverview(sellerId, true)).orders === 0) return <OrdersLocked lock={lock} />;
  }
  const params = await searchParams;

  return (
    <PageContainer>
      {lock.locked && (
        <div className="mb-4">
          <OrdersLockedNotice lock={lock} />
        </div>
      )}
      <Suspense fallback={<ListPageSkeleton />}>
        <VendorOrdersData searchParams={params} />
      </Suspense>
    </PageContainer>
  );
}
