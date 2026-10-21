"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Layers, Plus, Trash2, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn, getPublicUrl } from "@/lib/utils";
import { contentDirClass } from "@/lib/i18n/content-dir";
import { formatMoney } from "@/lib/i18n/format";
import {
  calculateProductFinalPrice,
  type SellerPricingSettings,
} from "@/lib/utils/product-pricing.lib";
import {
  buildVariantLocalizedFromCombo,
  createEmptyVariantType,
  getVariantValueIndexes,
  reconstructVariantTypesFromVariants,
  VARIANT_TYPE_PRESETS,
  WEIGHT_UNITS,
  type VariantTypeFormValue,
} from "@/lib/utils/variant-types.lib";
import { ImageUpload } from "@/components/inputs/image-upload";
import { FIELD_CLASS, NumberStepper, SMALL_BUTTON_CLASS } from "@/components/form/form-ui";
import { VariantPricingFields } from "../steps/variant-pricing-fields";
import type {
  AddProductFormData,
  SupportedLocale,
  VariantOptionKind,
} from "../add-product.schema";
import { RemoteImage } from "@/components/media/remote-image";

const MAX_OPTION_TYPES = 3;
const DEFAULT_KINDS: VariantOptionKind[] = ["color", "size", "material"];

const SELECT_CLASS =
  "h-11 w-full cursor-pointer appearance-none rounded-[10px] border border-input bg-card bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat pe-9 ps-3.5 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 rtl:bg-[position:left_12px_center]";
const CHEVRON_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2394a0a5' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

// Seeds a swatch when a common color is typed, so most sellers never open the picker.
const COLOR_GUESS: Record<string, string> = {
  red: "#ef4444", أحمر: "#ef4444", blue: "#3b82f6", أزرق: "#3b82f6",
  black: "#171717", أسود: "#171717", white: "#ffffff", أبيض: "#ffffff",
  green: "#22c55e", أخضر: "#22c55e", yellow: "#eab308", أصفر: "#eab308",
  gray: "#9ca3af", grey: "#9ca3af", رمادي: "#9ca3af", pink: "#ec4899",
  وردي: "#ec4899", بمبي: "#ec4899", purple: "#a855f7", بنفسجي: "#a855f7",
  orange: "#f97316", برتقالي: "#f97316", brown: "#92400e", بني: "#92400e",
  beige: "#e7d7c1", بيج: "#e7d7c1", gold: "#d4af37", ذهبي: "#d4af37",
  silver: "#c0c0c0", فضي: "#c0c0c0", navy: "#1e3a8a", كحلي: "#1e3a8a",
};

function generateValueIndexCombinations(types: VariantTypeFormValue[]): number[][] {
  const valueCounts = types.map((type) =>
    Math.max(type.localized.en.values.length, type.localized.ar.values.length, 0)
  );
  if (types.length === 0 || valueCounts.some((count) => count === 0)) return [];
  return valueCounts.reduce<number[][]>(
    (acc, count) =>
      acc.flatMap((combo) => Array.from({ length: count }, (_, i) => [...combo, i])),
    [[]]
  );
}

const isValidVariantType = (type: VariantTypeFormValue) =>
  (["en", "ar"] as const).some(
    (loc) =>
      type.localized[loc].name.trim().length > 0 &&
      type.localized[loc].values.some((value) => value.trim())
  );

/**
 * Option types (color, size…) as chip inputs, and the generated combinations
 * table. Values are index-aligned across languages: a value typed in Arabic
 * shows as "untranslated" in English until the seller fills it in.
 */
