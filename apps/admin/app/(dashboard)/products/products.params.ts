import {
  parseDateParam,
  parseTableSearchParams,
  type RawSearchParams,
} from "../_components/data-table/search-params";
import type {
  AdminProductsQuery,
  AdminProductsSortId,
} from "@/actions/products-list";

export const PRODUCTS_FILTER_KEYS = [
  "status",
  "categoryId",
  "brandId",
  "seller",
  "stock",
  "flags",
] as const;

const SORTABLE: readonly AdminProductsSortId[] = [
  "createdAt",
  "updatedAt",
  "title",
  "price",
  "quantity",
  "averageRating",
];

export const PRODUCTS_DEFAULT_SORT = { id: "createdAt" as const, desc: true };

/** URL search params → `getAdminProducts` query. */
export function parseProductsParams(
  searchParams: RawSearchParams
): AdminProductsQuery {
  const query = parseTableSearchParams(searchParams, {
    filters: PRODUCTS_FILTER_KEYS,
    sortable: SORTABLE,
    defaultSort: PRODUCTS_DEFAULT_SORT,
  });

  return {
    limit: query.pageSize,
    offset: query.offset,
    sort: query.sort,
    // The default view surfaces products awaiting review; an explicit
    // column sort from the table takes over.
    pendingFirst:
      query.sort?.id === PRODUCTS_DEFAULT_SORT.id &&
      query.sort.desc === PRODUCTS_DEFAULT_SORT.desc,
    search: query.search || undefined,
    ...query.filters,
    createdFrom: parseDateParam(searchParams.createdFrom),
    createdTo: parseDateParam(searchParams.createdTo, true),
  };
}
