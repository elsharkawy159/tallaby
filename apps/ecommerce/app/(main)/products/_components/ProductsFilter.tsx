"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useUrlParams, type SearchParams } from "@/hooks/use-url-params";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Slider } from "@workspace/ui/components/slider";
import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
} from "@workspace/ui/components/sheet";
import { X, PlusIcon } from "lucide-react";
import { ScrollArea } from "@workspace/ui/components";

interface FilterOptionsResponse {
  success: boolean;
  data?: {
    categories: Array<{
      id: string;
      name: string | null;
      slug: string | null;
      productCount: number;
    }>;
    brands: Array<{
      id: string;
      name: string;
      slug: string;
      productCount: number;
    }>;
    priceRange: {
      min: number;
      max: number;
    };
  };
  error?: string;
}

interface ProductsFilterProps {
  filterOptions?: FilterOptionsResponse;
}

export function ProductsFilter({ filterOptions }: ProductsFilterProps) {
  const { params, updateParams } = useUrlParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Initialize price range from filter options
  const [price, setPrice] = useState<number[]>([0, 1000]);

  useEffect(() => {
    if (filterOptions?.data?.priceRange) {
      const currentMin = params.priceMin || filterOptions.data.priceRange.min;
      const currentMax = params.priceMax || filterOptions.data.priceRange.max;
      setPrice([currentMin, currentMax]);
    }
  }, [filterOptions, params.priceMin, params.priceMax]);

  const handleMultiFilter = useCallback(
    (
      filterType: "categories" | "brands",
      value: string,
      isChecked: boolean
    ) => {
      const currentValues = params[filterType] || [];
      let newValues: string[];

      if (isChecked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter((val: string) => val !== value);
      }

      updateParams(
        {
          [filterType]: newValues,
          page: 1, // Reset to first page when filters change
        } as Partial<SearchParams>,
        { scroll: false }
      );
    },
    [params, updateParams]
  );

  const isFilterActive = useCallback(
    (filterType: "categories" | "brands", value: string) => {
      return (params[filterType] || []).includes(value);
    },
    [params]
  );

  // Price filter handler
  const handlePriceChange = (val: number[]) => {
    setPrice(val);
    updateParams(
      {
        priceMin: val[0],
        priceMax: val[1],
        page: 1,
      },
      { scroll: false }
    );
  };

  const clearAllFilters = () => {
    const minPrice = filterOptions?.data?.priceRange?.min || 0;
    const maxPrice = filterOptions?.data?.priceRange?.max || 1000;

    updateParams(
      {
        categories: [],
        brands: [],
        priceMin: minPrice,
        priceMax: maxPrice,
        page: 1,
      },
      { scroll: false }
    );
    setPrice([minPrice, maxPrice]);
  };

  const hasActiveFilters = useMemo(() => {
    const defaultMin = filterOptions?.data?.priceRange?.min || 0;
    const defaultMax = filterOptions?.data?.priceRange?.max || 1000;

    return (
      (params.categories?.length || 0) > 0 ||
      (params.brands?.length || 0) > 0 ||
      params.priceMin !== defaultMin ||
      params.priceMax !== defaultMax
    );
  }, [params, filterOptions]);

  // Filter section renderer (for reuse)
  const renderFilters = (isMobile = false) => {
    if (!filterOptions?.success) {
      return (
        <div className="flex flex-col gap-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading filters...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {/* Clear All Filters */}
        {hasActiveFilters && (
          <div className="pb-4 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="w-full"
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Categories */}
        {filterOptions?.data?.categories &&
          filterOptions.data.categories.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-2">Categories</h3>
              <ScrollArea className="flex flex-col max-h-100 overflow-y-auto">
                {filterOptions.data.categories
                  .filter((category) => category.name) // Filter out categories with null names
                  .map((category) => (
                    <label
                      key={category.name}
                      className="flex items-center py-1 justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isFilterActive("categories", category.name!)}
                          onCheckedChange={(checked) =>
                            handleMultiFilter(
                              "categories",
                              category.name!,
                              !!checked
                            )
                          }
                          id={`category-${category.name}${isMobile ? "-mobile" : ""}`}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({category.productCount})
                      </span>
                    </label>
                  ))}
              </ScrollArea>
            </div>
          )}

        {/* Brands */}
        {filterOptions?.data?.brands &&
          filterOptions.data.brands.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-2">Brands</h3>
              <ScrollArea className="flex flex-col max-h-100 overflow-y-auto">
                {filterOptions.data.brands.map((brand) => (
                  <label
                    key={brand.name}
                    className="flex items-center py-1 justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isFilterActive("brands", brand.name)}
                        onCheckedChange={(checked) =>
                          handleMultiFilter("brands", brand.name, !!checked)
                        }
                        id={`brand-${brand.name}${isMobile ? "-mobile" : ""}`}
                      />
                      <span className="text-sm">{brand.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({brand.productCount})
                    </span>
                  </label>
                ))}
              </ScrollArea>
            </div>
          )}

        {/* Price */}
        {filterOptions?.data?.priceRange && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg mb-2">Price Range</h3>
              <span className="font-semibold text-base">
                ${price[0]} - ${price[1]}
              </span>
            </div>
            <Slider
              min={filterOptions.data.priceRange.min}
              max={filterOptions.data.priceRange.max}
              value={price}
              onValueChange={handlePriceChange}
              className="w-full"
              step={1}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${filterOptions.data.priceRange.min}</span>
              <span>${filterOptions.data.priceRange.max}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden flex items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <PlusIcon className="size-5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {[
                params.categories?.length || 0,
                params.brands?.length || 0,
              ].reduce((a, b) => a + b, 0) +
                (params.priceMin !==
                  (filterOptions?.data?.priceRange?.min || 0) ||
                params.priceMax !==
                  (filterOptions?.data?.priceRange?.max || 1000)
                  ? 1
                  : 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent
          side="right"
          className="max-w-xs w-full p-0 pt-4 pb-6 flex flex-col overflow-y-auto shadow-xl lg:hidden"
        >
          <div className="flex items-center justify-between px-4 mb-2">
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            <SheetClose asChild>
              <button
                type="button"
                className="relative -mr-2 flex size-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Close menu</span>
                <X aria-hidden="true" className="size-6" />
              </button>
            </SheetClose>
          </div>
          <form
            className="mt-4 px-4 space-y-6"
            onSubmit={(e) => e.preventDefault()}
          >
            {renderFilters(true)}
          </form>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-76 h-screen overflow-y-auto p-5 top-0 sticky border-r border-r-gray-200">
        <h2 className="sr-only">Filters</h2>
        {renderFilters(false)}
      </aside>
    </>
  );
}
