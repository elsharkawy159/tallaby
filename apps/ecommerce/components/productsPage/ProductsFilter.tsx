"use client";

import { useCallback, useMemo, useState } from "react";
import { useUrlParams } from "@/hooks/use-url-params";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Slider } from "@workspace/ui/components/slider";
import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
} from "@workspace/ui/components/sheet";
import { X, PlusIcon } from "lucide-react";

export function ProductsFilter() {
  const { params, setParam, deleteParam } = useUrlParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [price, setPrice] = useState([
    typeof (params as Record<string, string>)["price"] === "string" &&
    !isNaN(Number((params as Record<string, string>)["price"]))
      ? Number((params as Record<string, string>)["price"])
      : 1000,
  ]);

  // Filter options
  const genderOptions = [
    { label: "Men", value: "men" },
    { label: "Women", value: "women" },
    { label: "Kids", value: "kids" },
    { label: "Boys", value: "boys" },
    { label: "Girls", value: "girls" },
    { label: "Unisex", value: "unisex" },
    { label: "Babies", value: "babies" },
  ];
  const sizeOptions = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];
  const collectionOptions = [
    { label: "New Collection", value: "new" },
    { label: "Trending", value: "trending" },
    { label: "Offers", value: "offers" },
  ];
  const modelOptions = [
    { label: "Long Sleeve", value: "long-sleeve" },
    { label: "Short Sleeve", value: "short-sleeve" },
    { label: "T-shirt", value: "tshirt" },
    { label: "Pants", value: "pants" },
    { label: "Skirts", value: "skirts" },
  ];
  const brandOptions = [
    { label: "B1", value: "b1" },
    { label: "B2", value: "b2" },
    { label: "B3", value: "b3" },
    { label: "B4", value: "b4" },
  ];

  const activeFilters = useMemo(() => {
    return Object.entries(params).reduce(
      (acc, [key, value]) => {
        acc[key] = value?.toString().split(",");
        return acc;
      },
      {} as Record<string, string[]>
    );
  }, [params]);

  const handleMultiFilter = useCallback(
    (query: string, value: string, isChecked: boolean) => {
      const currentValues =
        (params as Record<string, string>)[query]?.toString().split(",") || [];
      let newValues: string[];

      if (value === "all") {
        newValues = [];
      } else if (isChecked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter((val) => val !== value);
      }

      if (newValues.length) {
        setParam(query, newValues.join(","), { scroll: false });
      } else {
        deleteParam(query, { scroll: false });
      }
      deleteParam("page", { scroll: false });
    },
    [params, setParam, deleteParam]
  );

  const isFilterActive = useCallback(
    (query: string, value: string) => {
      return (activeFilters[query] || []).includes(value);
    },
    [activeFilters]
  );

  // Price filter handler
  const handlePriceChange = (val: number[]) => {
    setPrice(val);
    setParam("price", val[0]?.toString() || "0", { scroll: false });
    deleteParam("page", { scroll: false });
  };

  // Filter section renderer (for reuse)
  const renderFilters = (isMobile = false) => (
    <div className="flex flex-col gap-6">
      {/* Gender */}
      <div>
        <h3 className="font-bold text-lg mb-2">Gender</h3>
        <div className="flex flex-col gap-2">
          {genderOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={isFilterActive("gender", opt.value)}
                onCheckedChange={(checked) =>
                  handleMultiFilter("gender", opt.value, !!checked)
                }
                id={`gender-${opt.value}${isMobile ? "-mobile" : ""}`}
              />
              <span className="text-base">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Sizes */}
      <div>
        <h3 className="font-bold text-lg mb-2">Sizes</h3>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map((size) => (
            <Button
              key={size}
              variant={isFilterActive("size", size) ? "secondary" : "outline"}
              size="sm"
              className="min-w-[44px] px-0"
              onClick={(e) => {
                e.preventDefault();
                handleMultiFilter("size", size, !isFilterActive("size", size));
              }}
              type="button"
            >
              {size}
            </Button>
          ))}
        </div>
      </div>
      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg mb-2">Price</h3>
          <span className="font-semibold text-base">
            {price && price[0] !== undefined ? price[0] : 1000} EGP
          </span>
        </div>
        <Slider
          min={0}
          max={1000}
          value={price}
          onValueChange={handlePriceChange}
          className="w-full"
        />
      </div>
      {/* Collection */}
      <div>
        <h3 className="font-bold text-lg mb-2">Collection</h3>
        <div className="flex flex-col gap-2">
          {collectionOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={isFilterActive("collection", opt.value)}
                onCheckedChange={(checked) =>
                  handleMultiFilter("collection", opt.value, !!checked)
                }
                id={`collection-${opt.value}${isMobile ? "-mobile" : ""}`}
              />
              <span className="text-base">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Model */}
      <div>
        <h3 className="font-bold text-lg mb-2">Model</h3>
        <div className="flex flex-col gap-2">
          {modelOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={isFilterActive("model", opt.value)}
                onCheckedChange={(checked) =>
                  handleMultiFilter("model", opt.value, !!checked)
                }
                id={`model-${opt.value}${isMobile ? "-mobile" : ""}`}
              />
              <span className="text-base">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Brands */}
      <div>
        <h3 className="font-bold text-lg mb-2">Brands</h3>
        <div className="flex flex-col gap-2">
          {brandOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={isFilterActive("brand", opt.value)}
                onCheckedChange={(checked) =>
                  handleMultiFilter("brand", opt.value, !!checked)
                }
                id={`brand-${opt.value}${isMobile ? "-mobile" : ""}`}
              />
              <span className="text-base">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

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
      <aside className="hidden lg:block w-[285px] rounded-4xl p-6 bg-white border border-border">
        <h2 className="sr-only">Filters</h2>
        {renderFilters(false)}
      </aside>
    </>
  );
}
