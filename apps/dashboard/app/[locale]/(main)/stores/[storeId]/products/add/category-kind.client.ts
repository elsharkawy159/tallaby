"use client";

import { useEffect, useMemo, useRef } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { filterCategoryTreeByKind, toProductKind } from "@workspace/lib/products/category-kind";
import { useSellerTaxonomy } from "../categories-brands/seller-taxonomy-fields.client";
import { categoryAfterKindChange } from "./category-kind.lib";
import { flattenCategoryTree } from "./add-product.lib";
import { storeOptionOwnLabel } from "./category-search.lib";
import type { AddProductFormData, CategoryOption } from "./add-product.schema";

/**
 * The Tallaby category tree of the form's product type (F-108e): a physical
 * product sees only physical categories, a digital one only digital ones.
 * When the type changes (or a draft, import or AI fill brings a category of the
 * other kind), a Tallaby category of the other kind is cleared and the seller
 * is told in one line; behind a store category it is matched again silently,
 * as the picker does (the seller never picks that one).
 */
export function useKindCategories(form: UseFormReturn<AddProductFormData>, categories: CategoryOption[]): CategoryOption[] {
  const t = useTranslations("productForm.categoryField");
  const locale = useLocale();
  const taxonomy = useSellerTaxonomy();
  const [productType, categoryId, sellerCategoryId, sellerCategoryName, enTitle, arTitle] = useWatch({
    control: form.control,
    name: ["productType", "categoryId", "sellerCategoryId", "sellerCategoryName", "localized.en.title", "localized.ar.title"],
  });
  const kind = toProductKind(productType);
  const kindTree = useMemo(() => filterCategoryTreeByKind(categories, kind), [categories, kind]);
  const allIds = useMemo(() => new Set(flattenCategoryTree(categories).map((entry) => entry.category.id)), [categories]);
  const lastKind = useRef(kind);

  useEffect(() => {
    const switched = lastKind.current !== kind;
    lastKind.current = kind;
    const option = sellerCategoryId ? taxonomy?.categories.find((o) => o.id === sellerCategoryId) : undefined;
    const next = categoryAfterKindChange({
      categoryId,
      allIds,
      kindTree,
      storeCategoryName: sellerCategoryName?.trim() || (option ? storeOptionOwnLabel(option, locale) : null),
      titles: [enTitle, arTitle],
      locale,
    });
    if (next === undefined) return;
    form.setValue("categoryId", next ?? "", { shouldDirty: switched, shouldValidate: form.formState.submitCount > 0 });
    if (next === null && switched) toast.info(kind === "digital" ? t("kindClearedDigital") : t("kindClearedPhysical"));
    // Only a type or category change re-checks; the titles are read as they are then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, categoryId, kindTree, allIds]);

  return kindTree;
}
