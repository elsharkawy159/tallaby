import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { PageContainer } from "@/components/seller-ui";
import { ShippingData } from "./shipping.data";
import { ShippingSkeleton } from "./shipping.skeleton";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ShippingPage() {
  const lock = await currentOrderLock();
  if (lock.ordersLocked) return <OrdersLocked lock={lock} />;
  return (
    <PageContainer>
      <Suspense fallback={<ShippingSkeleton />}>
        <ShippingData />
      </Suspense>
    </PageContainer>
  );
}
