import { Suspense } from "react";
import { getAllOrders, getOrderStats } from "@/actions/orders";
import { OrderStatsCards } from "./orders.chunks";
import { OrdersSkeleton } from "./orders.skeleton";

interface OrdersDataProps {
  filters?: {
    status?: string;
    paymentStatus?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  };
}

export const OrdersData = async ({ filters }: OrdersDataProps) => {
  const [ordersResult, statsResult] = await Promise.all([
    getAllOrders(filters),
    getOrderStats(),
  ]);

  if (!ordersResult.success || !statsResult.success) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">
          {ordersResult.error || statsResult.error || "Failed to load orders"}
        </p>
      </div>
    );
  }

  return (
    <>
      {statsResult.data && <OrderStatsCards stats={statsResult.data} />}
      <div className="text-sm text-gray-600 mb-4">
        Showing {ordersResult.data?.length || 0} of{" "}
        {ordersResult.totalCount || 0} orders
      </div>
    </>
  );
};

interface OrdersDataWrapperProps {
  filters?: {
    status?: string;
    paymentStatus?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  };
}

export const OrdersDataWrapper = ({ filters }: OrdersDataWrapperProps) => {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersData filters={filters} />
    </Suspense>
  );
};
