import type { ComponentType } from "react";

export interface DataTableFilterOption {
  value: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

interface DataTableFilterBase {
  /**
   * Column id in client mode; URL param key in server mode. For date ranges
   * in server mode the params are `${id}From` / `${id}To` (YYYY-MM-DD).
   */
  id: string;
  title: string;
}

export type DataTableFilter =
  | (DataTableFilterBase & {
      /** Multi-select popover (default). */
      type?: "multi";
      options: DataTableFilterOption[];
    })
  | (DataTableFilterBase & {
      /** Single-choice dropdown with an "All" entry. */
      type: "select";
      options: DataTableFilterOption[];
      allLabel?: string;
    })
  | (DataTableFilterBase & {
      type: "dateRange";
    });

export interface DataTableSearchableColumn {
  id: string;
  title: string;
}

export interface DataTableServerOptions {
  /** Total rows matching the current filters (for page count + "of N"). */
  rowCount: number;
  /** Must match the `defaultPageSize` passed to `parseTableSearchParams`. */
  defaultPageSize?: number;
  /** Sort shown when the URL has none; must match the server default. */
  defaultSort?: { id: string; desc: boolean } | null;
  /** Placeholder for the server search box (param: `search`). */
  searchPlaceholder?: string;
}
