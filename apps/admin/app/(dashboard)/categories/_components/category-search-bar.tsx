"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@workspace/ui/components/input";
import { useDebounce } from "@workspace/ui/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { Search, FolderTree } from "lucide-react";
import { searchCategories } from "@/actions/categories";
import type { CategorySearchResult } from "@/actions/categories";

const DEBOUNCE_MS = 200;

interface CategorySearchBarProps {
  locale: "en" | "ar";
  onSelect: (result: CategorySearchResult) => void;
  className?: string;
}

export function CategorySearchBar({
  locale,
  onSelect,
  className,
}: CategorySearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query.trim(), DEBOUNCE_MS);

  const { data: searchResponse, isLoading: isSearching } = useQuery({
    queryKey: ["category-search", debouncedQuery, locale],
    queryFn: () =>
      searchCategories({
        locale,
        search: debouncedQuery,
        limit: 50,
      }),
    enabled: debouncedQuery.length >= 1,
    staleTime: 60 * 1000,
  });

  const results: CategorySearchResult[] =
    searchResponse?.success && searchResponse?.data ? searchResponse.data : [];

  useEffect(() => {
    setIsOpen(debouncedQuery.length > 0);
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (result: CategorySearchResult) => {
      onSelect(result);
      setQuery("");
      setIsOpen(false);
    },
    [onSelect],
  );

  const showResults = isOpen && (results.length > 0 || isSearching);

  return (
    <div ref={containerRef} className={`relative w-full ${className ?? ""}`}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search categories (e.g. Services, Professional...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => debouncedQuery && setIsOpen(true)}
          className="w-full pl-9 pr-4"
          autoComplete="off"
          role="combobox"
          aria-expanded={showResults}
          aria-controls="category-search-results"
          aria-autocomplete="list"
        />
      </div>

      {showResults && (
        <div
          id="category-search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-auto rounded-lg border bg-popover shadow-lg"
        >
          {isSearching ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No categories found
            </div>
          ) : (
            <ul className="py-1">
              {results.map((result) => (
                <li key={result.id} role="option" aria-selected="false">
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
                  >
                    <FolderTree className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {result.name || "Unnamed"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {result.breadcrumbPath}
                      </div>
                      <div className="mt-0.5 flex gap-2 text-xs text-muted-foreground">
                        <span>{result.productCount} products</span>
                        {result.childrenCount > 0 && (
                          <span>{result.childrenCount} subcategories</span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
