"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  SORT_PARAM,
  nextSort,
  parseSortParam,
  serializeSort,
  sortRows,
  type SortValue,
  type TableSort,
} from "./admin-table.lib";

export interface AdminTableColumn {
  id: string;
  header: ReactNode;
  /** Shows a sort toggle on the header. */
  sortable?: boolean;
  /** First click sorts descending (dates, counts, money). */
  descFirst?: boolean;
  align?: "start" | "end";
  className?: string;
}

export interface AdminTableRow {
  id: string;
  /** Cell content by column id. Built on the server; may hold client components. */
  cells: Record<string, ReactNode>;
  /** Raw values for client sorting, by column id. Falls back to the cell when it is text or a number. */
  sortValues?: Record<string, SortValue>;
  className?: string;
}

interface AdminTableProps {
  columns: AdminTableColumn[];
  rows: AdminTableRow[];
  /**
   * `client` (default): rows are the whole list and sort in the browser.
   * `url`: rows are one server page; a header click writes `?sort=` and the
   * server page re-renders in that order (and back to page 1).
   */
  sortMode?: "client" | "url";
  /** The order the rows arrive in (client) or the server default (url). */
  defaultSort?: TableSort | null;
  emptyMessage?: ReactNode;
  className?: string;
}

/** The admin's plain list table: one column config, sortable headers, an empty state. */
export function AdminTable(props: AdminTableProps) {
  return props.sortMode === "url" ? <UrlSortedTable {...props} /> : <ClientSortedTable {...props} />;
}

function ClientSortedTable({ columns, rows, defaultSort = null, ...rest }: AdminTableProps) {
  const [sort, setSort] = useState<TableSort | null>(defaultSort);
  const sorted = useMemo(
    () =>
      sortRows(rows, sort, (row, id) => {
        if (row.sortValues && id in row.sortValues) return row.sortValues[id];
        const cell = row.cells[id];
        return typeof cell === "string" || typeof cell === "number" ? cell : null;
      }),
    [rows, sort],
  );
  return (
    <TableView
      {...rest}
      columns={columns}
      rows={sorted}
      sort={sort}
      renderToggle={(column, label) => (
        <button type="button" onClick={() => setSort(nextSort(sort, column.id, column.descFirst))} className={TOGGLE_CLASS}>
          {label}
        </button>
      )}
    />
  );
}

function UrlSortedTable({ columns, rows, defaultSort = null, ...rest }: AdminTableProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sortable = columns.filter((column) => column.sortable).map((column) => column.id);
  const sort = parseSortParam(searchParams.get(SORT_PARAM), sortable, defaultSort);

  const hrefFor = (column: AdminTableColumn) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(SORT_PARAM, serializeSort(nextSort(sort, column.id, column.descFirst))!);
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  };

  return (
    <TableView
      {...rest}
      columns={columns}
      rows={rows}
      sort={sort}
      renderToggle={(column, label) => (
        <Link href={hrefFor(column)} scroll={false} className={TOGGLE_CLASS}>
          {label}
        </Link>
      )}
    />
  );
}

const TOGGLE_CLASS =
  "-mx-2 inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function TableView({
  columns,
  rows,
  sort,
  renderToggle,
  emptyMessage = "Nothing to show.",
  className,
}: {
  columns: AdminTableColumn[];
  rows: AdminTableRow[];
  sort: TableSort | null;
  renderToggle: (column: AdminTableColumn, label: ReactNode) => ReactNode;
  emptyMessage?: ReactNode;
  className?: string;
}) {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => {
            const active = sort?.id === column.id ? sort : null;
            const Icon = active ? (active.desc ? ArrowDown : ArrowUp) : ChevronsUpDown;
            return (
              <TableHead
                key={column.id}
                aria-sort={active ? (active.desc ? "descending" : "ascending") : undefined}
                className={cn("whitespace-nowrap", column.align === "end" && "text-right", column.className)}
              >
                {column.sortable
                  ? renderToggle(
                      column,
                      <>
                        {column.header}
                        <Icon className={cn("size-3.5", !active && "text-muted-foreground/50")} aria-hidden />
                      </>,
                    )
                  : column.header}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length ? (
          rows.map((row) => (
            <TableRow key={row.id} className={row.className}>
              {columns.map((column) => (
                <TableCell key={column.id} className={cn(column.align === "end" && "text-right", column.className)}>
                  {row.cells[column.id]}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
