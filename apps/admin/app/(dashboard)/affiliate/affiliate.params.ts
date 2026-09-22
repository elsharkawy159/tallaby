import {
  parseDateParam,
  parseTableSearchParams,
  pickAllowed,
  type RawSearchParams,
} from "../_components/data-table/search-params";
import type { AffiliateFilters, AffiliateSortId } from "@/actions/affiliates";

const SORTABLE: readonly AffiliateSortId[] = [
  "createdAt",
  "totalOrders",
  "deliveredOrders",
  "pendingProfit",
  "totalProfit",
  "walletBalance",
];

export const AFFILIATES_DEFAULT_SORT = { id: "createdAt" as const, desc: true };

/** URL search params → `getAffiliates` filters (unknown values are dropped). */
export function parseAffiliateParams(
  searchParams: RawSearchParams
): AffiliateFilters {
  const query = parseTableSearchParams(searchParams, {
    filters: ["status", "performance", "earnings"] as const,
    sortable: SORTABLE,
    defaultSort: AFFILIATES_DEFAULT_SORT,
  });

  return {
    limit: query.pageSize,
    offset: query.offset,
    sort: query.sort,
    search: query.search || undefined,
    status: pickAllowed(query.filters.status, ["active", "inactive"] as const),
    performance: pickAllowed(query.filters.performance, [
      "has_orders",
      "no_orders",
      "has_delivered",
    ] as const)[0],
    earnings: pickAllowed(query.filters.earnings, [
      "has_pending",
      "has_earned",
    ] as const)[0],
    createdFrom: parseDateParam(searchParams.createdFrom),
    createdTo: parseDateParam(searchParams.createdTo, true),
  };
}
