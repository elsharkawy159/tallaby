import {
  parseDateParam,
  parseTableSearchParams,
  type RawSearchParams,
} from "../_components/data-table/search-params";
import type { SellersQuery, SellersSortId } from "./sellers.server";

const SORTABLE: readonly SellersSortId[] = [
  "joinDate",
  "businessName",
  "productCount",
  "storeRating",
  "walletBalance",
];

export const SELLERS_DEFAULT_SORT = { id: "joinDate" as const, desc: true };

/** URL search params → `getSellers` query. */
export function parseSellersParams(searchParams: RawSearchParams): SellersQuery {
  const query = parseTableSearchParams(searchParams, {
    filters: [
      "status",
      "businessType",
      "verification",
      "commission",
      "delivery",
    ] as const,
    sortable: SORTABLE,
    defaultSort: SELLERS_DEFAULT_SORT,
  });

  return {
    limit: query.pageSize,
    offset: query.offset,
    sort: query.sort,
    search: query.search || undefined,
    ...query.filters,
    joinedFrom: parseDateParam(searchParams.joinedFrom),
    joinedTo: parseDateParam(searchParams.joinedTo, true),
  };
}