export function VariantsEditor({
  sellerPricing,
  activeLocale,
}: {
  sellerPricing: SellerPricingSettings;
  activeLocale: SupportedLocale;
}) {
  const form = useFormContext<AddProductFormData>();
  const t = useTranslations("productForm.variants");
  const { fields, replace } = useFieldArray({ control: form.control, name: "variants" });

  const variantTypes = (useWatch({ control: form.control, name: "variantTypes" }) ??
    []) as VariantTypeFormValue[];
  const setVariantTypes = (next: VariantTypeFormValue[]) =>
    form.setValue("variantTypes", next, { shouldDirty: true });

  // Edit page / import: rebuild option types from stored variants.
  useEffect(() => {
    const currentTypes = form.getValues("variantTypes") ?? [];
    const currentVariants = form.getValues("variants") ?? [];
    if (currentTypes.length === 0 && currentVariants.length > 0) {
      form.setValue("variantTypes", reconstructVariantTypesFromVariants(currentVariants), {
        shouldDirty: false,
      });
    }
  }, [form]);

  const [mainListPrice, mainDiscountValue, mainDiscountType, mainFinalPrice, mainQuantity] =
    useWatch({
      control: form.control,
      name: [
        "price.list",
        "price.discountValue",
        "price.discountType",
        "price.final",
        "quantity",
      ],
    });
  const mainImages = useWatch({ control: form.control, name: "images" }) ?? [];
  const variants = useWatch({ control: form.control, name: "variants" }) ?? [];
  const defaultVariantIndex = variants.findIndex((variant) => variant?.isDefault);

  // The default variant mirrors the main price, stock and images.
  useEffect(() => {
    if (defaultVariantIndex === -1) return;
    const numericList = typeof mainListPrice === "number" ? mainListPrice : 0;
    if (numericList <= 0) return;

    const syncedFinal =
      typeof mainFinalPrice === "number" && mainFinalPrice > 0
        ? mainFinalPrice
        : calculateProductFinalPrice(numericList, mainDiscountValue, mainDiscountType, sellerPricing);
    const numericQuantity = typeof mainQuantity === "number" ? mainQuantity : 0;
    const discountVal = mainDiscountValue ?? 0;
    const discountTyp = mainDiscountType ?? "percent";
    const syncedImages = (Array.isArray(mainImages) ? mainImages : []).filter(
      (image): image is string => typeof image === "string" && image.length > 0
    );
    const syncedImageUrl = syncedImages[0];
    const current = form.getValues(`variants.${defaultVariantIndex}`);
    const currentImages = Array.isArray(current?.images) ? current.images : [];
    const imagesMatch =
      currentImages.length === syncedImages.length &&
      currentImages.every((image, index) => image === syncedImages[index]);

    if (
      current?.listPrice === numericList &&
      current?.discountValue === discountVal &&
      current?.discountType === discountTyp &&
      current?.price === syncedFinal &&
      current?.stock === numericQuantity &&
      imagesMatch &&
      (current?.imageUrl ?? undefined) === syncedImageUrl
    ) {
      return;
    }

    const opts = { shouldDirty: true, shouldValidate: false } as const;
    const base = `variants.${defaultVariantIndex}` as const;
    form.setValue(`${base}.listPrice`, numericList, opts);
    form.setValue(`${base}.discountValue`, discountVal, opts);
    form.setValue(`${base}.discountType`, discountTyp, opts);
    form.setValue(`${base}.price`, syncedFinal, opts);
    form.setValue(`${base}.stock`, numericQuantity, opts);
    form.setValue(`${base}.images`, syncedImages, opts);
    form.setValue(`${base}.imageUrl`, syncedImageUrl, opts);
  }, [
    defaultVariantIndex,
    form,
    mainDiscountType,
    mainDiscountValue,
    mainFinalPrice,
    mainImages,
    mainListPrice,
    mainQuantity,
    sellerPricing,
  ]);

  // Rebuild the combinations whenever the option types change, keeping the
  // price/stock/images already entered for combinations that still exist.
  useEffect(() => {
    // Types are still being reconstructed from stored variants (edit page):
    // wait for them instead of wiping the variants.
    if (variantTypes.length === 0 && (form.getValues("variantTypes")?.length ?? 0) > 0) return;

    const validTypes = variantTypes.filter(isValidVariantType);
    if (validTypes.length === 0) {
      if ((form.getValues("variants") ?? []).length > 0) replace([]);
      return;
    }

    const combinations = generateValueIndexCombinations(validTypes);
    const baseSku = form.getValues("sku") || "PROD";
    const listValue = form.getValues("price.list");
    const numericMainList = typeof listValue === "number" ? listValue : 0;
    const mainDiscount = form.getValues("price.discountValue");
    const mainDiscountTypeValue = form.getValues("price.discountType") ?? "percent";
    const baseFinal =
      numericMainList > 0
        ? calculateProductFinalPrice(numericMainList, mainDiscount, mainDiscountTypeValue, sellerPricing)
        : 0;
    // `fields` only refreshes on append/remove/replace, not setValue, so read
    // live values to keep image uploads and stock edits.
    const currentVariants = form.getValues("variants") ?? [];
    const hasExistingDefault = currentVariants.some((variant) => variant?.isDefault);
    const productImages = (form.getValues("images") || []).filter(
      (image): image is string => typeof image === "string" && image.length > 0
    );

    const next = combinations.map((valueIndexes, index) => {
      const localized = buildVariantLocalizedFromCombo(validTypes, valueIndexes);
      const comboSlug = valueIndexes
        .map((valueIndex, typeIndex) =>
          (validTypes[typeIndex]?.localized.en.values[valueIndex] ||
            validTypes[typeIndex]?.localized.ar.values[valueIndex] ||
            "value"
          )
            .toLowerCase()
            .replace(/\s+/g, "-")
        )
        .join("-");

      const existing = currentVariants.find((variant) =>
        getVariantValueIndexes(validTypes, variant as never).every(
          (valueIndex, typeIndex) => valueIndex === valueIndexes[typeIndex]
        )
      );

      const isDefault = existing?.isDefault ?? (!hasExistingDefault && index === 0);
      const images = isDefault
        ? productImages
        : existing?.images?.length
          ? existing.images
          : existing?.imageUrl
            ? [existing.imageUrl]
            : [];

      return {
        id: existing?.id,
        title: localized.en.title || localized.ar.title,
        sku: existing?.sku || `${baseSku}-${comboSlug}`.toUpperCase(),
        listPrice: existing?.listPrice ?? numericMainList,
        discountValue: existing?.discountValue ?? mainDiscount ?? 0,
        discountType: existing?.discountType ?? mainDiscountTypeValue,
        price: existing?.price || baseFinal || numericMainList,
        discountEndsAt: existing?.discountEndsAt ?? null,
        stock: existing?.stock || 0,
        isDefault,
        images,
        imageUrl: images[0] ?? undefined,
        localized,
        optionValueIndexes: valueIndexes,
        option1: localized.en.option1,
        option2: localized.en.option2,
        option3: localized.en.option3,
        barCode: existing?.barCode || "",
        position: index + 1,
      };
    });

    replace(next as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantTypes, replace]);

  const updateType = (id: string, update: (type: VariantTypeFormValue) => VariantTypeFormValue) =>
    setVariantTypes(variantTypes.map((type) => (type.id === id ? update(type) : type)));

  const addType = () => {
    const used = new Set(variantTypes.map((type) => type.kind));
    const kind = DEFAULT_KINDS.find((k) => !used.has(k));
    const preset = VARIANT_TYPE_PRESETS.find((p) => p.kind === kind);
    const type = createEmptyVariantType();
    setVariantTypes([
      ...variantTypes,
      preset
        ? {
            ...type,
            kind: preset.kind,
            localized: {
              en: { ...type.localized.en, name: preset.en },
              ar: { ...type.localized.ar, name: preset.ar },
            },
          }
        : type,
    ]);
  };

  const selectKind = (id: string, kind: VariantOptionKind) =>
    updateType(id, (type) => {
      const preset = VARIANT_TYPE_PRESETS.find((p) => p.kind === kind);
      return {
        ...type,
        kind,
        localized: preset
          ? {
              en: { ...type.localized.en, name: preset.en },
              ar: { ...type.localized.ar, name: preset.ar },
            }
          : {
              en: { ...type.localized.en, name: "" },
              ar: { ...type.localized.ar, name: "" },
            },
      };
    });

  const otherLocale: SupportedLocale = activeLocale === "en" ? "ar" : "en";

  const appendValue = (id: string, raw: string) =>
    updateType(id, (type) => {
      const value = raw.trim();
      if (!value) return type;
      const existing = type.localized[activeLocale].values;
      if (existing.some((v) => v.trim().toLowerCase() === value.toLowerCase())) return type;
      return {
        ...type,
        localized: {
          ...type.localized,
          [activeLocale]: { ...type.localized[activeLocale], values: [...existing, value] },
          [otherLocale]: {
            ...type.localized[otherLocale],
            values: [...type.localized[otherLocale].values, ""],
          },
        } as VariantTypeFormValue["localized"],
        swatches: [
          ...(type.swatches ?? []),
          type.kind === "color" ? (COLOR_GUESS[value.toLowerCase()] ?? "") : "",
        ],
      };
    });

  const removeValue = (id: string, valueIndex: number) =>
    updateType(id, (type) => ({
      ...type,
      localized: {
        en: {
          ...type.localized.en,
          values: type.localized.en.values.filter((_, i) => i !== valueIndex),
        },
        ar: {
          ...type.localized.ar,
          values: type.localized.ar.values.filter((_, i) => i !== valueIndex),
        },
      },
      swatches: (type.swatches ?? []).filter((_, i) => i !== valueIndex),
    }));

  const renameValue = (id: string, valueIndex: number, value: string) =>
    updateType(id, (type) => {
      const values = [...type.localized[activeLocale].values];
      while (values.length <= valueIndex) values.push("");
      values[valueIndex] = value.trim();
      return {
        ...type,
        localized: {
          ...type.localized,
          [activeLocale]: { ...type.localized[activeLocale], values },
        } as VariantTypeFormValue["localized"],
      };
    });

  const setSwatch = (id: string, valueIndex: number, hex: string) =>
    updateType(id, (type) => {
      const swatches = [...(type.swatches ?? [])];
      swatches[valueIndex] = hex;
      return { ...type, swatches };
    });

  const setDefault = (index: number) =>
    (form.getValues("variants") ?? []).forEach((_, i) =>
      form.setValue(`variants.${i}.isDefault`, i === index, { shouldDirty: true })
    );

  if (variantTypes.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-3.5 rounded-xl border-[1.5px] border-dashed border-input p-4 text-[13px] text-muted-foreground">
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-muted text-primary-ink">
          <Layers className="size-[18px]" />
        </span>
        <div className="min-w-[180px] flex-1">
          <b className="block text-sm font-semibold text-foreground">{t("emptyTitle")}</b>
          {t("emptyBody")}
        </div>
        <Button type="button" variant="neutral" className={SMALL_BUTTON_CLASS} onClick={addType}>
          <Plus />
          {t("addOption")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        {variantTypes.map((type) => (
          <div
            key={type.id}
            className="grid grid-cols-1 items-start gap-2.5 rounded-xl border bg-muted p-3 sm:grid-cols-[180px_minmax(0,1fr)_auto]"
          >
            <div className="flex flex-col gap-2">
              <select
                aria-label={t("optionName")}
                value={type.kind}
                onChange={(e) => selectKind(type.id, e.target.value as VariantOptionKind)}
                className={SELECT_CLASS}
                style={{ backgroundImage: CHEVRON_BG }}
              >
                {VARIANT_TYPE_PRESETS.map((preset) => (
                  <option key={preset.kind} value={preset.kind}>
                    {activeLocale === "en" ? preset.en : preset.ar}
                  </option>
                ))}
                <option value="custom">{t("other")}</option>
              </select>
              {type.kind === "custom" && (
                <Input
                  aria-label={t("optionName")}
                  value={type.localized[activeLocale].name}
                  onChange={(e) =>
                    updateType(type.id, (current) => ({
                      ...current,
                      localized: {
                        ...current.localized,
                        [activeLocale]: { ...current.localized[activeLocale], name: e.target.value },
                      } as VariantTypeFormValue["localized"],
                    }))
                  }
                  placeholder={
                    activeLocale === "en" ? t("customNamePlaceholderEn") : t("customNamePlaceholderAr")
                  }
                  className={cn(FIELD_CLASS, contentDirClass(activeLocale))}
                />
              )}
              {type.kind === "weight" && (
                <select
                  aria-label={t("unit")}
                  value={type.unit ?? ""}
                  onChange={(e) => updateType(type.id, (current) => ({ ...current, unit: e.target.value }))}
                  className={SELECT_CLASS}
                  style={{ backgroundImage: CHEVRON_BG }}
                >
                  <option value="" disabled>
                    {t("unit")}
                  </option>
                  {WEIGHT_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <ValueChips
              type={type}
              activeLocale={activeLocale}
              onAdd={(value) => appendValue(type.id, value)}
              onRemove={(index) => removeValue(type.id, index)}
              onRename={(index, value) => renameValue(type.id, index, value)}
              onSwatch={(index, hex) => setSwatch(type.id, index, hex)}
            />

            <Button
              type="button"
              variant="soft"
              size="icon"
              className="size-11 rounded-[10px] hover:text-destructive"
              onClick={() => setVariantTypes(variantTypes.filter((item) => item.id !== type.id))}
              aria-label={t("removeOption")}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>

      {variantTypes.length < MAX_OPTION_TYPES && (
        <Button
          type="button"
          variant="neutral"
          className={cn(SMALL_BUTTON_CLASS, "self-start")}
          onClick={addType}
        >
          <Plus />
          {t("addAnotherOption")}
        </Button>
      )}

      {fields.length > 0 && (
        <VariantsTable
          fieldIds={fields.map((field) => field.id)}
          variants={variants}
          activeLocale={activeLocale}
          sellerPricing={sellerPricing}
          mainImages={mainImages}
          mainFinalPrice={typeof mainFinalPrice === "number" ? mainFinalPrice : 0}
          onSetDefault={setDefault}
        />
      )}
    </div>
  );
}

function ValueChips({
  type,
  activeLocale,
  onAdd,
  onRemove,
  onRename,
  onSwatch,
}: {
  type: VariantTypeFormValue;
  activeLocale: SupportedLocale;
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  onRename: (index: number, value: string) => void;
  onSwatch: (index: number, hex: string) => void;
}) {
  const t = useTranslations("productForm.variants");
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const otherLocale: SupportedLocale = activeLocale === "en" ? "ar" : "en";
  const current = type.localized[activeLocale].values;
  const other = type.localized[otherLocale].values;
  const count = Math.max(current.length, other.length);

  const commitDraft = () => {
    if (draft.trim()) onAdd(draft);
    setDraft("");
  };

  return (
    <div
      className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[10px] border border-input bg-card px-2 py-1.5 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/20"
      onClick={(e) => {
        if (e.target === e.currentTarget) inputRef.current?.focus();
      }}
    >
      {Array.from({ length: count }, (_, index) => {
        const own = current[index] ?? "";
        const fallback = other[index] ?? "";
        const missing = !own.trim() && !!fallback.trim();
        const label = own || fallback;

        if (editing === index) {
          return (
            <input
              key={index}
              autoFocus
              defaultValue={own}
              placeholder={fallback}
              dir={activeLocale === "ar" ? "rtl" : "ltr"}
              onBlur={(e) => {
                onRename(index, e.target.value);
                setEditing(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
                if (e.key === "Escape") setEditing(null);
              }}
              className="h-7 w-28 rounded-lg border border-primary bg-card px-2 text-xs outline-none"
            />
          );
        }

        return (
          <span
            key={index}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-lg ps-2.5 pe-1.5 text-xs font-semibold",
              missing
                ? "border border-dashed border-accent-ink/40 bg-accent-soft text-accent-ink"
                : "bg-primary-soft text-primary-ink"
            )}
          >
            {type.kind === "color" && (
              <label
                className="relative size-3.5 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-black/15"
                style={{
                  background:
                    type.swatches?.[index] ||
                    "conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)",
                }}
              >
                <input
                  type="color"
                  value={type.swatches?.[index] || "#000000"}
                  onChange={(e) => onSwatch(index, e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label={t("swatch")}
                />
              </label>
            )}
            <button
              type="button"
              onClick={() => setEditing(index)}
              title={missing ? t("missingTranslation") : undefined}
              className="max-w-40 truncate"
            >
              {label}
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={t("removeValue", { value: label })}
              className="grid place-items-center rounded opacity-70 hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </span>
        );
      })}
      <input
        ref={inputRef}
        value={draft}
        dir={activeLocale === "ar" ? "rtl" : "ltr"}
        onChange={(e) => setDraft(e.target.value.replace(/[,،]/g, ""))}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === "," || e.key === "،") && draft.trim()) {
            e.preventDefault();
            commitDraft();
          } else if (e.key === "Enter") {
            e.preventDefault();
          } else if (e.key === "Backspace" && !draft && count > 0) {
            onRemove(count - 1);
          }
        }}
        onBlur={commitDraft}
        placeholder={count > 0 ? t("valuesPlaceholder") : t("valuesPlaceholderFirst")}
        className="h-7 min-w-[110px] flex-1 bg-transparent text-[13px] outline-none placeholder:text-faint"
      />
    </div>
  );
}

function VariantsTable({
  fieldIds,
  variants,
  activeLocale,
  sellerPricing,
  mainImages,
  mainFinalPrice,
  onSetDefault,
}: {
  fieldIds: string[];
  variants: NonNullable<AddProductFormData["variants"]>;
  activeLocale: SupportedLocale;
  sellerPricing: SellerPricingSettings;
  mainImages: string[];
  mainFinalPrice: number;
  onSetDefault: (index: number) => void;
}) {
  const t = useTranslations("productForm.variants");
  const tPricing = useTranslations("productForm.variantPricing");
  const tStock = useTranslations("productForm.sections.stock");
  const locale = useLocale();
  const form = useFormContext<AddProductFormData>();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        {t("combinationsHint", { count: fieldIds.length })}
      </p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {[
                t("columns.variant"),
                t("columns.images"),
                t("columns.pricing"),
                t("columns.stock"),
                t("columns.barcode"),
              ].map((heading) => (
                <th
                  key={heading}
                  className="border-b bg-muted px-3 py-2.5 text-start text-xs font-medium whitespace-nowrap text-muted-foreground"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fieldIds.map((fieldId, index) => {
              const variant = variants[index];
              const isDefault = variant?.isDefault === true;
              const localized = variant?.localized?.[activeLocale];
              const options = [localized?.option1, localized?.option2, localized?.option3]
                .filter(Boolean)
                .map((option) => String(option).split(":").pop()?.trim() || String(option));

              return (
                <tr key={fieldId} className="align-top [&:last-child>td]:border-b-0">
                  <td className="border-b px-3 py-3">
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="radio"
                        name="default-variant"
                        checked={isDefault}
                        onChange={() => onSetDefault(index)}
                        className="mt-1 size-4 accent-[var(--primary)]"
                        aria-label={t("setDefault", { name: localized?.title || variant?.title || "" })}
                      />
                      <span className="flex flex-col gap-1">
                        <span className="flex flex-wrap gap-1">
                          {(options.length ? options : [variant?.title]).map((option) => (
                            <span
                              key={option}
                              className="rounded-md border bg-muted px-1.5 text-xs whitespace-nowrap"
                            >
                              {option}
                            </span>
                          ))}
                        </span>
                        {isDefault && (
                          <span className="w-fit rounded-[5px] bg-primary-soft px-1.5 text-[10px] leading-[18px] font-bold text-primary-ink">
                            {t("default")}
                          </span>
                        )}
                      </span>
                    </label>
                  </td>
                  <td className="border-b px-3 py-3">
                    {isDefault ? (
                      <MainImagesPreview images={mainImages} />
                    ) : (
                      <Controller
                        name={`variants.${index}.images`}
                        control={form.control}
                        render={({ field }) => (
                          <ImageUpload
                            bucket="products"
                            value={field.value || []}
                            onChange={(images) => {
                              field.onChange(images);
                              form.setValue(`variants.${index}.imageUrl`, images[0] ?? undefined);
                            }}
                            maxImages={5}
                            compact
                          />
                        )}
                      />
                    )}
                  </td>
                  <td className="border-b px-3 py-3">
                    {isDefault ? (
                      <div className="min-w-[180px]">
                        <p className="text-xs text-muted-foreground">{tPricing("usesMainPrice")}</p>
                        <p className="font-sans font-semibold tabular-nums">
                          {mainFinalPrice > 0 ? formatMoney(mainFinalPrice, locale) : "—"}
                        </p>
                      </div>
                    ) : (
                      <VariantPricingFields index={index} sellerPricing={sellerPricing} />
                    )}
                  </td>
                  <td className="border-b px-3 py-3">
                    <div className="w-32">
                      {/* The default variant's stock follows the main quantity. */}
                      <Controller
                        name={`variants.${index}.stock`}
                        control={form.control}
                        render={({ field }) => (
                          <NumberStepper
                            size="sm"
                            value={field.value}
                            onChange={(value) => field.onChange(value ?? 0)}
                            onBlur={field.onBlur}
                            disabled={isDefault}
                            inputLabel={t("columns.stock")}
                            decrementLabel={tStock("decrease")}
                            incrementLabel={tStock("increase")}
                          />
                        )}
                      />
                    </div>
                  </td>
                  <td className="border-b px-3 py-3">
                    <Controller
                      name={`variants.${index}.barCode`}
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          dir="ltr"
                          placeholder="—"
                          className="h-9 w-32 rounded-[10px] text-[13px]"
                        />
                      )}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MainImagesPreview({ images }: { images: string[] }) {
  const tPricing = useTranslations("productForm.variantPricing");
  return (
    <div className="flex min-w-[120px] flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{tPricing("usesMainImages")}</span>
      <div className="flex flex-wrap gap-1">
        {images.slice(0, 4).map((image) => (
          <RemoteImage key={image} src={getPublicUrl(image, "products")} alt="" width={36} height={36} className="size-9 rounded-md border object-cover" />
        ))}
      </div>
    </div>
  );
}

