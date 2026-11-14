import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { PageContainer } from "@/components/seller-ui";
import { parseLeadRange, parseLeadStatus } from "@workspace/lib/checkout-leads";
import { ListPageSkeleton } from "../orders-page-frame";
import { MissedOrdersData } from "./missed-orders.data";

// Per-seller data read from the session cookie; personal data, never cached.
export const dynamic = "force-dynamic";

/** Orders › Not completed: store checkouts that got an address but no order (ROADMAP.md F-03). */
export default async function MissedOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; range?: string; status?: string }>;
}) {
  const lock = await currentOrderLock();
  if (lock.ordersLocked) return <OrdersLocked lock={lock} />;
  const params = await searchParams;
  return (
    <PageContainer data-clarity-mask="true">
      <Suspense fallback={<ListPageSkeleton />}>
        <MissedOrdersData
          storeId={typeof params.store === "string" ? params.store : null}
          range={parseLeadRange(params.range)}
          status={parseLeadStatus(params.status)}
        />
      </Suspense>
    </PageContainer>
  );
}
