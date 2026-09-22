import {
  parseTableSearchParams,
  pickAllowed,
  type RawSearchParams,
} from "../_components/data-table/search-params";
import type {
  PendingCartsQuery,
  PendingCartsSortId,
  PendingCartsView,
} from "@/actions/pending-carts";

export const PENDING_CARTS_VIEW_PARAM = "view";

const VIEWS: readonly PendingCartsView[] = ["all", "with-items", "abandoned"];
const SORTABLE: readonly PendingCartsSortId[] = [
  "lastActivity",
  "createdAt",
  "itemCount",
  "totalValue",
];

export const PENDING_CARTS_DEFAULT_SORT = {
  id: "lastActivity" as const,
  desc: true,
};

/** URL search params → `getPendingCarts` query. */
export function parsePendingCartsParams(
  searchParams: RawSearchParams
): PendingCartsQuery {
  const query = parseTableSearchParams(searchParams, {
    filters: ["reminder", "customer", "marketing"] as const,
    sortable: SORTABLE,
    defaultSort: PENDING_CARTS_DEFAULT_SORT,
  });
  const view = pickAllowed(
    [String(searchParams[PENDING_CARTS_VIEW_PARAM] ?? "all")],
    VIEWS
  )[0];

  return {
    limit: query.pageSize,
    offset: query.offset,
    sort: query.sort,
    search: query.search || undefined,
    view: view ?? "all",
    reminder: query.filters.reminder,
    customer: query.filters.customer,
    marketing: query.filters.marketing,
  };
}
