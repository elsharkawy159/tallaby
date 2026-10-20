/**
 * Sort state for `AdminTable`. Kept free of "use client" so server pages can
 * parse the URL with the same rules the table writes it with.
 *
 * URL shape: `?sort=name.asc` / `?sort=createdAt.desc` (same as the data-table).
 */

export const SORT_PARAM = "sort";

export interface TableSort {
  id: string;
  desc: boolean;
}

export type SortValue = string | number | boolean | null | undefined;

export function serializeSort(sort: TableSort | null | undefined): string | null {
  return sort ? `${sort.id}.${sort.desc ? "desc" : "asc"}` : null;
}

/** `name.desc` → { id: "name", desc: true }. Ids outside `allowed` fall back. */
export function parseSortParam(
  value: string | string[] | null | undefined,
  allowed: readonly string[],
  fallback: TableSort | null = null,
): TableSort | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return fallback;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return fallback;
  const id = raw.slice(0, dot);
  const dir = raw.slice(dot + 1);
  if ((dir !== "asc" && dir !== "desc") || !allowed.includes(id)) return fallback;
  return { id, desc: dir === "desc" };
}

/** Clicking a header: same column flips direction, a new one starts at `descFirst`. */
export function nextSort(current: TableSort | null, id: string, descFirst = false): TableSort {
  if (current?.id === id) return { id, desc: !current.desc };
  return { id, desc: descFirst };
}

/** Empty values always sort last, whatever the direction. */
export function compareSortValues(a: SortValue, b: SortValue, desc: boolean): number {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
  let order: number;
  if (typeof a === "number" && typeof b === "number") order = a - b;
  else if (typeof a === "boolean" && typeof b === "boolean") order = Number(a) - Number(b);
  else order = String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  return desc ? -order : order;
}

/** A sorted copy; equal rows keep their original order. */
export function sortRows<T>(rows: readonly T[], sort: TableSort | null, valueOf: (row: T, id: string) => SortValue): T[] {
  if (!sort) return [...rows];
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => compareSortValues(valueOf(a.row, sort.id), valueOf(b.row, sort.id), sort.desc) || a.index - b.index)
    .map((entry) => entry.row);
}
