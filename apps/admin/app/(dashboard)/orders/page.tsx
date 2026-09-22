import { Suspense } from "react";
import type { RawSearchParams } from "../_components/data-table/search-params";
import { OrdersPageData } from "./orders.data";
import { OrdersSkeleton } from "./orders.skeleton";

export const dynamic = "force-dynamic";

interface OrdersPageProps {
  searchParams: Promise<RawSearchParams>;
}

export default function OrdersPage({ searchParams }: OrdersPageProps) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersPageData searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
