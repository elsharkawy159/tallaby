import { Suspense } from "react";

import { OrdersData } from "./orders.data";
import { OrdersSkeleton } from "./orders.skeleton";
import type { OrdersPageProps } from "./orders.types";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shipping Orders</h1>
        <p className="text-sm text-muted-foreground">
          Physical orders that need a courier.
        </p>
      </div>

      {/* Keyed on the filters so a filter change re-suspends and shows the
          skeleton instead of freezing the previous page's rows. */}
      <Suspense
        key={new URLSearchParams(
          Object.entries(params).filter(([, value]) => Boolean(value)) as [string, string][]
        ).toString()}
        fallback={<OrdersSkeleton />}
      >
        <OrdersData searchParams={params} />
      </Suspense>
    </div>
  );
}
