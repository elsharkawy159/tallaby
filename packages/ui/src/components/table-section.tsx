"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  Table as TanstackTable,
  Updater,
  useReactTable,
  VisibilityState,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  CircleAlertIcon,
  CircleXIcon,
  Columns3Icon,
  ListFilterIcon,
  TrashIcon,
} from "lucide-react";

/** Injected by TableSection itself; always pinned to the left, never reorderable. */
export const FIXED_COLUMN_IDS = ["__index__", "__select__"];

/**
 * Human-readable name for a column — `meta.label` first, then a plain-string
 * header, falling back to the raw id.
 */
export function columnLabel<TData>(column: Column<TData, unknown>): string {
  const metaLabel = (column.columnDef.meta as { label?: string } | undefined)
    ?.label;
  if (metaLabel) return metaLabel;

  const header = column.columnDef.header;
  return typeof header === "string" && header ? header : column.id;
}

/** UI copy for TableSection; English defaults, override per locale. */
export type TableSectionLabels = {
  selectAll: string;
  selectRow: string;
  search: string;
  searchPlaceholder: string;
  clearFilter: string;
  view: string;
  toggleColumns: string;
  delete: string;
  confirmTitle: string;
  confirmDescription: (count: number) => string;
  cancel: string;
  sortAscending: string;
  sortDescending: string;
  clearSort: string;
  noResults: string;
  rowsPerPage: string;
  range: (start: number, end: number, total: number) => string;
  first: string;
  previous: string;
  page: (page: number, pageCount: number) => string;
  next: string;
  last: string;
};

export const defaultTableSectionLabels: TableSectionLabels = {
  selectAll: "Select all",
  selectRow: "Select row",
  search: "Search",
  searchPlaceholder: "Search...",
  clearFilter: "Clear filter",
  view: "View",
  toggleColumns: "Toggle columns",
  delete: "Delete",
  confirmTitle: "Are you absolutely sure?",
  confirmDescription: (count) =>
    `This action cannot be undone. This will permanently delete ${count} selected ${count === 1 ? "row" : "rows"}.`,
  cancel: "Cancel",
  sortAscending: "Sort ascending",
  sortDescending: "Sort descending",
  clearSort: "Clear sort",
  noResults: "No results.",
  rowsPerPage: "Rows per page",
  range: (start, end, total) => `${start}-${end} of ${total}`,
  first: "First",
  previous: "Previous",
  page: (page, pageCount) => `Page ${page} of ${pageCount}`,
  next: "Next",
  last: "Last",
};

export type TableSectionProps<TData extends { id: string }> = {
  rows: TData[];
  columns: ColumnDef<TData, any>[];
  title?: string;
  /**
   * Toolbar slot. Pass a function to receive the table instance — needed by
   * anything that reads or writes column state (column manager, export).
   */
  buttons?: React.ReactNode | ((table: TanstackTable<TData>) => React.ReactNode);
  onDeleteSelected?: (ids: string[]) => Promise<void> | void;
  searchColumnId?: string; // defaults to first column accessor
  pageSizeOptions?: number[];
  /** Optional controlled column visibility. Falls back to internal state. */
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  /** Optional controlled column order (excluding the fixed columns). */
  columnOrder?: string[];
  onColumnOrderChange?: (order: string[]) => void;
  /** Hide the built-in "View" popover when the page provides its own column UI. */
  hideViewOptions?: boolean;
  /** Localized UI copy; any label left out keeps its English default. */
  labels?: Partial<TableSectionLabels>;
};

