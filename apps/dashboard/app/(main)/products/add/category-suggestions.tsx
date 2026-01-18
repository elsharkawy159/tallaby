"use client";

import { useMemo } from "react";
import { cn } from "@workspace/ui/lib/utils";
import type { CategoryOption } from "./add-product.schema";
import { searchCategoriesByProductName } from "./add-product.lib";

function isArabicText(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value)
}

interface CategorySuggestionsProps {
  categories: CategoryOption[];
  productName: string;
  selectedCategoryId?: string | null;
  onSelect: (categoryId: string) => void;
  className?: string;
}

export function CategorySuggestions({
  categories,
  productName,
  selectedCategoryId,
  onSelect,
  className,
}: CategorySuggestionsProps) {
  const matchedCategories = useMemo(() => {
    return searchCategoriesByProductName(categories, productName, 8);
  }, [categories, productName]);
  const shouldUseArabic = isArabicText(productName);

  if (
    !productName ||
    productName.trim().length < 2 ||
    matchedCategories.length === 0
  ) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs text-gray-600 font-medium">Suggested categories:</p>
      <div className="flex flex-wrap gap-2">
        {matchedCategories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const categoryLabel = shouldUseArabic
            ? category.nameAr || category.name
            : category.name;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category.id)}
              className={cn(
                "px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                "border focus:outline-none",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:border-primary hover:bg-primary/5",
                "focus:ring-primary"
              )}
              aria-pressed={isSelected}
              aria-label={`Select category ${categoryLabel}`}
            >
              {categoryLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
