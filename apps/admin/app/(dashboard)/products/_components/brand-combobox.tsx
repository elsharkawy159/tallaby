"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, LoaderCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
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
import { cn } from "@workspace/ui/lib/utils";

import { createBrand } from "@/actions/brands";
import type { ProductFormBrandOption } from "@/actions/products-list";

const MAX_RESULTS = 60;

interface BrandComboboxProps {
  id?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: ProductFormBrandOption[];
  invalid?: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function BrandCombobox({
  id,
  value,
  onChange,
  options: initialOptions,
  invalid,
}: BrandComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [created, setCreated] = useState<ProductFormBrandOption[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const options = useMemo(
    () => [...created, ...initialOptions],
    [created, initialOptions]
  );
  const selected = options.find((option) => option.id === value);
  const trimmed = query.trim();

  const results = useMemo(() => {
    const needle = trimmed.toLowerCase();
    if (!needle) return options.slice(0, MAX_RESULTS);
    return options
      .filter((option) => option.name.toLowerCase().includes(needle))
      .sort(
        (a, b) =>
          Number(b.name.toLowerCase().startsWith(needle)) -
          Number(a.name.toLowerCase().startsWith(needle))
      )
      .slice(0, MAX_RESULTS);
  }, [options, trimmed]);

  const hasExactMatch = options.some(
    (option) => option.name.toLowerCase() === trimmed.toLowerCase()
  );

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const select = (brandId: string) => {
    onChange(brandId);
    close();
  };

  const handleCreate = async () => {
    const name = trimmed;
    const slug = slugify(name);
    if (!name || !slug) return;

    setIsCreating(true);
    try {
      const result = await createBrand({ name, slug });
      if (result.success && result.data) {
        const brand: ProductFormBrandOption = {
          id: result.data.id,
          name: result.data.name,
          slug: result.data.slug,
          logoUrl: result.data.logoUrl ?? null,
        };
        setCreated((prev) => [brand, ...prev]);
        select(brand.id);
        toast.success(`Brand “${brand.name}” created`);
        return;
      }

      const existing = options.find((option) => option.slug === slug);
      if (existing) {
        select(existing.id);
        toast.info(`“${existing.name}” already exists, so it was selected`);
      } else {
        toast.error(result.error || "Couldn't create the brand");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className={cn(
            "w-full justify-between gap-2 font-normal",
            invalid && "border-destructive"
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.name : "No brand"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(22rem,calc(100vw-2rem))] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or add a brand"
            value={query}
            onValueChange={setQuery}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !results.length && trimmed && !isCreating) {
                event.preventDefault();
                void handleCreate();
              }
            }}
          />
          <CommandList className="max-h-72">
            {trimmed && !hasExactMatch && (
              <>
                <CommandGroup>
                  <CommandItem
                    value="__create__"
                    disabled={isCreating}
                    onSelect={() => void handleCreate()}
                  >
                    {isCreating ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span>
                      Create brand <strong>“{trimmed}”</strong>
                    </span>
                  </CommandItem>
                </CommandGroup>
                {results.length > 0 && <CommandSeparator />}
              </>
            )}
            <CommandGroup>
              {!trimmed && value && (
                <CommandItem value="__none__" onSelect={() => select("")}>
                  <X className="h-4 w-4 opacity-60" />
                  <span className="text-muted-foreground">Remove brand</span>
                </CommandItem>
              )}
              {results.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={() => select(option.id)}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      option.id === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
