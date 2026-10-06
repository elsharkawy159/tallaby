"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

import type { ProductFormCategoryOption } from "@/actions/products-list";

const MAX_RESULTS = 60;

interface CategoryComboboxProps {
  id?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: ProductFormCategoryOption[];
  invalid?: boolean;
}

function categoryPath(option: ProductFormCategoryOption): string {
  return [...option.ancestors, option.name].join(" › ");
}

export function CategoryCombobox({
  id,
  value,
  onChange,
  options,
  invalid,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.id === value);

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return options.slice(0, MAX_RESULTS);

    const matches = options.filter((option) => {
      const haystack = `${categoryPath(option)} ${option.nameAr ?? ""}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
    // Categories whose own name matches rank above ones matched only by an ancestor.
    const ownName = (option: ProductFormCategoryOption) =>
      terms.some((term) =>
        `${option.name} ${option.nameAr ?? ""}`.toLowerCase().includes(term)
      );
    return matches
      .sort((a, b) => Number(ownName(b)) - Number(ownName(a)))
      .slice(0, MAX_RESULTS);
  }, [options, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className={cn(
            "h-auto min-h-9 w-full justify-between gap-2 py-1.5 text-left font-normal",
            invalid && "border-destructive"
          )}
        >
          {selected ? (
            <span className="min-w-0">
              <span className="block truncate font-medium">{selected.name}</span>
              {selected.ancestors.length > 0 && (
                <span className="block truncate text-xs text-muted-foreground">
                  {selected.ancestors.join(" › ")}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">Choose a category</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(28rem,calc(100vw-2rem))] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, e.g. phones"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-80">
            <CommandEmpty>No category matches “{query.trim()}”.</CommandEmpty>
            {results.map((option) => (
              <CommandItem
                key={option.id}
                value={option.id}
                onSelect={() => {
                  onChange(option.id);
                  setOpen(false);
                  setQuery("");
                }}
                className="items-start gap-2"
              >
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    option.id === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium">{option.name}</span>
                    {!option.isLeaf && (
                      <span className="shrink-0 rounded border px-1 text-[10px] text-muted-foreground">
                        has subcategories
                      </span>
                    )}
                  </span>
                  {option.ancestors.length > 0 && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {option.ancestors.join(" › ")}
                    </span>
                  )}
                </span>
                {option.nameAr && (
                  <span dir="rtl" className="shrink-0 text-xs text-muted-foreground">
                    {option.nameAr}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
