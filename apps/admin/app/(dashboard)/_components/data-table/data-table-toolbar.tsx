"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import {
  DataTableDateRangeFilter,
  DataTableSelectFilter,
} from "./data-table-filter-controls";
import { DataTableViewOptions } from "./data-table-view-options";
import type { DataTableFilter } from "./data-table.types";

export interface DataTableSearchControl {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Debounce before `onChange` fires (server search). 0 = immediate. */
  debounceMs?: number;
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  search?: DataTableSearchControl | null;
  filters: DataTableFilter[];
  /** Current value per filter: list for multi/select, [from, to] for dateRange. */
  getFilterValue: (filter: DataTableFilter) => string[];
  setFilterValue: (filter: DataTableFilter, values: string[]) => void;
  /** Row counts per option (client mode). */
  getFacets?: (filter: DataTableFilter) => Map<unknown, number> | undefined;
  isFiltered: boolean;
  onReset: () => void;
  actions?: ReactNode;
}

function SearchInput({
  value,
  onChange,
  placeholder,
  debounceMs = 0,
}: DataTableSearchControl) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebounce(draft, debounceMs);
  const lastSent = useRef(value);

  // Follow external changes (Reset, back button) without clobbering typing.
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    const next = debounceMs ? debounced : draft;
    if (next === lastSent.current) return;
    lastSent.current = next;
    onChange(next);
    // onChange identity changes with every URL update; only react to input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceMs ? debounced : draft]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 w-full pl-8 pr-8"
      />
      {draft && (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setDraft("")}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function DataTableToolbar<TData>({
  table,
  search,
  filters,
  getFilterValue,
  setFilterValue,
  getFacets,
  isFiltered,
  onReset,
  actions,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {search && <SearchInput {...search} />}

        {filters.map((filter) => {
          const values = getFilterValue(filter);

          if (filter.type === "select") {
            return (
              <DataTableSelectFilter
                key={filter.id}
                title={filter.title}
                options={filter.options}
                allLabel={filter.allLabel}
                value={values[0]}
                onChange={(value) =>
                  setFilterValue(filter, value ? [value] : [])
                }
              />
            );
          }

          if (filter.type === "dateRange") {
            return (
              <DataTableDateRangeFilter
                key={filter.id}
                title={filter.title}
                from={values[0] || undefined}
                to={values[1] || undefined}
                onChange={({ from, to }) =>
                  setFilterValue(filter, [from ?? "", to ?? ""])
                }
              />
            );
          }

          return (
            <DataTableFacetedFilter
              key={filter.id}
              title={filter.title}
              options={filter.options}
              selected={values}
              facets={getFacets?.(filter)}
              onChange={(next) => setFilterValue(filter, next)}
            />
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
