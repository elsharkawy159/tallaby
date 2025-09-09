"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";

export interface CategoryNode {
  id: string;
  name: string;
  categories?: CategoryNode[];
}

export interface CategoryPopoverProps {
  categories: CategoryNode[];
  value?: string | null;
  onChange?: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  form?: any;
}

function findCategoryPathById(
  categories: CategoryNode[],
  id: string
): CategoryNode[] | null {
  for (const node of categories) {
    if (node.id === id) return [node];
    const children = node.categories ?? [];
    if (children.length > 0) {
      const childPath = findCategoryPathById(children, id);
      if (childPath) return [node, ...childPath];
    }
  }
  return null;
}

// Flatten full tree for global search with breadcrumbs
interface FlattenedCategoryItem {
  id: string;
  name: string;
  path: CategoryNode[]; // full path from root to this node
  node: CategoryNode;
  isLeaf: boolean;
}

function flattenCategories(
  categories: CategoryNode[],
  parentPath: CategoryNode[] = []
): FlattenedCategoryItem[] {
  const result: FlattenedCategoryItem[] = [];
  for (const c of categories) {
    const currentPath = [...parentPath, c];
    const children = c.categories ?? [];
    const isLeaf = children.length === 0;
    result.push({ id: c.id, name: c.name, path: currentPath, node: c, isLeaf });
    if (!isLeaf) {
      result.push(...flattenCategories(children, currentPath));
    }
  }
  return result;
}

function CategoryPopover({
  categories,
  value,
  onChange,
  placeholder = "Select category",
  disabled,
  className,
  triggerClassName,
  contentClassName,
  form,
}: CategoryPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [path, setPath] = React.useState<CategoryNode[]>([]);

  const currentLevelItems = React.useMemo(() => {
    const items =
      path.length === 0
        ? categories
        : (path[path.length - 1]?.categories ?? []);
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, path, query]);

  // Precompute flattened tree for global search
  const flattened = React.useMemo(
    () => flattenCategories(categories),
    [categories]
  );

  // When searching, filter across the entire tree by any segment in the path
  const globalSearchResults = React.useMemo(() => {
    if (!query) return [] as FlattenedCategoryItem[];
    const q = query.toLowerCase();
    return flattened.filter((item) =>
      item.path.some((seg) => seg.name.toLowerCase().includes(q))
    );
  }, [flattened, query]);

  const hasBack = path.length > 0;

  const handleBack = () => {
    setPath((prev) => prev.slice(0, -1));
    setQuery("");
  };

  const handleCrumbClick = (index: number) => {
    if (index < 0) {
      setPath([]);
    } else {
      setPath((prev) => prev.slice(0, index + 1));
    }
    setQuery("");
  };

  const handleItemClick = (item: CategoryNode) => {
    const children = item.categories ?? [];
    if (children.length > 0) {
      setPath((prev) => [...prev, item]);
      setQuery("");
      return;
    }
    onChange?.(item.id);
    setOpen(false);
    form?.setValue("categoryId", item.id);
  };

  // When selecting from global search results
  const handleGlobalSelect = (item: FlattenedCategoryItem) => {
    if (item.isLeaf) {
      onChange?.(item.id);
      setOpen(false);
      form?.setValue("categoryId", item.id);
      return;
    }
    // Navigate directly to this node and clear the search to drill down
    setPath(item.path);
    setQuery("");
  };

  // Show the full breadcrumb of category as the selected label
  const selectedLabel = React.useMemo(() => {
    if (!value) return "";
    const p = findCategoryPathById(categories, value);
    return p ? p.map((c) => c.name).join(" / ") : "";
  }, [categories, value]);

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          // Reset navigation state when closing to simplify re-open UX
          setPath([]);
          setQuery("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-between gap-2 truncate rounded-lg bg-white h-11.5 hover:bg-gray-50 transition-colors text-gray-800 font-medium",
            !selectedLabel && "text-muted-foreground",
            triggerClassName,
            className
          )}
          aria-label={selectedLabel || placeholder}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("min-w-96 w-full min-h-97 p-0", contentClassName)}
        align="start"
      >
        <div className="flex items-center gap-2 border-b p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={hasBack ? handleBack : undefined}
            disabled={!hasBack}
            aria-label={hasBack ? "Go back" : "At root"}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex min-w-0 items-center gap-1 text-xs text-gray-600 font-medium">
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => handleCrumbClick(-1)}
              aria-label="Go to root"
            >
              All
            </button>
            {path.map((seg, i) => (
              <React.Fragment key={seg.id}>
                <ChevronRight className="size-3 shrink-0 opacity-80" />
                <button
                  type="button"
                  className="truncate hover:text-foreground"
                  onClick={() => handleCrumbClick(i)}
                  aria-label={`Go to ${seg.name}`}
                >
                  {seg.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
        <Command>
          <CommandInput
            placeholder="Search categories..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="p-1">
            <CommandEmpty>No results found.</CommandEmpty>
            {query
              ? globalSearchResults.map((item) => {
                  const label = item.path.map((p) => p.name).join(" / ");
                  const isSelected = Boolean(value && value === item.id);
                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleGlobalSelect(item)}
                      className="cursor-pointer"
                      aria-label={label}
                    >
                      <span className="truncate flex-1">{label}</span>
                      {item.isLeaf ? (
                        isSelected ? (
                          <Check className="size-4" />
                        ) : null
                      ) : (
                        <ChevronRight className="size-4 opacity-60" />
                      )}
                    </CommandItem>
                  );
                })
              : currentLevelItems.map((item) => {
                  const isLeaf = (item.categories?.length ?? 0) === 0;
                  const isSelected = Boolean(value && value === item.id);
                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleItemClick(item)}
                      className="cursor-pointer"
                      aria-label={item.name}
                    >
                      <span className="truncate flex-1">{item.name}</span>
                      {isLeaf ? (
                        isSelected ? (
                          <Check className="size-4" />
                        ) : null
                      ) : (
                        <ChevronRight className="size-4 opacity-60" />
                      )}
                    </CommandItem>
                  );
                })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { CategoryPopover };
