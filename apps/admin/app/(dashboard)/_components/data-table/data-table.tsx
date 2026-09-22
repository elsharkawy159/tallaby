"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type SortingState,
  type Table as TanstackTable,
  type Updater,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { cn } from "@workspace/ui/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { arrayIncludes, dateInRange, filterFn } from "./filter-fns";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_PARAM,
  PAGE_PARAM,
  SEARCH_PARAM,
  SORT_PARAM,
  parseSort,
  serializeSort,
} from "./search-params";
import { useTableUrlState } from "./use-table-url-state";
import type {
  DataTableFilter,
  DataTableSearchableColumn,
  DataTableServerOptions,
} from "./data-table.types";

export type { DataTableFilter } from "./data-table.types";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Faceted / select / date-range filters shown in the toolbar. */
  filterableColumns?: DataTableFilter[];
  /** Client mode: columns matched by the search box. */
  searchableColumns?: DataTableSearchableColumn[];
  defaultVisibility?: VisibilityState;
  /**
   * Server mode: the page already holds one page of rows filtered by the URL.
   * Pagination, sort, search and filters are written to the URL and the
   * server page re-renders with them.
   */
  serverSide?: DataTableServerOptions;
  getRowId?: (row: TData, index: number) => string;
  /** Extra toolbar content (right side, before "View"). */
  toolbarActions?: ReactNode;
  pageSizeOptions?: readonly number[];
  enableRowSelection?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
  /** Shown above the table while rows are selected. */
  bulkActions?: (selectedRows: TData[], clearSelection: () => void) => ReactNode;
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  return props.serverSide ? (
    <ServerDataTable {...props} serverSide={props.serverSide} />
  ) : (
    <ClientDataTable {...props} />
  );
}

function dateRangeKeys(id: string) {
  return [`${id}From`, `${id}To`] as const;
}

/** Filterable columns always use the shared array/date filter fns. */
function withFilterFns<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
  filters: DataTableFilter[]
): ColumnDef<TData, TValue>[] {
  if (!filters.length) return columns;
  const byId = new Map(filters.map((filter) => [filter.id, filter]));
  return columns.map((column) => {
    const id =
      column.id ??
      ("accessorKey" in column ? String(column.accessorKey) : undefined);
    const filter = id ? byId.get(id) : undefined;
    if (!filter) return column;
    return {
      ...column,
      filterFn: filterFn<TData>(
        filter.type === "dateRange" ? dateInRange : arrayIncludes
      ),
    };
  });
}

function ClientDataTable<TData, TValue>({
  columns,
  data,
  filterableColumns = [],
  searchableColumns = [],
  defaultVisibility = {},
  getRowId,
  toolbarActions,
  pageSizeOptions,
  enableRowSelection = true,
  emptyMessage,
  isLoading,
  bulkActions,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(defaultVisibility);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSizeOptions?.[0] ?? DEFAULT_PAGE_SIZE,
  });

  const resolvedColumns = useMemo(
    () => withFilterFns(columns, filterableColumns),
    [columns, filterableColumns]
  );

  const searchIds = useMemo(
    () => searchableColumns.map((column) => column.id),
    [searchableColumns]
  );

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    getRowId,
    enableRowSelection,
    // Keep the current page when rows are updated in place (approve, edit…).
    autoResetPageIndex: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    onGlobalFilterChange: (value) => {
      setGlobalFilter(value);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row: Row<TData>, _columnId, filterValue: string) => {
      const needle = filterValue.trim().toLowerCase();
      if (!needle) return true;
      return searchIds.some((id) =>
        String(row.getValue(id) ?? "")
          .toLowerCase()
          .includes(needle)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Clamp when rows shrink below the current page (e.g. after a delete).
  const pageCount = table.getPageCount();
  if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) {
    setPagination((prev) => ({ ...prev, pageIndex: Math.max(pageCount - 1, 0) }));
  }

  const isFiltered = columnFilters.length > 0 || Boolean(globalFilter);

  return (
    <DataTableShell
      table={table}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      bulkActions={bulkActions}
      toolbar={
        <DataTableToolbar
          table={table}
          search={
            searchableColumns.length
              ? {
                  value: globalFilter,
                  onChange: (value) => table.setGlobalFilter(value),
                  placeholder: `Search ${searchableColumns
                    .map((column) => column.title.toLowerCase())
                    .join(", ")}…`,
                }
              : null
          }
          filters={filterableColumns}
          getFilterValue={(filter) =>
            (findColumn(table, filter.id)?.getFilterValue() as string[]) ?? []
          }
          setFilterValue={(filter, values) =>
            findColumn(table, filter.id)?.setFilterValue(values.some(Boolean) ? values : undefined)
          }
          getFacets={(filter) =>
            findColumn(table, filter.id)?.getFacetedUniqueValues()
          }
          isFiltered={isFiltered}
          onReset={() => {
            table.resetColumnFilters();
            table.setGlobalFilter("");
          }}
          actions={toolbarActions}
        />
      }
      pagination={
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      }
    />
  );
}

