import type { FilterFn, RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Human label for the "View" column toggle (defaults to the column id). */
    label?: string;
    /** Other tables (e.g. TableSection) keep their own flags on meta. */
    [key: string]: unknown;
  }
}

/**
 * Client-mode filter for faceted (multi-select) filters. The filter value is
 * a `string[]`; booleans/numbers are compared by their string form so a
 * `{ value: "true" }` option matches a boolean `true` cell.
 */
export const arrayIncludes: FilterFn<unknown> = (row, columnId, filterValue) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  const cell = row.getValue(columnId);
  if (Array.isArray(cell)) {
    return cell.some((value) => filterValue.includes(String(value)));
  }
  return filterValue.includes(String(cell ?? ""));
};
arrayIncludes.autoRemove = (value) => !Array.isArray(value) || value.length === 0;

/** Client-mode date range filter. Filter value: `[fromYYYYMMDD?, toYYYYMMDD?]`. */
export const dateInRange: FilterFn<unknown> = (row, columnId, filterValue) => {
  const [from, to] = (filterValue ?? []) as [string?, string?];
  if (!from && !to) return true;
  const raw = row.getValue(columnId);
  if (!raw) return false;
  const time = new Date(raw as string).getTime();
  if (from && time < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && time > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
};
dateInRange.autoRemove = (value) =>
  !Array.isArray(value) || (!value[0] && !value[1]);

/** Cast helper so typed column defs can use the shared fns without noise. */
export function filterFn<TData>(fn: FilterFn<unknown>): FilterFn<TData> {
  return fn as FilterFn<TData>;
}
