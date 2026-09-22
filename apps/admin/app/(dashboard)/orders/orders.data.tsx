import { getOrderStats } from "@/actions/orders";
import { getAdminOrders, getOrderPaymentMethods } from "@/actions/orders-list";
import type { RawSearchParams } from "../_components/data-table/search-params";
import { OrderStatsCards } from "./orders.chunks";
import { OrdersClientWrapper } from "./orders.client";
import { parseOrdersParams } from "./orders.params";
import type { Order } from "./orders.types";

/** Stats + list, loaded sequentially to stay within the serverless DB pool. */
export async function OrdersPageData({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const query = parseOrdersParams(await searchParams);
  const statsResult = await getOrderStats();
  const ordersResult = await getAdminOrders(query);
  const methodsResult = await getOrderPaymentMethods();

  return (
    <div className="space-y-6">
      {statsResult.success && statsResult.data ? (
        <OrderStatsCards stats={statsResult.data} />
      ) : (
        <p className="text-center text-red-600">
          {statsResult.error || "Failed to load order stats"}
        </p>
      )}
      {!ordersResult.success && (
        <p className="text-center text-red-600">
          {ordersResult.error || "Failed to load orders"}
        </p>
      )}
      <OrdersClientWrapper
        orders={(ordersResult.success ? ordersResult.data : []) as Order[]}
        totalCount={ordersResult.success ? ordersResult.totalCount : 0}
        paymentMethods={methodsResult.data}
      />
    </div>
  );
}
