import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { PageContainer } from "@/components/seller-ui";
import { VendorOrdersData } from "./vendor-orders.data";
import { ListPageSkeleton } from "./orders-page-frame";
import type { OrdersListFilters } from "./orders-view.lib";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function OrdersPage({
  searchParams,
}: {
  // Filters and paging live in the URL. `order` (from the header search) opens that order on load.
  searchParams: Promise<Partial<Record<keyof OrdersListFilters | "order", string | string[] | undefined>>>;
}) {
  const lock = await currentOrderLock();
  // Not activated: no order shows, the first one included, only the top-up message (F-84; owner 2026-11-16).
  if (lock.ordersLocked) return <OrdersLocked lock={lock} />;
  const params = await searchParams;

  return (
    <PageContainer data-clarity-mask="true">
      <Suspense fallback={<ListPageSkeleton />}>
        <VendorOrdersData searchParams={params} />
      </Suspense>
    </PageContainer>
  );
}
