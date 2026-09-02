import { getTranslations } from "next-intl/server";

import { FiltersBar } from "./_components/filters-bar";
import { ListPagination } from "./_components/list-pagination";
import { OrdersAllSections } from "./_components/orders-all-sections";
import { OrdersBoard } from "./_components/orders-board";
import { StageTabs } from "./_components/stage-tabs";
import { getAutomationSettings } from "./automation.server";
import { parseFilters } from "./orders.dto";
import {
  getActiveProviders,
  getAllStageOrders,
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
  const isAllView = filters.stage === "all";

  const [ordersResult, allStagesResult, providersResult, ridersResult, stageCountsResult, automationResult] =
    await Promise.all([
      isAllView ? Promise.resolve(null) : getShippingOrders(filters),
      isAllView ? getAllStageOrders(filters) : Promise.resolve(null),
      getActiveProviders(),
      getRiders(),
      getStageCounts(),
      getAutomationSettings(),
    ]);

  if (isAllView) {
    if (!allStagesResult?.success || !allStagesResult.data) {
      return (
        <p className="text-sm text-destructive">
          {allStagesResult?.error ?? t("loadError")}
        </p>
      );
    }
  } else if (!ordersResult?.success) {
    return (
      <p className="text-sm text-destructive">
        {ordersResult?.error ?? t("loadError")}
      </p>
    );
  }

  const stageCounts =
    stageCountsResult.data ?? {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      outForDelivery: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0,
      returned: 0,
    };

  const providers = providersResult.data;
  const riders = ridersResult.data;
  const automation =
    automationResult.data ?? {
      autoConfirm: false,
      autoAssign: false,
      autoAssignProviderId: null,
    };

  return (
    <div className="space-y-4">
      <StageTabs activeStage={filters.stage} counts={stageCounts} />
      <FiltersBar providers={providers} riders={riders} />
      {isAllView && allStagesResult?.data ? (
        <OrdersAllSections
          sections={allStagesResult.data}
          filters={filters}
          providers={providers}
          automation={automation}
        />
      ) : (
        <>
          <OrdersBoard
            rows={ordersResult!.data}
            stage={filters.stage}
            filters={filters}
            totalCount={ordersResult!.totalCount}
            providers={providers}
            automation={automation}
          />
          <ListPagination
            page={filters.page}
            pageSize={filters.pageSize}
            totalCount={ordersResult!.totalCount}
            baseParams={searchParams}
          />
        </>
      )}
    </div>
  );
}
