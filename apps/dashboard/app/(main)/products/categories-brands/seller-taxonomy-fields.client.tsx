"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { Controller, useFormContext } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { FIELD_CLASS, FieldLabel } from "@/components/form/form-ui";
import { cn } from "@/lib/utils";
import type { AddProductFormData } from "../add/add-product.schema";
import type { SellerTaxonomyOption } from "./categories-brands.dto";
import { TAXONOMY_PAGE_HREF, taxonomyLabel } from "./categories-brands.lib";

type SellerTaxonomyOptions = { categories: SellerTaxonomyOption[]; brands: SellerTaxonomyOption[] };

const SellerTaxonomyContext = createContext<SellerTaxonomyOptions | null>(null);

/** Gives the product form the seller's own category and brand lists. */
export function SellerTaxonomyProvider({ value, children }: { value: SellerTaxonomyOptions; children: React.ReactNode }) {
  return <SellerTaxonomyContext.Provider value={value}>{children}</SellerTaxonomyContext.Provider>;
}

// Radix Select can't hold an empty value, so "none" stands for no choice.
const NONE = "none";

/**
 * "My category" / "My brand": optional, from the seller's own lists (Products ›
 * Categories and Products › Brands). Renders nothing outside a SellerTaxonomyProvider.
 */
export function SellerTaxonomyFields() {
  const options = useContext(SellerTaxonomyContext);
  const t = useTranslations("categoriesBrands.productForm");
  if (!options) return null;

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <OptionSelect name="sellerCategoryId" label={t("category")} options={options.categories} />
        <OptionSelect name="sellerBrandId" label={t("brand")} options={options.brands} />
      </div>
      <p className="text-xs text-muted-foreground">
        {t("hint")}{" "}
        <Link href={TAXONOMY_PAGE_HREF.category} target="_blank" className="font-semibold text-primary-ink hover:underline">
          {t("manageCategories")}
        </Link>
        {" · "}
        <Link href={TAXONOMY_PAGE_HREF.brand} target="_blank" className="font-semibold text-primary-ink hover:underline">
          {t("manageBrands")}
        </Link>
      </p>
    </div>
  );
}

function OptionSelect({
  name,
  label,
  options,
}: {
  name: "sellerCategoryId" | "sellerBrandId";
  label: string;
  options: SellerTaxonomyOption[];
}) {
  const t = useTranslations("categoriesBrands.productForm");
  const locale = useLocale();
  const form = useFormContext<AddProductFormData>();

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={name} note={t("optional")}>
        {label}
      </FieldLabel>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value || NONE}
            onValueChange={(value) => field.onChange(value === NONE ? "" : value)}
          >
            <SelectTrigger id={name} className={cn(FIELD_CLASS, "w-full")}>
              <SelectValue placeholder={t("none")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{options.length ? t("none") : t("emptyList")}</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {taxonomyLabel(option, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
