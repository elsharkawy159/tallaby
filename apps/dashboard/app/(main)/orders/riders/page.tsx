import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { PageContainer } from "@/components/seller-ui";
import { ShippingData } from "../delivery/shipping.data";
import { ShippingSkeleton } from "../delivery/shipping.skeleton";

// Per-seller data read from the session cookie.
export const dynamic = "force-dynamic";

/** Riders (PLAN.md §7.2, P3-06): the delivery workspace opened on its riders view. */
export default async function RidersPage() {
  const lock = await currentOrderLock();
  if (lock.ordersLocked) return <OrdersLocked lock={lock} />;
  return (
    <PageContainer>
      <Suspense fallback={<ShippingSkeleton />}>
        <ShippingData view="riders" />
      </Suspense>
    </PageContainer>
  );
}
