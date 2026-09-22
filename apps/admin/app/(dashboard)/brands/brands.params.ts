import {
  parseTableSearchParams,
  type RawSearchParams,
} from "../_components/data-table/search-params";
import type {
  AdminBrandsQuery,
  AdminBrandsSortId,
} from "@/actions/brands-list";

const SORTABLE: readonly AdminBrandsSortId[] = [
  "name",
  "productCount",
  "averageRating",
  "createdAt",
];

export const BRANDS_DEFAULT_SORT = { id: "name" as const, desc: false };

/** URL search params → `getAdminBrands` query. */
export function parseBrandsParams(searchParams: RawSearchParams): AdminBrandsQuery {
  const query = parseTableSearchParams(searchParams, {
    filters: ["verification", "official", "language"] as const,
    sortable: SORTABLE,
    defaultSort: BRANDS_DEFAULT_SORT,
  });

  return {
    limit: query.pageSize,
    offset: query.offset,
    sort: query.sort,
    search: query.search || undefined,
    ...query.filters,
  };
}
