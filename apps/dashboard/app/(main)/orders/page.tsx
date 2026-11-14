import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersGraceNotice, OrdersLocked, OrdersLockedNotice } from "@/components/orders/orders-locked";
import { PageContainer } from "@/components/seller-ui";
import { currentGraceNoticeStoreReady } from "@/lib/billing/grace-notice.server";
import { showGraceNotice } from "@/lib/billing/grace-notice.lib";
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
  // Locked after the grace window: only the first order shows, under the top-up message (F-84).
  if (lock.ordersLocked && !lock.firstOrderId) return <OrdersLocked lock={lock} />;
  const [params, graceStoreReady] = await Promise.all([searchParams, currentGraceNoticeStoreReady(lock)]);

  return (
    <PageContainer data-clarity-mask="true">
      {lock.ordersLocked ? (
        <div className="mb-4">
          <OrdersLockedNotice lock={lock} />
        </div>
      ) : (
        showGraceNotice(lock, graceStoreReady) && (
          <div className="mb-4">
            <OrdersGraceNotice lock={lock} storeReady={graceStoreReady} />
          </div>
        )
      )}
      <Suspense fallback={<ListPageSkeleton />}>
        <VendorOrdersData searchParams={params} />
      </Suspense>
    </PageContainer>
  );
}
