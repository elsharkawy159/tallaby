"use client";

import { useFormContext, useWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { cn } from "@workspace/ui/lib/utils";

import type {
  ProductFormBrandOption,
  ProductFormCategoryOption,
} from "@/actions/products-list";
import { BrandCombobox } from "../brand-combobox";
import { CategoryCombobox } from "../category-combobox";
import { Section, SelectField, SwitchRow, TextareaField } from "./fields";
import {
  CONDITION_OPTIONS,
  STATUS_OPTIONS,
  TAX_CLASS_OPTIONS,
  type ProductFormValues,
} from "./types";

const STATUS_DOT: Record<ProductFormValues["status"], string> = {
  draft: "bg-muted-foreground",
  pending: "bg-amber-500",
  active: "bg-emerald-500",
  rejected: "bg-destructive",
};

export function StatusPanel() {
  const { control } = useFormContext<ProductFormValues>();
  const images = useWatch({ control, name: "images" }) ?? [];

  return (
    <Section title="Status">
      <FormField
        control={control}
        name="status"
        render={({ field }) => {
          const current = STATUS_OPTIONS.find((option) => option.value === field.value);
          return (
            <FormItem>
              <div
                role="radiogroup"
                aria-label="Product status"
                className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
              >
                {STATUS_OPTIONS.map((option) => {
                  const checked = field.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        checked
                          ? "bg-background font-medium shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[option.value])} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {current && (
                <p className="text-xs text-muted-foreground">{current.hint}</p>
              )}
              {field.value === "active" && images.length === 0 && (
                <p className="text-xs font-medium text-destructive">
                  Add at least one image before making the product active.
                </p>
              )}
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </Section>
  );
}

export function OrganizationPanel({
  categories,
  brands,
}: {
  categories: ProductFormCategoryOption[];
  brands: ProductFormBrandOption[];
}) {
  const { control } = useFormContext<ProductFormValues>();

  return (
    <Section title="Organization">
      <FormField
        control={control}
        name="categoryId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <CategoryCombobox
                value={field.value}
                onChange={field.onChange}
                options={categories}
                invalid={Boolean(fieldState.error)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="brandId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Brand</FormLabel>
            <FormControl>
              <BrandCombobox
                value={field.value}
                onChange={field.onChange}
                options={brands}
                invalid={Boolean(fieldState.error)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <SelectField name="condition" label="Condition" options={CONDITION_OPTIONS} />
      <ConditionNotes />
      <SelectField name="taxClass" label="Tax class" options={TAX_CLASS_OPTIONS} />
    </Section>
  );
}

function ConditionNotes() {
  const { control } = useFormContext<ProductFormValues>();
  const condition = useWatch({ control, name: "condition" });
  if (condition === "new") return null;
  return (
    <TextareaField
      name="conditionDescription"
      label="Condition notes"
      rows={2}
      placeholder="Scratches, missing accessories…"
    />
  );
}

export function MerchandisingPanel() {
  return (
    <Section title="Merchandising" description="Where the storefront promotes this product.">
      <div className="divide-y">
        <SwitchRow name="isFeatured" label="Featured" />
        <SwitchRow name="isTrending" label="Trending now" />
        <SwitchRow name="isSeasonal" label="Seasonal" />
        <SwitchRow name="sponsored" label="Sponsored" hint="Shown in the homepage Sponsored section" />
        <SwitchRow name="isPlatformChoice" label="Platform choice" hint="Badge on the product card" />
        <SwitchRow name="isBestSeller" label="Best seller" hint="Badge on the product card" />
      </div>
    </Section>
  );
}
