import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { PageContainer } from "@/components/seller-ui";
import { ShippingData } from "./shipping.data";
import { ShippingSkeleton } from "./shipping.skeleton";

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = "force-dynamic";

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
