import {
  parseTableSearchParams,
  type RawSearchParams,
} from "../_components/data-table/search-params";
import type {
  AdminCouponsQuery,
  AdminCouponsSortId,
} from "@/actions/coupons";

const SORTABLE: readonly AdminCouponsSortId[] = [
  "createdAt",
  "code",
  "discountValue",
  "usageCount",
  "expiresAt",
];

export const COUPONS_DEFAULT_SORT = { id: "createdAt" as const, desc: true };

/** URL search params → `getAdminCoupons` query. */
export function parseCouponsParams(searchParams: RawSearchParams): AdminCouponsQuery {
  const query = parseTableSearchParams(searchParams, {
    filters: ["state", "type"] as const,
    sortable: SORTABLE,
    defaultSort: COUPONS_DEFAULT_SORT,
  });

  return {
    limit: query.pageSize,
    offset: query.offset,
    sort: query.sort,
    search: query.search || undefined,
    ...query.filters,
  };
}
