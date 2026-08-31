import { getTranslations } from "next-intl/server";

import { FiltersBar } from "./_components/filters-bar";
import { ListPagination } from "./_components/list-pagination";
import { OrdersBoard } from "./_components/orders-board";
import { StageTabs } from "./_components/stage-tabs";
import { parseFilters } from "./orders.dto";
import {
  getActiveProviders,
  getRiders,
  getShippingOrders,
  getStageCounts,
} from "./orders.server";

interface OrdersDataProps {
  searchParams: Record<string, string | undefined>;
}

export async function OrdersData({ searchParams }: OrdersDataProps) {
  const t = await getTranslations("orders");
  const filters = parseFilters(searchParams);

  const [ordersResult, providersResult, ridersResult, stageCountsResult] = await Promise.all([
    getShippingOrders(filters),
    getActiveProviders(),
    getRiders(),
    getStageCounts(),
  ]);

  if (!ordersResult.success) {
    return (
      <p className="text-sm text-destructive">
        {ordersResult.error ?? t("loadError")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <StageTabs
        activeStage={filters.stage}
        counts={
          stageCountsResult.data ?? {
            pending: 0,
            confirmed: 0,
            shipped: 0,
            outForDelivery: 0,
            delivered: 0,
          }
        }
      />
      <FiltersBar
        stage={filters.stage}
        providers={providersResult.data}
        riders={ridersResult.data}
      />
      <OrdersBoard
        rows={ordersResult.data}
        stage={filters.stage}
        filters={filters}
        totalCount={ordersResult.totalCount}
        providers={providersResult.data}
      />
      <ListPagination
        page={filters.page}
        pageSize={filters.pageSize}
        totalCount={ordersResult.totalCount}
        baseParams={searchParams}
      />
    </div>
  );
}
