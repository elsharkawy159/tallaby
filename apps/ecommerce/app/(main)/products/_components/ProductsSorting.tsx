"use client";
import React from "react";
import { useUrlParams } from "../../../../hooks/use-url-params";
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
  { value: "popularity", label: "Most Popular" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Highest Rated" },
];

const ProductsSorting: React.FC = () => {
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
    <Select value={currentSort} onValueChange={handleSortChange} >
      <SelectTrigger className="md:w-[220px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Sort by</SelectLabel>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ProductsSorting;
