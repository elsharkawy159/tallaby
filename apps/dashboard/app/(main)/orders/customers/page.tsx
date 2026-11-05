import { Suspense } from "react";
import { currentOrderLock } from "@/lib/auth/require-seller.server";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { PageContainer } from "@/components/seller-ui";
import { ListPageSkeleton } from "../orders-page-frame";
import { CustomersData } from "./customers.data";

// Per-seller data read from the session cookie; personal data, never cached.
export const dynamic = "force-dynamic";

type Params = Record<"store" | "q" | "filter" | "sort" | "tag" | "page" | "size", string | string[] | undefined>;

/** Orders › Customers: one row per customer of a store, from its orders (ROADMAP.md F-01). */
export default async function CustomersPage({ searchParams }: { searchParams: Promise<Partial<Params>> }) {
  const lock = await currentOrderLock();
  if (lock.locked) return <OrdersLocked lock={lock} />;
  const params = await searchParams;
  return (
    <PageContainer>
      <Suspense fallback={<ListPageSkeleton />}>
        <CustomersData storeId={typeof params.store === "string" ? params.store : null} searchParams={params} />
      </Suspense>
    </PageContainer>
  );
}
