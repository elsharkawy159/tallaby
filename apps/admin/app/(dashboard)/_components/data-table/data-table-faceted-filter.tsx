"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Separator } from "@workspace/ui/components/separator";
import { Check, PlusCircle } from "lucide-react";

import type { DataTableFilterOption } from "./data-table.types";

interface DataTableFacetedFilterProps {
  title: string;
  options: DataTableFilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  /** Row counts per option value (client mode only). */
  facets?: Map<unknown, number>;
}

export function DataTableFacetedFilter({
  title,
  options,
  selected,
  onChange,
  facets,
}: DataTableFacetedFilterProps) {
  const selectedValues = new Set(selected);

  const toggle = (value: string) => {
    const next = new Set(selectedValues);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(Array.from(next));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          {options.length > 7 && <CommandInput placeholder={title} />}
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                const count = facets?.get(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => toggle(option.value)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="truncate">{option.label}</span>
                    {count ? (
                      <span className="ml-auto pl-2 font-mono text-xs text-muted-foreground">
                        {count}
                      </span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="justify-center text-center"
                  >
                    Clear filter
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
