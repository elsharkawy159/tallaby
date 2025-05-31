"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { Search, X } from "lucide-react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterableColumns?: {
    id: string;
    title: string;
    options: {
      value: string;
      label: string;
    }[];
  }[];
  searchableColumns?: {
    id: string;
    title: string;
  }[];
}

export function DataTableToolbar<TData>({
  table,
  filterableColumns = [],
  searchableColumns = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="justify-between flex items-center">
      <div className="flex flex-1 items-center space-x-2">
        {searchableColumns.length > 0 && (
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder={`Search ${
                searchableColumns.length > 1
                  ? "..."
                  : searchableColumns[0]?.title
              }`}
              value={
                (table
                  .getColumn(searchableColumns[0]?.id)
                  ?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table
                  .getColumn(searchableColumns[0]?.id)
                  ?.setFilterValue(event.target.value)
              }
              className="w-full md:w-64 pl-8"
            />
            {Boolean(
              table.getColumn(searchableColumns[0]?.id)?.getFilterValue()
            ) && (
              <button
                className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-600"
                onClick={() =>
                  table.getColumn(searchableColumns[0]?.id)?.setFilterValue("")
                }
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {filterableColumns.length > 0 &&
          filterableColumns.map(
            (column) =>
              table.getColumn(column.id) && (
                <DataTableFacetedFilter
                  key={column.id}
                  column={table.getColumn(column.id)}
                  title={column.title}
                  options={column.options}
                />
              )
          )}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
