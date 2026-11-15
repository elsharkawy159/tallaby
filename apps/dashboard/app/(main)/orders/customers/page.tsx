import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { PageContainer } from "@/components/seller-ui";
import { ListPageSkeleton } from "../orders-page-frame";
import { CustomersData } from "./customers.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

type Params = Record<"store" | "q" | "filter" | "sort" | "tag" | "page" | "size", string | string[] | undefined>;

/** Orders › Customers: one row per customer of a store, from its orders (ROADMAP.md F-01). */
export default async function CustomersPage({ searchParams }: { searchParams: Promise<Partial<Params>> }) {
  const lock = await currentOrderLock();
  if (lock.ordersLocked) return <OrdersLocked lock={lock} />;
  const params = await searchParams;
  return (
    <PageContainer data-clarity-mask="true">
      <Suspense fallback={<ListPageSkeleton />}>
        <CustomersData storeId={typeof params.store === "string" ? params.store : null} searchParams={params} />
      </Suspense>
    </PageContainer>
  );
}
