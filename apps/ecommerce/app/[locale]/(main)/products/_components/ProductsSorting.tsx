"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { useUrlParams } from "@/hooks/use-url-params";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
} from "@workspace/ui/components/select";

const SORT_OPTIONS = [
  { value: "popularity", labelKey: "sortMostPopular" },
  { value: "price-low", labelKey: "sortPriceLowToHigh" },
  { value: "price-high", labelKey: "sortPriceHighToLow" },
  { value: "newest", labelKey: "sortNewest" },
  { value: "rating", labelKey: "sortHighestRated" },
] as const;

const ProductsSorting: React.FC = () => {
  const t = useTranslations("search");
  const { params, updateParams } = useUrlParams();
  const currentSort = params.sort || "popularity";

  const handleSortChange = (newValue: string) => {
    updateParams(
      {
        sort: newValue,
        page: 1, // Reset to first page when sort changes
      },
      { scroll: false }
    );
  };

  return (
    <Select value={currentSort} onValueChange={handleSortChange}>
      <SelectTrigger className="md:w-[220px]">
        <SelectValue placeholder={t("sortBy")} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{t("sortBy")}</SelectLabel>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ProductsSorting;
