import { FiltersBar } from "./_components/filters-bar";
import { ListPagination } from "./_components/list-pagination";
import { OrdersTable } from "./_components/orders-table";
import { parseFilters } from "./orders.dto";
import {
  getActiveProviders,
  getRiders,
  getShippingOrders,
} from "./orders.server";

interface OrdersDataProps {
  searchParams: Record<string, string | undefined>;
}

export async function OrdersData({ searchParams }: OrdersDataProps) {
  const filters = parseFilters(searchParams);

  const [ordersResult, providersResult, ridersResult] = await Promise.all([
    getShippingOrders(filters),
    getActiveProviders(),
    getRiders(),
  ]);

  if (!ordersResult.success) {
    return (
      <p className="text-sm text-destructive">
        {ordersResult.error ?? "Failed to load shipping orders"}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <FiltersBar
        providers={providersResult.data}
        riders={ridersResult.data}
      />
      <OrdersTable rows={ordersResult.data} />
      <ListPagination
        page={filters.page}
        pageSize={filters.pageSize}
        totalCount={ordersResult.totalCount}
        baseParams={searchParams}
      />
    </div>
  );
}
