"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronDown, ImageIcon, Layers, Plus, RotateCcw, Star, Trash2, X } from "lucide-react";
import { Chip, Chips, IconButton, NativeSelect, Note, SellerButton, Tag, TextInput } from "@/components/seller-ui";
import { cn, getPublicUrl } from "@/lib/utils";
import { contentDirClass } from "@/lib/i18n/content-dir";
import { useAccountMoney } from "@/components/account-money.client";
import { Money } from "@/components/money";
import { calculateProductFinalPrice, type SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import {
  buildVariantLocalizedFromCombo,
  createEmptyVariantType,
  reconstructVariantTypesFromVariants,
  VARIANT_TYPE_PRESETS,
  WEIGHT_UNITS,
  type VariantTypeFormValue,
} from "@/lib/utils/variant-types.lib";
import { ImageUpload } from "@/components/inputs/image-upload";
import { RemoteImage } from "@/components/media/remote-image";
import { FieldHint, NumberStepper } from "../form-kit";
import { toAsciiDigits } from "@/components/form/form-ui";
import { VariantPricingFields } from "../steps/variant-pricing-fields";
import type { AddProductFormData, SupportedLocale, VariantOptionKind } from "../add-product.schema";
import { MoneyField, useFieldError } from "./fields";
import { isValidVariantType, missingComboCount, reconcileCombos, type ComboRow } from "./variant-combos.lib";

const MAX_OPTION_TYPES = 3;
const DEFAULT_KINDS: VariantOptionKind[] = ["color", "size", "material"];
/** A list this long is slow to scan on a phone, so the seller is told. */
const MANY_COMBINATIONS = 60;

type VariantRow = NonNullable<AddProductFormData["variants"]>[number];
type Suggestion = { en: string; ar: string; hex?: string };

// One tap adds the value in both languages, so most sellers never have to translate it.
const COLOR_SUGGESTIONS: Suggestion[] = [
  { en: "Black", ar: "أسود", hex: "#171717" },
  { en: "White", ar: "أبيض", hex: "#ffffff" },
  { en: "Red", ar: "أحمر", hex: "#ef4444" },
  { en: "Blue", ar: "أزرق", hex: "#3b82f6" },
  { en: "Navy", ar: "كحلي", hex: "#1e3a8a" },
  { en: "Green", ar: "أخضر", hex: "#22c55e" },
  { en: "Gray", ar: "رمادي", hex: "#9ca3af" },
  { en: "Beige", ar: "بيج", hex: "#e7d7c1" },
  { en: "Brown", ar: "بني", hex: "#92400e" },
  { en: "Pink", ar: "وردي", hex: "#ec4899" },
  { en: "Yellow", ar: "أصفر", hex: "#eab308" },
  { en: "Purple", ar: "بنفسجي", hex: "#a855f7" },
  { en: "Orange", ar: "برتقالي", hex: "#f97316" },
  { en: "Gold", ar: "ذهبي", hex: "#d4af37" },
  { en: "Silver", ar: "فضي", hex: "#c0c0c0" },
];
const SIZE_SUGGESTIONS: Suggestion[] = ["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((size) => ({ en: size, ar: size }));
const SUGGESTIONS: Partial<Record<VariantOptionKind, Suggestion[]>> = { color: COLOR_SUGGESTIONS, size: SIZE_SUGGESTIONS };

/** A typed common value is written in both languages too. */
function knownValue(kind: VariantOptionKind, raw: string): Suggestion | undefined {
  const value = raw.trim().toLowerCase();
  return SUGGESTIONS[kind]?.find((item) => item.en.toLowerCase() === value || item.ar === raw.trim());
}

const rowsSignature = (rows: { sku?: string }[]) => rows.map((row) => row.sku ?? "").join("|");

/**
 * Options (color, size…) as chips with one-tap suggestions, and the combinations
 * they make, each with its price, stock, SKU and photos. A combination can be
 * removed for good, and every value in view can be changed at once. Values are
 * index-aligned across languages; the default combination is the product's own
 * price, stock and photos.
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

  const variantTypes = (useWatch({ control: form.control, name: "variantTypes" }) ?? []) as VariantTypeFormValue[];
  // What the seller's edit started from. Empty: the change came from outside the editor.
  const editedFrom = useRef<VariantTypeFormValue[] | null>(null);
  const lastTypes = useRef<string | null>(null);
  const lastRows = useRef<string | null>(null);

  const setVariantTypes = (next: VariantTypeFormValue[]) => {
    editedFrom.current = variantTypes;
    form.setValue("variantTypes", next, { shouldDirty: true });
  };

  // Edit page / import: rebuild option types from stored variants.
  useEffect(() => {
    const currentTypes = form.getValues("variantTypes") ?? [];
    const currentVariants = form.getValues("variants") ?? [];
    if (currentTypes.length === 0 && currentVariants.length > 0) {
      form.setValue("variantTypes", reconstructVariantTypesFromVariants(currentVariants), { shouldDirty: false });
    }
  }, [form]);

  const [mainListPrice, mainDiscountValue, mainDiscountType, mainFinalPrice, mainQuantity] = useWatch({
    control: form.control,
    name: ["price.list", "price.discountValue", "price.discountType", "price.final", "quantity"],
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
      (image): image is string => typeof image === "string" && image.length > 0,
    );
    const syncedImageUrl = syncedImages[0];
    const current = form.getValues(`variants.${defaultVariantIndex}`);
    const currentImages = Array.isArray(current?.images) ? current.images : [];
    const imagesMatch =
      currentImages.length === syncedImages.length && currentImages.every((image, index) => image === syncedImages[index]);

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
  }, [defaultVariantIndex, form, mainDiscountType, mainDiscountValue, mainFinalPrice, mainImages, mainListPrice, mainQuantity, sellerPricing]);

  /** The product takes a combination's price and stock when it becomes the default, so they aren't overwritten. */
  const adoptAsMain = (row: VariantRow | undefined) => {
    if (!row) return;
    const opts = { shouldDirty: true } as const;
    if (typeof row.listPrice === "number" && row.listPrice > 0) form.setValue("price.list", row.listPrice, opts);
    if (typeof row.price === "number" && row.price > 0) form.setValue("price.final", row.price, opts);
    if (typeof row.stock === "number") form.setValue("quantity", row.stock, opts);
  };

  /** Writes the rows the combinations ask for, keeping what was entered for those that still exist. */
  const writeRows = (types: VariantTypeFormValue[], combos: ComboRow<VariantRow>[]) => {
    const baseSku = form.getValues("sku") || "PROD";
    const listValue = form.getValues("price.list");
    const numericMainList = typeof listValue === "number" ? listValue : 0;
    const mainDiscount = form.getValues("price.discountValue");
    const mainDiscountTypeValue = form.getValues("price.discountType") ?? "percent";
    const baseFinal =
      numericMainList > 0
        ? calculateProductFinalPrice(numericMainList, mainDiscount, mainDiscountTypeValue, sellerPricing)
        : 0;
    const hasDefault = combos.some((combo) => combo.existing?.isDefault);
    const productImages = (form.getValues("images") || []).filter(
      (image): image is string => typeof image === "string" && image.length > 0,
    );

    const next = combos.map(({ valueIndexes, existing }, index) => {
      const localized = buildVariantLocalizedFromCombo(types, valueIndexes);
      const comboSlug = valueIndexes
        .map((valueIndex, typeIndex) =>
          (types[typeIndex]?.localized.en.values[valueIndex] || types[typeIndex]?.localized.ar.values[valueIndex] || "value")
            .toLowerCase()
            .replace(/\s+/g, "-"),
        )
        .join("-");

      const isDefault = hasDefault ? existing?.isDefault === true : index === 0;
      if (isDefault && !hasDefault) adoptAsMain(existing);
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

    lastRows.current = rowsSignature(next);
    replace(next as never);
  };

  // Rebuild the combinations whenever the options change.
  useEffect(() => {
    // Types are still being reconstructed from stored variants (edit page):
    // wait for them instead of wiping the variants.
    if (variantTypes.length === 0 && (form.getValues("variantTypes")?.length ?? 0) > 0) return;

    const typesKey = JSON.stringify(variantTypes);
    if (typesKey === lastTypes.current) return;
    lastTypes.current = typesKey;

    const validTypes = variantTypes.filter(isValidVariantType);
    const prevTypes = editedFrom.current;
    editedFrom.current = null;
    // `fields` only refreshes on append/remove/replace, not setValue, so read live values.
    const current = (form.getValues("variants") ?? []) as VariantRow[];

    if (validTypes.length === 0) {
      if (current.length > 0) replace([]);
      lastRows.current = "";
      return;
    }

    // Only the options were written from outside (the AI): new combinations join the rows.
    const optionsOnly = !prevTypes && lastRows.current !== null && lastRows.current === rowsSignature(current);
    writeRows(validTypes, reconcileCombos({ prevTypes, nextTypes: variantTypes, variants: current, fillMissing: optionsOnly }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantTypes, replace]);

  const updateType = (id: string, update: (type: VariantTypeFormValue) => VariantTypeFormValue) =>
    setVariantTypes(variantTypes.map((type) => (type.id === id ? update(type) : type)));

  const addType = (wanted?: VariantOptionKind) => {
    const used = new Set(variantTypes.map((type) => type.kind));
    const kind = wanted ?? DEFAULT_KINDS.find((k) => !used.has(k));
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

  const appendValue = (id: string, raw: string, suggestion?: Suggestion) =>
    updateType(id, (type) => {
      const value = raw.trim();
      if (!value) return type;
      const existing = type.localized[activeLocale].values;
      if (existing.some((v) => v.trim().toLowerCase() === value.toLowerCase())) return type;
      const known = suggestion ?? knownValue(type.kind, value);
      return {
        ...type,
        localized: {
          ...type.localized,
          [activeLocale]: { ...type.localized[activeLocale], values: [...existing, value] },
          [otherLocale]: {
            ...type.localized[otherLocale],
            values: [...type.localized[otherLocale].values, known?.[otherLocale] ?? ""],
          },
        } as VariantTypeFormValue["localized"],
        swatches: [...(type.swatches ?? []), type.kind === "color" ? (known?.hex ?? "") : ""],
      };
    });

  const removeValue = (id: string, valueIndex: number) =>
    updateType(id, (type) => ({
      ...type,
      localized: {
        en: { ...type.localized.en, values: type.localized.en.values.filter((_, i) => i !== valueIndex) },
        ar: { ...type.localized.ar, values: type.localized.ar.values.filter((_, i) => i !== valueIndex) },
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

  const setDefault = (index: number) => {
    const rows = (form.getValues("variants") ?? []) as VariantRow[];
    adoptAsMain(rows[index]);
    rows.forEach((_, i) => form.setValue(`variants.${i}.isDefault`, i === index, { shouldDirty: true }));
  };

  const removeCombination = (index: number) => {
    const rows = (form.getValues("variants") ?? []) as VariantRow[];
    const kept = rows.filter((_, i) => i !== index);
    if (rows[index]?.isDefault && kept[0]) {
      adoptAsMain(kept[0]);
      kept[0] = { ...kept[0], isDefault: true };
    }
    const next = kept.map((row, i) => ({ ...row, position: i + 1 }));
    lastRows.current = rowsSignature(next);
    replace(next as never);
  };

  const restoreCombinations = () => {
    const current = (form.getValues("variants") ?? []) as VariantRow[];
    const validTypes = variantTypes.filter(isValidVariantType);
    writeRows(validTypes, reconcileCombos({ nextTypes: variantTypes, variants: current, fillMissing: true }));
  };

  const removedCount = missingComboCount(variantTypes, fields.length);

  if (variantTypes.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-dashed border-(--s-field-strong) p-4 text-[13px] text-(--s-muted)">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink">
            <Layers className="size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <b className="block text-sm font-bold text-(--s-ink)">{t("emptyTitle")}</b>
            {t("emptyBody")}
          </div>
        </div>
        <Chips>
          {(["color", "size"] as const).map((kind) => (
            <Chip key={kind} onClick={() => addType(kind)}>
              <Plus className="size-3.5" aria-hidden />
              {VARIANT_TYPE_PRESETS.find((p) => p.kind === kind)?.[activeLocale]}
            </Chip>
          ))}
          <Chip onClick={() => addType("custom")}>
            <Plus className="size-3.5" aria-hidden />
            {t("otherOption")}
          </Chip>
        </Chips>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        {variantTypes.map((type, index) => (
          <OptionCard
            key={type.id}
            type={type}
            autoFocus={index === variantTypes.length - 1}
            activeLocale={activeLocale}
            onKind={(kind) => selectKind(type.id, kind)}
            onName={(name) =>
              updateType(type.id, (current) => ({
                ...current,
                localized: {
                  ...current.localized,
                  [activeLocale]: { ...current.localized[activeLocale], name },
                } as VariantTypeFormValue["localized"],
              }))
            }
            onUnit={(unit) => updateType(type.id, (current) => ({ ...current, unit }))}
            onRemove={() => setVariantTypes(variantTypes.filter((item) => item.id !== type.id))}
            onAdd={(value, suggestion) => appendValue(type.id, value, suggestion)}
            onRemoveValue={(valueIndex) => removeValue(type.id, valueIndex)}
            onRename={(valueIndex, value) => renameValue(type.id, valueIndex, value)}
            onSwatch={(valueIndex, hex) => setSwatch(type.id, valueIndex, hex)}
          />
        ))}
      </div>

      {variantTypes.length < MAX_OPTION_TYPES && (
        <SellerButton type="button" variant="mini" size="sm" className="self-start" onClick={() => addType()}>
          <Plus aria-hidden />
          {t("addAnotherOption")}
        </SellerButton>
      )}

      {fields.length === 0 && removedCount === 0 && <FieldHint>{t("noValuesHint")}</FieldHint>}

      {removedCount > 0 && (
        <Note tone={fields.length === 0 ? "danger" : undefined}>
          <span className="flex flex-wrap items-center justify-between gap-2">
            {fields.length === 0 ? t("allRemoved") : t("removedNote", { count: removedCount })}
            <button
              type="button"
              onClick={restoreCombinations}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 font-bold text-(--s-link) hover:underline"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              {t("restore")}
            </button>
          </span>
        </Note>
      )}

      {fields.length > 0 && (
        <CombinationsList
          fieldIds={fields.map((field) => field.id)}
          variants={variants}
          types={variantTypes.filter(isValidVariantType)}
          activeLocale={activeLocale}
          sellerPricing={sellerPricing}
          mainImages={mainImages}
          onSetDefault={setDefault}
          onRemove={removeCombination}
        />
      )}
    </div>
  );
}

/** One option: its kind, its values as chips, and the common values one tap away. */
function OptionCard({
  type,
  autoFocus,
  activeLocale,
  onKind,
  onName,
  onUnit,
  onRemove,
  onAdd,
  onRemoveValue,
  onRename,
  onSwatch,
}: {
  type: VariantTypeFormValue;
  autoFocus: boolean;
  activeLocale: SupportedLocale;
  onKind: (kind: VariantOptionKind) => void;
  onName: (name: string) => void;
  onUnit: (unit: string) => void;
  onRemove: () => void;
  onAdd: (value: string, suggestion?: Suggestion) => void;
  onRemoveValue: (index: number) => void;
  onRename: (index: number, value: string) => void;
  onSwatch: (index: number, hex: string) => void;
}) {
  const t = useTranslations("productForm.variants");
  const taken = new Set([...type.localized.en.values, ...type.localized.ar.values].map((value) => value.trim().toLowerCase()));
  const suggestions = (SUGGESTIONS[type.kind] ?? []).filter(
    (item) => !taken.has(item.en.toLowerCase()) && !taken.has(item.ar.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-(--s-line) bg-(--s-surface-2) p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5 min-[721px]:grid-cols-[180px_minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col gap-2">
          <NativeSelect
            aria-label={t("optionName")}
            value={type.kind}
            onChange={(e) => onKind(e.target.value as VariantOptionKind)}
            className="cursor-pointer"
          >
            {VARIANT_TYPE_PRESETS.map((preset) => (
              <option key={preset.kind} value={preset.kind}>
                {activeLocale === "en" ? preset.en : preset.ar}
              </option>
            ))}
            <option value="custom">{t("other")}</option>
          </NativeSelect>
          {type.kind === "custom" && (
            <TextInput
              aria-label={t("optionName")}
              value={type.localized[activeLocale].name}
              onChange={(e) => onName(e.target.value)}
              placeholder={activeLocale === "en" ? t("customNamePlaceholderEn") : t("customNamePlaceholderAr")}
              className={contentDirClass(activeLocale)}
            />
          )}
          {type.kind === "weight" && (
            <NativeSelect aria-label={t("unit")} value={type.unit ?? ""} onChange={(e) => onUnit(e.target.value)} className="cursor-pointer">
              <option value="" disabled>
                {t("unit")}
              </option>
              {WEIGHT_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </NativeSelect>
          )}
        </div>

        <ValueChips
          className="max-[720px]:order-last max-[720px]:col-span-2"
          type={type}
          autoFocus={autoFocus && type.localized.en.values.length === 0 && type.localized.ar.values.length === 0}
          activeLocale={activeLocale}
          onAdd={onAdd}
          onRemove={onRemoveValue}
          onRename={onRename}
          onSwatch={onSwatch}
        />

        <IconButton type="button" onClick={onRemove} aria-label={t("removeOption")} className="mt-[3px] hover:text-destructive">
          <Trash2 aria-hidden />
        </IconButton>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-(--s-faint)">{t("suggestionsLabel")}</span>
          {suggestions.slice(0, 8).map((item) => (
            <button
              key={item.en}
              type="button"
              onClick={() => onAdd(item[activeLocale], item)}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-(--s-field-strong) bg-(--s-surface) px-2.5 text-xs font-semibold text-(--s-body) transition-colors hover:border-(--s-primary) hover:text-(--s-primary) max-[600px]:h-10 max-[600px]:px-3 max-[600px]:text-[13px]"
            >
              {item.hex && <i aria-hidden className="size-3 rounded-full ring-1 ring-black/15" style={{ background: item.hex }} />}
              {item[activeLocale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ValueChips({
  className,
  type,
  autoFocus,
  activeLocale,
  onAdd,
  onRemove,
  onRename,
  onSwatch,
}: {
  className?: string;
  type: VariantTypeFormValue;
  autoFocus?: boolean;
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
      className={cn(
        "flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) px-2 py-1.5 transition-[border-color,box-shadow] duration-150 focus-within:border-(--s-primary) focus-within:shadow-[0_0_0_3px_var(--s-focus-soft)]",
        className,
      )}
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
              className="h-8 w-28 rounded-full border border-(--s-primary) bg-(--s-surface) px-2.5 text-xs text-(--s-text) outline-none max-[600px]:h-10 max-[600px]:text-base"
            />
          );
        }

        return (
          <span
            key={index}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-full ps-2.5 pe-1 text-xs font-semibold max-[600px]:h-10 max-[600px]:text-[13px]",
              missing ? "border border-dashed border-accent-ink/40 bg-accent-soft text-accent-ink" : "bg-primary-soft text-primary-ink",
            )}
          >
            {type.kind === "color" && (
              <label
                className="relative size-4 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-black/15 max-[600px]:size-5"
                style={{
                  background: type.swatches?.[index] || "conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)",
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
              className="max-w-40 cursor-pointer truncate"
            >
              {label}
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={t("removeValue", { value: label })}
              className="grid size-6 cursor-pointer place-items-center rounded-full opacity-70 hover:opacity-100 max-[600px]:size-8"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        );
      })}
      <input
        ref={inputRef}
        autoFocus={autoFocus}
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
        enterKeyHint="done"
        aria-label={t("valueLabel")}
        placeholder={count > 0 ? t("valuesPlaceholder") : t("valuesPlaceholderFirst")}
        className="h-8 min-w-[110px] flex-1 bg-transparent text-[13px] text-(--s-text) outline-none placeholder:text-(--s-placeholder) max-[600px]:h-10"
      />
      {/* Some phone keyboards don't report Enter, so the value needs a visible way in. */}
      {draft.trim() && (
        <button
          type="button"
          aria-label={t("addThisValue")}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => {
            commitDraft();
            inputRef.current?.focus();
          }}
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-(--s-solid) text-(--s-solid-fg) min-[721px]:hidden"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

const ROW_GRID =
  "grid grid-cols-2 items-start gap-x-2.5 gap-y-2 min-[721px]:grid-cols-[minmax(0,1.5fr)_minmax(110px,1fr)_136px_minmax(110px,1fr)_84px] min-[721px]:items-center";

function CombinationsList({
  fieldIds,
  variants,
  types,
  activeLocale,
  sellerPricing,
  mainImages,
  onSetDefault,
  onRemove,
}: {
  fieldIds: string[];
  variants: VariantRow[];
  types: VariantTypeFormValue[];
  activeLocale: SupportedLocale;
  sellerPricing: SellerPricingSettings;
  mainImages: string[];
  onSetDefault: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  const t = useTranslations("productForm.variants");
  const form = useFormContext<AddProductFormData>();
  const { errors } = useFormState({ control: form.control, name: "variants" });
  const variantErrors = errors.variants as unknown[] | undefined;
  // Unlimited stock (0138, F-51): variants inherit it, so their counts are hidden and stay as saved.
  const trackStock = useWatch({ control: form.control, name: "trackStock" }) !== false;
  // One value per option picked here narrows the list, and what "apply" changes.
  const [scope, setScope] = useState<Record<string, number>>({});
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");

  const skuCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of variants) {
      const sku = row?.sku?.trim().toLowerCase();
      if (sku) counts.set(sku, (counts.get(sku) ?? 0) + 1);
    }
    return counts;
  }, [variants]);

  const inScope = (row: VariantRow | undefined) =>
    types.every((type, typeIndex) => scope[type.id] === undefined || row?.optionValueIndexes?.[typeIndex] === scope[type.id]);
  // A row with an error stays in view, or the seller never finds it.
  const visible = fieldIds.flatMap((_, index) => (inScope(variants[index]) || variantErrors?.[index] ? [index] : []));
  const scoped = Object.keys(scope).length > 0;

  const valueLabel = (type: VariantTypeFormValue, valueIndex: number) => {
    const other: SupportedLocale = activeLocale === "en" ? "ar" : "en";
    const value = type.localized[activeLocale].values[valueIndex]?.trim() || type.localized[other].values[valueIndex]?.trim() || "";
    return type.kind === "weight" && type.unit && value ? `${value} ${type.unit}` : value;
  };

  const applyBulk = () => {
    const price = Number(bulkPrice);
    const stock = Number(bulkStock);
    const setPrice = bulkPrice.trim() !== "" && Number.isFinite(price) && price > 0;
    const setStock = trackStock && bulkStock.trim() !== "" && Number.isInteger(stock) && stock >= 0;
    if (!setPrice && !setStock) {
      toast.error(t("bulkEmpty"));
      return;
    }
    const opts = { shouldDirty: true, shouldValidate: true } as const;
    for (const index of visible) {
      const isDefault = variants[index]?.isDefault === true;
      if (setPrice) form.setValue(isDefault ? "price.list" : `variants.${index}.listPrice`, price, opts);
      if (setStock) form.setValue(isDefault ? "quantity" : `variants.${index}.stock`, stock, opts);
    }
    setBulkPrice("");
    setBulkStock("");
    toast.success(t("bulkApplied", { count: visible.length }));
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 pt-1">
        <b className="text-[13.5px] font-bold text-(--s-ink)">{t("combinations")}</b>
        <Tag>{t("combinationsCount", { count: fieldIds.length })}</Tag>
      </div>

      {fieldIds.length > MANY_COMBINATIONS && <Note tone="amber">{t("tooMany", { count: fieldIds.length })}</Note>}

      {fieldIds.length > 1 && (
        <div className="flex flex-col gap-2.5 rounded-2xl bg-(--s-tint) p-3">
          {types.map((type) => (
            <Chips key={type.id} className="flex-nowrap overflow-x-auto [scrollbar-width:none]">
              <Chip
                className="h-8 shrink-0 px-3 text-xs max-[600px]:h-10"
                pressed={scope[type.id] === undefined}
                onClick={() => setScope(({ [type.id]: _cleared, ...rest }) => rest)}
              >
                {types.length > 1 ? t("allOf", { option: type.localized[activeLocale].name || type.localized.en.name || type.localized.ar.name }) : t("all")}
              </Chip>
              {Array.from({ length: Math.max(type.localized.en.values.length, type.localized.ar.values.length) }, (_, valueIndex) => (
                <Chip
                  key={valueIndex}
                  className="h-8 shrink-0 px-3 text-xs max-[600px]:h-10"
                  pressed={scope[type.id] === valueIndex}
                  onClick={() => setScope((prev) => ({ ...prev, [type.id]: valueIndex }))}
                >
                  {valueLabel(type, valueIndex)}
                </Chip>
              ))}
            </Chips>
          ))}
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-0 flex-[1_1_110px] flex-col gap-1 text-xs font-semibold text-(--s-muted)">
              {t("columns.price")}
              <TextInput
                dir="ltr"
                inputMode="decimal"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(toAsciiDigits(e.target.value).replace(/[^\d.]/g, ""))}
                placeholder="0.00"
                className="h-10 font-montserrat tabular-nums rtl:text-right"
              />
            </label>
            {trackStock && (
              <label className="flex min-w-0 flex-[1_1_90px] flex-col gap-1 text-xs font-semibold text-(--s-muted)">
                {t("columns.stock")}
                <TextInput
                  dir="ltr"
                  inputMode="numeric"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(toAsciiDigits(e.target.value).replace(/\D/g, ""))}
                  placeholder="0"
                  className="h-10 font-montserrat tabular-nums rtl:text-right"
                />
              </label>
            )}
            <SellerButton type="button" variant="solid" size="sm" className="h-10 flex-[1_1_auto] min-[721px]:flex-none" onClick={applyBulk}>
              {scoped ? t("applyToShown", { count: visible.length }) : t("applyToAll", { count: visible.length })}
            </SellerButton>
          </div>
        </div>
      )}

      <div className={cn(ROW_GRID, "px-3 text-xs font-semibold text-(--s-subtle) max-[720px]:hidden")} aria-hidden>
        <span>{t("columns.variant")}</span>
        <span>{t("columns.price")}</span>
        <span>{trackStock ? t("columns.stock") : ""}</span>
        <span>{t("columns.sku")}</span>
        <span />
      </div>

      <ul className="flex flex-col gap-2">
        {visible.map((index) => {
          const row = variants[index];
          const key = (row?.optionValueIndexes ?? [index]).join(".");
          return (
            <CombinationRow
              key={fieldIds[index]}
              index={index}
              row={row}
              chips={types.flatMap((type, typeIndex) => {
                const valueIndex = row?.optionValueIndexes?.[typeIndex];
                if (valueIndex === undefined) return [];
                return [{ label: valueLabel(type, valueIndex), swatch: type.kind === "color" ? type.swatches?.[valueIndex] : undefined }];
              })}
              open={openKey === key || Boolean(variantErrors?.[index])}
              onToggle={() => setOpenKey(openKey === key ? null : key)}
              trackStock={trackStock}
              canRemove={fieldIds.length > 1}
              duplicateSku={(skuCounts.get(row?.sku?.trim().toLowerCase() ?? "") ?? 0) > 1}
              sellerPricing={sellerPricing}
              mainImages={mainImages}
              onSetDefault={() => onSetDefault(index)}
              onRemove={() => onRemove(index)}
            />
          );
        })}
      </ul>
    </div>
  );
}

/**
 * One combination. Price and stock are always in reach; photos, discount,
 * barcode and (on phones) the SKU fold under it. The default row edits the
 * product's own price and stock, the same fields the sections above use.
 */
function CombinationRow({
  index,
  row,
  chips,
  open,
  onToggle,
  trackStock,
  canRemove,
  duplicateSku,
  sellerPricing,
  mainImages,
  onSetDefault,
  onRemove,
}: {
  index: number;
  row: VariantRow | undefined;
  chips: { label: string; swatch?: string }[];
  open: boolean;
  onToggle: () => void;
  trackStock: boolean;
  canRemove: boolean;
  duplicateSku: boolean;
  sellerPricing: SellerPricingSettings;
  mainImages: string[];
  onSetDefault: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("productForm.variants");
  const tPricing = useTranslations("productForm.variantPricing");
  const tStock = useTranslations("productForm.sections.stock");
  const locale = useLocale();
  const { unit } = useAccountMoney();
  const form = useFormContext<AddProductFormData>();
  const isDefault = row?.isDefault === true;
  const name = chips.map((chip) => chip.label).join(" / ") || row?.title || "";
  const priceName = isDefault ? "price.list" : `variants.${index}.listPrice`;
  const listError = useFieldError(priceName);
  const finalError = useFieldError(`variants.${index}.price`);
  const priceError = listError ?? finalError;
  const skuError = useFieldError(`variants.${index}.sku`);
  const image = isDefault ? mainImages[0] : (row?.images?.[0] ?? row?.imageUrl);
  const salePrice = Number(row?.price) || 0;
  const onSale = salePrice > 0 && salePrice < (Number(row?.listPrice) || 0);
  const priceId = `variant-price-${index}`;
  const stockId = `variant-stock-${index}`;
  const skuId = `variant-sku-${index}`;

  const renderSku = (id?: string) => (
    <Controller
      name={`variants.${index}.sku`}
      control={form.control}
      render={({ field }) => (
        <TextInput
          {...field}
          id={id}
          value={field.value ?? ""}
          dir="ltr"
          placeholder="—"
          aria-invalid={Boolean(skuError)}
          className={cn("h-10 font-montserrat text-xs rtl:text-right", skuError && "border-destructive")}
        />
      )}
    />
  );

  return (
    <li
      className={cn(
        "relative rounded-2xl border border-(--s-line) bg-(--s-surface) p-3 transition-colors",
        isDefault && "border-(--s-primary)/35",
        (priceError || skuError) && "border-destructive/45",
      )}
    >
      <div className={ROW_GRID}>
        <div className="col-span-2 flex min-w-0 items-center gap-2.5 pe-[88px] min-[721px]:col-span-1 min-[721px]:pe-0">
          <button
            type="button"
            onClick={onToggle}
            aria-label={t("details")}
            className="grid size-11 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-(--s-line) bg-(--s-fill) text-(--s-subtle)"
          >
            {image ? (
              <RemoteImage src={getPublicUrl(image, "products")} alt="" width={44} height={44} className="size-11 object-cover" />
            ) : (
              <ImageIcon className="size-4" aria-hidden />
            )}
          </button>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-1">
              {chips.map((chip, chipIndex) => (
                <span
                  key={chipIndex}
                  className="inline-flex items-center gap-1 rounded-full bg-(--s-fill) px-2 text-xs font-semibold leading-6 text-(--s-text)"
                >
                  {chip.swatch && <i aria-hidden className="size-2.5 rounded-full ring-1 ring-black/15" style={{ background: chip.swatch }} />}
                  {chip.label}
                </span>
              ))}
            </span>
            {isDefault && (
              <Tag tone="info" className="w-fit">
                {t("default")}
              </Tag>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={priceId} className="text-xs font-semibold text-(--s-muted) min-[721px]:sr-only">
            {t("columns.price")}
          </label>
          <MoneyField id={priceId} name={priceName} invalid={Boolean(priceError)} className="h-10" />
          {onSale && (
            <span className="font-montserrat text-[11px] font-semibold tabular-nums text-success">
              <Money value={salePrice} locale={locale} unit={unit} />
            </span>
          )}
        </div>

        <div className={cn("flex min-w-0 flex-col gap-1", !trackStock && "invisible max-[720px]:hidden")}>
          <label htmlFor={stockId} className="text-xs font-semibold text-(--s-muted) min-[721px]:sr-only">
            {t("columns.stock")}
          </label>
          {trackStock && (
            <Controller
              name={isDefault ? "quantity" : `variants.${index}.stock`}
              control={form.control}
              render={({ field }) => (
                <NumberStepper
                  id={stockId}
                  size="sm"
                  value={field.value as number | undefined}
                  onChange={(value) => field.onChange(value ?? 0)}
                  onBlur={field.onBlur}
                  decrementLabel={tStock("decrease")}
                  incrementLabel={tStock("increase")}
                />
              )}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1 max-[720px]:hidden">
          <label htmlFor={skuId} className="sr-only">
            {t("columns.sku")}
          </label>
          {renderSku(skuId)}
        </div>

        <div className="absolute end-2 top-2 flex items-center justify-end gap-1 min-[721px]:static">
          <IconButton type="button" onClick={onToggle} aria-expanded={open} aria-label={t("details")}>
            <ChevronDown className={cn("transition-transform duration-150", open && "rotate-180")} aria-hidden />
          </IconButton>
          {canRemove && (
            <IconButton type="button" onClick={onRemove} aria-label={t("removeCombination", { name })} className="hover:text-destructive">
              <Trash2 aria-hidden />
            </IconButton>
          )}
        </div>
      </div>

      {priceError && <p className="mt-1.5 text-xs font-semibold text-destructive">{priceError}</p>}
      {skuError && <p className="mt-1.5 text-xs font-semibold text-destructive">{skuError}</p>}
      {duplicateSku && !skuError && <p className="mt-1.5 text-xs font-semibold text-accent-ink">{t("duplicateSku")}</p>}

      {/* Stays mounted while folded: the discount fields keep this row's final price in step with its price. */}
      <div className={cn("mt-3 flex-col gap-3.5 border-t border-(--s-line-soft) pt-3", open ? "flex" : "hidden")}>
        <div className="flex flex-col gap-1.5 min-[721px]:hidden">
          <label htmlFor={`${skuId}-phone`} className="text-xs font-semibold text-(--s-muted)">
            {t("columns.sku")}
          </label>
          {renderSku(`${skuId}-phone`)}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-(--s-muted)">{t("columns.images")}</span>
          {isDefault ? (
            <FieldHint>{tPricing("usesMainImages")}</FieldHint>
          ) : (
            open && (
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
            )
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-(--s-muted)">{t("columns.discount")}</span>
          {isDefault ? (
            <FieldHint>{t("defaultDiscountHint")}</FieldHint>
          ) : (
            <VariantPricingFields index={index} sellerPricing={sellerPricing} />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`variant-barcode-${index}`} className="text-xs font-semibold text-(--s-muted)">
            {t("columns.barcode")}
          </label>
          <Controller
            name={`variants.${index}.barCode`}
            control={form.control}
            render={({ field }) => (
              <TextInput
                {...field}
                id={`variant-barcode-${index}`}
                value={field.value ?? ""}
                dir="ltr"
                placeholder="—"
                className="h-10 max-w-64 font-montserrat text-xs rtl:text-right"
              />
            )}
          />
        </div>

        {!isDefault && (
          <div>
            <SellerButton type="button" variant="mini" size="xs" onClick={onSetDefault}>
              <Star aria-hidden />
              {t("makeDefault")}
            </SellerButton>
          </div>
        )}
      </div>
    </li>
  );
}
