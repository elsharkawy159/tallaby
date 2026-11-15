import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { ListPageSkeleton, OrdersPageFrame } from "../orders-page-frame";
import { PendingCartsData } from "./pending-carts.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
