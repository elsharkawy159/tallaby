import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { ListPageSkeleton, OrdersPageFrame } from "../orders-page-frame";
import { PendingCartsData } from "./pending-carts.data";

// Per-seller data read from the session cookie; personal data, never cached.
export const dynamic = "force-dynamic";

type Params = Partial<Record<"store" | "page" | "size", string | string[]>>;

/** Orders › Pending carts: customers with items in the cart of a store (ROADMAP.md F-67). */
export default async function PendingCartsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const lock = await currentOrderLock();
  if (lock.ordersLocked) return <OrdersLocked lock={lock} />;
  const params = await searchParams;
  return (
    <OrdersPageFrame>
      <Suspense fallback={<ListPageSkeleton />}>
        <PendingCartsData storeId={typeof params.store === "string" ? params.store : null} searchParams={params} />
      </Suspense>
    </OrdersPageFrame>
  );
}
