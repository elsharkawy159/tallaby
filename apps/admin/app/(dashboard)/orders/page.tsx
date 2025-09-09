import { Suspense } from "react";
import { OrdersClientWrapper } from "./orders.client";
import { OrdersDataWrapper } from "./orders.data";
import { OrdersSkeleton } from "./orders.skeleton";

interface OrdersPageProps {
  searchParams?: Promise<{
    status?: string;
    paymentStatus?: string;
    search?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;

  const filters = {
    status: params?.status,
    paymentStatus: params?.paymentStatus,
    search: params?.search,
  };

  return (
    <div className="space-y-6">
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersDataWrapper filters={filters} />
      </Suspense>

      <OrdersClientWrapper filters={filters} />
    </div>
  );
}
