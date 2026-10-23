"use client";

import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Tag } from "lucide-react";
import slugify from "slugify";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@/lib/utils";
import { contentDirClass } from "@/lib/i18n/content-dir";
import { useProductLinkHost } from "../product-link-host.client";
import { BrandSearchInput } from "@/components/inputs/brand-search-input";
import {
  FIELD_CLASS,
  FieldError,
  FieldLabel,
  SectionCard,
  TEXTAREA_CLASS,
} from "@/components/form/form-ui";
import { CategoryField } from "../category-field";
import { SellerTaxonomyFields } from "../../categories-brands/seller-taxonomy-fields.client";
import { useFieldError } from "./fields";
import type {
  AddProductFormData,
  BrandOption,
  CategoryOption,
  SupportedLocale,
} from "../add-product.schema";

const TITLE_MAX = 255;
const SHORT_DESCRIPTION_SOFT_MAX = 300;

const toSlug = (value: string) => slugify(value, { lower: true, strict: true });

interface BasicSectionProps {
  id?: string;
  categories: CategoryOption[];
  brands: BrandOption[];
  activeLocale: SupportedLocale;
  /** Header action, e.g. "Import from link". */
  action?: React.ReactNode;
}

export function BasicSection({
  id = "sec-basic",
  categories,
  brands,
  activeLocale,
  action,
}: BasicSectionProps) {
  const t = useTranslations("productForm.sections.basic");
  const form = useFormContext<AddProductFormData>();
  const enTitleError = useFieldError("localized.en.title");
  const arTitleError = useFieldError("localized.ar.title");
  const categoryError = useFieldError("categoryId");
  // Once the seller types their own slug, titles stop overwriting it.
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <SectionCard
      id={id}
      icon={Tag}
      title={t("title")}
      description={t("description")}
      action={action}
      divided={false}
      invalid={Boolean(enTitleError || arTitleError || categoryError)}
    >
      {(["en", "ar"] as const).map((loc) => (
        <div key={loc} className={cn("flex flex-col gap-1.5", activeLocale !== loc && "hidden")} lang={loc}>
          <Controller
            control={form.control}
            name={`localized.${loc}.title`}
            render={({ field }) => {
              const error = loc === "en" ? enTitleError : arTitleError;
              return (
                <>
                  <FieldLabel
                    htmlFor={`title-${loc}`}
                    required={loc === "en"}
                    locale={loc}
                    note={`${field.value?.length ?? 0}/${TITLE_MAX}`}
                  >
                    {t("name")}
                  </FieldLabel>
                  <Input
                    id={`title-${loc}`}
                    {...field}
                    value={field.value ?? ""}
                    maxLength={TITLE_MAX}
                    aria-invalid={Boolean(error)}
                    placeholder={loc === "en" ? t("namePlaceholderEn") : t("namePlaceholderAr")}
                    className={cn(FIELD_CLASS, contentDirClass(loc))}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      if (!slugEdited) {
                        form.setValue(`localized.${loc}.slug`, toSlug(e.target.value), {
                          shouldValidate: form.formState.submitCount > 0,
                        });
                      }
                    }}
                  />
                  <FieldError>{error}</FieldError>
                </>
              );
            }}
          />
          <SlugLine onEdited={() => setSlugEdited(true)} />
        </div>
      ))}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <CategoryField categories={categories} />
        <BrandSearchInput
          name="brandId"
          label={t("brand")}
          labelNote={t("optional")}
          selectedBrands={brands ?? []}
        />
      </div>
      <SellerTaxonomyFields />

      {(["en", "ar"] as const).map((loc) => (
        <div key={loc} className={cn("flex flex-col gap-1.5", activeLocale !== loc && "hidden")} lang={loc}>
          <Controller
            control={form.control}
            name={`localized.${loc}.description`}
            render={({ field }) => (
              <>
                <FieldLabel
                  htmlFor={`description-${loc}`}
                  locale={loc}
                  note={`${field.value?.length ?? 0}/${SHORT_DESCRIPTION_SOFT_MAX}`}
                >
                  {t("shortDescription")}
                </FieldLabel>
                <Textarea
                  id={`description-${loc}`}
                  {...field}
                  value={field.value ?? ""}
                  rows={2}
                  placeholder={t("shortDescriptionPlaceholder")}
                  className={cn(TEXTAREA_CLASS, "min-h-[84px]", contentDirClass(loc))}
                />
              </>
            )}
          />
        </div>
      ))}
    </SectionCard>
  );
}

/**
 * Storefront link preview. Product URLs use the English slug, so that's the
 * one shown and edited regardless of the content language.
 */
function SlugLine({ onEdited }: { onEdited: () => void }) {
  const t = useTranslations("productForm.sections.basic");
  const form = useFormContext<AddProductFormData>();
  const slug = useWatch({ control: form.control, name: "localized.en.slug" });
  const linkHost = useProductLinkHost();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const next = toSlug(draft);
    if (next) {
      form.setValue("localized.en.slug", next, { shouldDirty: true, shouldValidate: true });
      onEdited();
    }
    setEditing(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {t("link")}
      {editing ? (
        <input
          autoFocus
          dir="ltr"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-7 min-w-[200px] rounded-md border border-primary bg-card px-1.5 font-mono text-xs outline-none"
        />
      ) : (
        <code
          dir="ltr"
          className="rounded-md border bg-muted px-1.5 py-px font-mono text-xs text-foreground"
        >
          {linkHost}/products/{slug || "…"}
        </code>
      )}
      <button
        type="button"
        onClick={() => {
          if (editing) return commit();
          setDraft(slug ?? "");
          setEditing(true);
        }}
        className="text-xs font-semibold text-primary-ink hover:underline"
      >
        {editing ? t("doneSlug") : t("editSlug")}
      </button>
    </div>
  );
}
