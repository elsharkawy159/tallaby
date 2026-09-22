import {
  parseDateParam,
  parseTableSearchParams,
  type RawSearchParams,
} from "../_components/data-table/search-params";
import type {
  AdminOrdersQuery,
  AdminOrdersSortId,
} from "@/actions/orders-list";

const SORTABLE: readonly AdminOrdersSortId[] = [
  "createdAt",
  "totalAmount",
  "orderNumber",
];

export const ORDERS_DEFAULT_SORT = { id: "createdAt" as const, desc: true };

/** Tabs are presets over the `status` filter param. */
export const ORDER_TABS: ReadonlyArray<{
  value: string;
  label: string;
  statuses: readonly string[];
}> = [
  { value: "all", label: "All Orders", statuses: [] },
  { value: "pending", label: "Pending", statuses: ["pending", "payment_processing"] },
  { value: "processing", label: "Processing", statuses: ["confirmed", "shipping_soon"] },
  { value: "shipped", label: "Shipped", statuses: ["shipped", "out_for_delivery"] },
  { value: "delivered", label: "Delivered", statuses: ["delivered"] },
  { value: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
  {
    value: "returns",
    label: "Returns & refunds",
    statuses: ["refund_requested", "refunded", "returned"],
  },
];

/** URL search params → `getAdminOrders` query. */
export function parseOrdersParams(searchParams: RawSearchParams): AdminOrdersQuery {
  const query = parseTableSearchParams(searchParams, {
    filters: ["status", "paymentStatus", "paymentMethod", "source"] as const,
    sortable: SORTABLE,
    defaultSort: ORDERS_DEFAULT_SORT,
  });

  return {
    limit: query.pageSize,
    offset: query.offset,
    sort: query.sort,
    search: query.search || undefined,
    ...query.filters,
    createdFrom: parseDateParam(searchParams.createdFrom),
    createdTo: parseDateParam(searchParams.createdTo, true),
  };
}