export function TableSection<TData extends { id: string }>(
  props: TableSectionProps<TData>
) {
  const {
    rows,
    columns: userColumns,
    buttons,
    onDeleteSelected,
    searchColumnId,
    pageSizeOptions = [10, 50, 100, 500],
    columnVisibility: controlledVisibility,
    onColumnVisibilityChange,
    columnOrder: controlledOrder,
    onColumnOrderChange,
    hideViewOptions = false,
  } = props;
  const labels = { ...defaultTableSectionLabels, ...props.labels };

  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<TData[]>(rows);
  useEffect(() => setData(rows), [rows]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalVisibility, setInternalVisibility] = useState<VisibilityState>(
    {}
  );
  const [internalOrder, setInternalOrder] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columnVisibility = controlledVisibility ?? internalVisibility;
  const handleVisibilityChange = (updater: Updater<VisibilityState>) => {
    const next =
      typeof updater === "function" ? updater(columnVisibility) : updater;
    if (onColumnVisibilityChange) onColumnVisibilityChange(next);
    else setInternalVisibility(next);
  };

  const userOrder = controlledOrder ?? internalOrder;
  // The table needs the fixed columns listed first, but callers only ever
  // manage their own columns.
  const columnOrder = useMemo<ColumnOrderState>(
    () =>
      userOrder.length
        ? [
            ...FIXED_COLUMN_IDS,
            ...userOrder.filter((columnId) => !FIXED_COLUMN_IDS.includes(columnId)),
          ]
        : [],
    [userOrder]
  );
  const handleOrderChange = (updater: Updater<ColumnOrderState>) => {
    const next = typeof updater === "function" ? updater(columnOrder) : updater;
    const stripped = next.filter(
      (columnId) => !FIXED_COLUMN_IDS.includes(columnId)
    );
    if (onColumnOrderChange) onColumnOrderChange(stripped);
    else setInternalOrder(stripped);
  };

  // Index column (always first)
  const indexColumn: ColumnDef<TData, any> = {
    id: "__index__",
    size: 30,
    header: () => <span>#</span>,
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      return <span>{pageIndex * pageSize + row.index + 1}</span>;
    },
    enableSorting: false,
    enableHiding: false,
    meta: { isIndex: true },
  };

  // Insert the select column as the second column
  const selectColumn: ColumnDef<TData, any> = {
    id: "__select__",
    size: 30,
    header: ({ table }) => (
      <Checkbox
        aria-label={labels.selectAll}
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={labels.selectRow}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: { isSelect: true },
  };

  // Memoize columns so index is first and select is second
  const columns = useMemo(() => {
    // Remove any user-provided index/select to prevent duplicates and enforce order
    const cleaned = userColumns.filter(
      (c) => (c as any).id !== "__index__" && (c as any).id !== "__select__"
    );
    return [indexColumn, selectColumn, ...cleaned];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userColumns, labels.selectAll, labels.selectRow]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: handleVisibilityChange,
    onColumnOrderChange: handleOrderChange,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
      pagination,
    },
    enableRowSelection: true,
  });

  const primarySearchColumnId = useMemo(() => {
    if (searchColumnId) return searchColumnId;
    // Skip the index and select columns for search
    const first = table
      .getAllLeafColumns()
      .find((col) => col.id !== "__select__" && col.id !== "__index__")?.id;
    return first;
  }, [table, searchColumnId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className="peer min-w-60 ps-9"
              value={
                (primarySearchColumnId
                  ? (table
                      .getColumn(primarySearchColumnId)
                      ?.getFilterValue() as string)
                  : "") || ""
              }
              onChange={(e) =>
                primarySearchColumnId &&
                table
                  .getColumn(primarySearchColumnId)
                  ?.setFilterValue(e.target.value)
              }
              placeholder={labels.searchPlaceholder}
              type="text"
              aria-label={labels.search}
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
              <ListFilterIcon size={16} aria-hidden="true" />
            </div>
            {Boolean(
              primarySearchColumnId &&
                table.getColumn(primarySearchColumnId)?.getFilterValue()
            ) && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md outline-none focus:z-10 focus-visible:ring-[3px]"
                aria-label={labels.clearFilter}
                onClick={() => {
                  primarySearchColumnId &&
                    table.getColumn(primarySearchColumnId)?.setFilterValue("");
                  inputRef.current?.focus();
                }}
              >
                <CircleXIcon size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {!hideViewOptions && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Columns3Icon
                    className="-ms-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  {labels.view}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto min-w-36 p-3" align="start">
                <div className="space-y-2">
                  <div className="text-muted-foreground text-xs font-medium">
                    {labels.toggleColumns}
                  </div>
                  <div className="space-y-2">
                    {table
                      .getAllLeafColumns()
                      .filter((c) => c.getCanHide())
                      .map((column) => (
                        <div key={column.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`${id}-${column.id}`}
                            checked={column.getIsVisible()}
                            onCheckedChange={(v) => column.toggleVisibility(!!v)}
                          />
                          <Label htmlFor={`${id}-${column.id}`}>
                            {columnLabel(column)}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="flex items-center gap-3">
          {table.getSelectedRowModel().rows.length > 0 && onDeleteSelected && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="ms-auto" variant="destructive">
                  <TrashIcon
                    className="-ms-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  {labels.delete}
                  <span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                    {table.getSelectedRowModel().rows.length}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                    aria-hidden="true"
                  >
                    <CircleAlertIcon className="opacity-80" size={16} />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{labels.confirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {labels.confirmDescription(
                        table.getSelectedRowModel().rows.length
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      const ids = table
                        .getSelectedRowModel()
                        .rows.map((r) => r.original.id);
                      await onDeleteSelected?.(ids);
                      table.resetRowSelection();
                    }}
                  >
                    {labels.delete}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {typeof buttons === "function" ? buttons(table) : buttons}
        </div>
      </div>

      <div className="bg-card overflow-hidden rounded-md border border-border">
        <Table className="">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className="h-12"
                    aria-sort={
                      header.column.getIsSorted()
                        ? header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex h-full w-full items-center gap-2 select-none"
                        title={
                          header.column.getIsSorted() === "asc"
                            ? labels.sortDescending
                            : header.column.getIsSorted() === "desc"
                              ? labels.clearSort
                              : labels.sortAscending
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        <span
                          className="text-muted-foreground/70"
                          aria-hidden="true"
                        >
                          {header.column.getIsSorted() === "asc"
                            ? "▲"
                            : header.column.getIsSorted() === "desc"
                              ? "▼"
                              : "↕"}
                        </span>
                      </button>
                    ) : (
                      <div className="flex h-full items-center justify-between gap-2 select-none">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-middle">
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {labels.noResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {labels.rowsPerPage}
          </span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Range summary */}
        <div className="text-sm text-muted-foreground">
          {(() => {
            const { pageIndex, pageSize } = table.getState().pagination;
            const totalRows = table.getFilteredRowModel().rows.length;
            if (totalRows === 0) return labels.range(0, 0, 0);
            const start = pageIndex * pageSize + 1;
            const end = Math.min(
              start + table.getRowModel().rows.length - 1,
              totalRows
            );
            return labels.range(start, end, totalRows);
          })()}
        </div>

        {/* Pager */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {labels.first}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {labels.previous}
          </Button>
          <div className="text-sm text-muted-foreground px-2">
            {labels.page(
              table.getState().pagination.pageIndex + 1,
              table.getPageCount() || 1
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {labels.next}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            {labels.last}
          </Button>
        </div>
      </div>
    </div>
  );
}