function ServerDataTable<TData, TValue>({
  columns,
  data,
  filterableColumns = [],
  defaultVisibility = {},
  serverSide,
  getRowId,
  toolbarActions,
  pageSizeOptions,
  enableRowSelection = true,
  emptyMessage,
  isLoading,
  bulkActions,
}: DataTableProps<TData, TValue> & { serverSide: DataTableServerOptions }) {
  const url = useTableUrlState();
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(defaultVisibility);

  const defaultPageSize = serverSide.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const pageSize = Number(url.get(PAGE_SIZE_PARAM)) || defaultPageSize;
  const pageIndex = Math.max(Number(url.get(PAGE_PARAM)) || 1, 1) - 1;
  const pagination: PaginationState = { pageIndex, pageSize };

  const urlSort = parseSort(url.get(SORT_PARAM));
  const activeSort = urlSort ?? serverSide.defaultSort ?? null;
  const sorting: SortingState = activeSort ? [activeSort] : [];

  const table: TanstackTable<TData> = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, pagination },
    getRowId,
    enableRowSelection,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    rowCount: serverSide.rowCount,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater: Updater<PaginationState>) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      if (next.pageSize !== pagination.pageSize) {
        url.setParams({
          [PAGE_SIZE_PARAM]:
            next.pageSize === defaultPageSize ? null : next.pageSize,
        });
      } else {
        url.setParams(
          { [PAGE_PARAM]: next.pageIndex > 0 ? next.pageIndex + 1 : null },
          { resetPage: false }
        );
      }
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      url.setParams({ [SORT_PARAM]: serializeSort(next[0] ?? null) });
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const filterKeys = filterableColumns.flatMap((filter) =>
    filter.type === "dateRange" ? [...dateRangeKeys(filter.id)] : [filter.id]
  );
  const search = url.get(SEARCH_PARAM);
  const isFiltered =
    Boolean(search) || filterKeys.some((key) => Boolean(url.get(key)));

  return (
    <DataTableShell
      table={table}
      isLoading={isLoading || url.isPending}
      emptyMessage={emptyMessage}
      bulkActions={bulkActions}
      toolbar={
        <DataTableToolbar
          table={table}
          search={
            serverSide.searchPlaceholder
              ? {
                  value: search,
                  onChange: (value) =>
                    url.setParams({ [SEARCH_PARAM]: value.trim() || null }),
                  placeholder: serverSide.searchPlaceholder,
                  debounceMs: 350,
                }
              : null
          }
          filters={filterableColumns}
          getFilterValue={(filter) =>
            filter.type === "dateRange"
              ? dateRangeKeys(filter.id).map((key) => url.get(key))
              : url.getList(filter.id)
          }
          setFilterValue={(filter, values) => {
            if (filter.type === "dateRange") {
              const [fromKey, toKey] = dateRangeKeys(filter.id);
              url.setParams({ [fromKey]: values[0], [toKey]: values[1] });
            } else {
              url.setParams({ [filter.id]: values });
            }
          }}
          isFiltered={isFiltered}
          onReset={() => url.reset([SEARCH_PARAM, ...filterKeys])}
          actions={toolbarActions}
        />
      }
      pagination={
        <DataTablePagination
          table={table}
          rowCount={serverSide.rowCount}
          pageSizeOptions={pageSizeOptions}
        />
      }
    />
  );
}

function DataTableShell<TData>({
  table,
  toolbar,
  pagination,
  isLoading,
  emptyMessage = "No results found.",
  bulkActions,
}: {
  table: TanstackTable<TData>;
  toolbar: ReactNode;
  pagination: ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  bulkActions?: (selectedRows: TData[], clearSelection: () => void) => ReactNode;
}) {
  const rows = table.getRowModel().rows;
  const selectedRows = table.getSelectedRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length || 1;

  return (
    <div className="space-y-4">
      {toolbar}
      {bulkActions && selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <span className="font-medium">{selectedRows.length} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {bulkActions(
              selectedRows.map((row) => row.original),
              () => table.resetRowSelection()
            )}
          </div>
        </div>
      )}
      <div
        className={cn(
          "rounded-md border border-border bg-card shadow-sm transition-opacity",
          isLoading && "pointer-events-none opacity-60"
        )}
        aria-busy={isLoading || undefined}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pagination}
    </div>
  );
}

/** `table.getColumn` logs in dev for unknown ids; filters may reference none. */
function findColumn<TData>(table: TanstackTable<TData>, id: string) {
  return table.getAllLeafColumns().find((column) => column.id === id);
}
