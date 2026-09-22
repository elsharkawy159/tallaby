import {
  parseDateParam,
  parseTableSearchParams,
  pickAllowed,
  type RawSearchParams,
} from "../_components/data-table/search-params";
import type {
  AdminCustomersQuery,
  AdminCustomersSortId,
  CustomersView,
} from "@/actions/customers-list";

export const CUSTOMERS_VIEW_PARAM = "view";

const VIEWS: readonly CustomersView[] = [
  "all",
  "high-value",
  "new",
  "unverified",
  "suspended",
];

const SORTABLE: readonly AdminCustomersSortId[] = [
  "createdAt",
  "fullName",
  "totalOrders",
  "totalSpent",
  "lastOrderDate",
  "lastLoginAt",
];

export const CUSTOMERS_DEFAULT_SORT = { id: "createdAt" as const, desc: true };

/** URL search params → `getAdminCustomers` query. */
export function parseCustomersParams(
  searchParams: RawSearchParams
): AdminCustomersQuery {
  const query = parseTableSearchParams(searchParams, {
    filters: ["role", "verification", "accountStatus", "account"] as const,
    sortable: SORTABLE,
    defaultSort: CUSTOMERS_DEFAULT_SORT,
  });
  const [view] = pickAllowed(
    [String(searchParams[CUSTOMERS_VIEW_PARAM] ?? "all")],
    VIEWS
  );

  return {
    limit: query.pageSize,
    offset: query.offset,
    sort: query.sort,
    search: query.search || undefined,
    view: view ?? "all",
    ...query.filters,
    createdFrom: parseDateParam(searchParams.createdFrom),
    createdTo: parseDateParam(searchParams.createdTo, true),
  };
}
