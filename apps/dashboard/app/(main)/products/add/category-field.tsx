"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { CategoryPopover } from "@workspace/ui/components";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { FieldError, FieldLabel } from "@/components/form/form-ui";
import { suggestCategories } from "./add-product.lib";
import { useFieldError } from "./sections/fields";
import type { AddProductFormData, CategoryOption } from "./add-product.schema";

interface CategoryFieldProps {
  categories: CategoryOption[];
}

/**
 * Category picker plus suggestions ranked from the product name (both
 * languages) — most sellers can pick their category in one click instead of
 * drilling through the tree.
 */
export function CategoryField({ categories }: CategoryFieldProps) {
  const form = useFormContext<AddProductFormData>();
  const t = useTranslations("productForm.sections.basic");
  const tSuggest = useTranslations("productForm.categories");
  const tPicker = useTranslations("productForm.categoryPicker");
  const uiLocale = useLocale();
  const isArabicUi = uiLocale === "ar";

  const [enTitle, arTitle, enDescription, arDescription, categoryId] = useWatch({
    control: form.control,
    name: [
      "localized.en.title",
      "localized.ar.title",
      "localized.en.description",
      "localized.ar.description",
      "categoryId",
    ],
  });
  const debounced = useDebounce(
    `${enTitle ?? ""}\u0000${arTitle ?? ""}\u0000${enDescription ?? ""} ${arDescription ?? ""}`,
    250
  );

  const suggestions = useMemo(() => {
    const [en, ar, description] = debounced.split("\u0000");
    return suggestCategories(categories, { titles: [en, ar], description }, 4);
  }, [categories, debounced]);

  // The picker shows Arabic names in the Arabic UI.
  const pickerCategories = useMemo(() => {
    if (!isArabicUi) return categories;
    type Node = CategoryOption & { categories?: Node[] };
    const localize = (nodes: Node[]): Node[] =>
      nodes.map((node) => ({
        ...node,
        name: node.nameAr || node.name,
        categories: node.categories ? localize(node.categories) : undefined,
      }));
    return localize(categories as Node[]);
  }, [categories, isArabicUi]);

  const labels = useMemo(
    () => ({
      back: tPicker("back"),
      atRoot: tPicker("atRoot"),
      goToRoot: tPicker("goToRoot"),
      all: tPicker("all"),
      goTo: (name: string) => tPicker("goTo", { name }),
      search: tPicker("search"),
      empty: tPicker("empty"),
    }),
    [tPicker]
  );

  const label = (category: CategoryOption) =>
    isArabicUi ? category.nameAr || category.name : category.name;

  const select = (id: string) =>
    form.setValue("categoryId", id, { shouldValidate: true, shouldDirty: true });

  const error = useFieldError("categoryId");
  const hasTitle = Boolean((enTitle ?? "").trim() || (arTitle ?? "").trim());

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <FieldLabel required>{t("category")}</FieldLabel>
      <CategoryPopover
        categories={pickerCategories}
        value={categoryId}
        onChange={select}
        placeholder={tPicker("placeholder")}
        labels={labels}
        triggerClassName={cn(error && "border-destructive")}
      />
      <FieldError>{error}</FieldError>

      {suggestions.length > 0 ? (
        <div className="mt-1 flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">{tSuggest("suggestedHeading")}</span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((match, index) => {
              const selected = match.category.id === categoryId;
              const parents = match.path.slice(0, -1).map(label);
              return (
                <button
                  key={match.category.id}
                  type="button"
                  onClick={() => select(match.category.id)}
                  aria-pressed={selected}
                  aria-label={tSuggest("select", { name: label(match.category) })}
                  title={match.path.map(label).join(" › ")}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-start text-xs transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/50 hover:bg-primary-soft"
                  )}
                >
                  {selected ? (
                    <Check className="size-3.5 shrink-0" aria-hidden />
                  ) : index === 0 ? (
                    <Sparkles className="size-3.5 shrink-0 text-accent-ink" aria-hidden />
                  ) : null}
                  <span className="min-w-0 truncate">
                    {parents.length > 0 && (
                      <span className={cn(selected ? "opacity-75" : "text-muted-foreground")}>
                        {parents.join(" › ")} ›{" "}
                      </span>
                    )}
                    <span className="font-semibold">{label(match.category)}</span>
                  </span>
                  {index === 0 && !selected && (
                    <span className="shrink-0 rounded-[5px] bg-accent-soft px-1.5 text-[10px] leading-[18px] font-bold text-accent-ink">
                      {tSuggest("bestMatch")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        !categoryId &&
        !hasTitle && <span className="text-xs text-faint">{tSuggest("typeNameFirst")}</span>
      )}
    </div>
  );
}
