"use client";

import { variantHasStock } from "@/components/product-page/product-page.lib";
import { useMemo } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import type { ProductVariant } from "@/components/product-page/product-page.lib";
import type { Product } from "@/components/product-page/product-page.types";
import {
  buildVariantMatrix,
  pickVariant,
  selectedKeys,
  valueAvailable,
  type OptionGroup,
  type VariantMatrix,
} from "@/components/product-page/variant-options.lib";
import type { ProductLocale } from "@/lib/product-translations";
import { cn } from "@/lib/utils";
import { getVariantColor } from "@/lib/variant-colors";
import { getVariantImageUrls } from "@/lib/variant-images";
import { getVariantDisplayFields } from "@/lib/variant-localized";

/** The product's variants split by option, once per locale. */
export function useVariantMatrix(product: Product): VariantMatrix {
  const locale = useLocale() as ProductLocale;
  return useMemo(() => buildVariantMatrix(product.productVariants ?? [], locale), [product.productVariants, locale]);
}

/**
 * The store product page's variant picker: one row per option ("Color:
 * Black", then "Size: 2XL"), colour swatches (a ring on the selected one) or
 * pill chips (brand when selected). A value no in-stock variant has with the
 * values picked before it is struck through and disabled. Variants without
 * options (or with clashing ones) fall back to one chip per variant.
 * `compact`: the smaller rows of an extra piece's choice.
 */
export function StoreVariantPicker({
  product,
  selectedVariantId,
  onSelect,
  compact = false,
}: {
  product: Product;
  selectedVariantId: string | null;
  /** Kept for callers; the picker reads the selection by id. */
  selectedVariant?: ProductVariant | null;
  onSelect: (variantId: string | null) => void;
  compact?: boolean;
}) {
  const matrix = useVariantMatrix(product);
  if (matrix.groups.length === 0) return <FlatVariantPicker product={product} selectedVariantId={selectedVariantId} onSelect={onSelect} compact={compact} />;

  const current = selectedKeys(matrix, selectedVariantId);
  return (
    <div className={cn("grid", compact ? "gap-3" : "gap-5")}>
      {matrix.groups.map((group, index) => (
        <OptionRow
          key={group.slot}
          group={group}
          selected={current[index] ?? null}
          compact={compact}
          isAvailable={(key) => valueAvailable(product, matrix, current, index, key)}
          onPick={(key) => {
            const id = pickVariant(product, matrix, current, index, key);
            if (id && id !== selectedVariantId) onSelect(id);
          }}
        />
      ))}
    </div>
  );
}

function OptionRow({
  group,
  selected,
  compact,
  isAvailable,
  onPick,
}: {
  group: OptionGroup;
  selected: string | null;
  compact: boolean;
  isAvailable: (key: string) => boolean;
  onPick: (key: string) => void;
}) {
  const t = useTranslations("storeProduct");
  const tProduct = useTranslations("product");
  const selectedLabel = group.values.find((value) => value.key === selected)?.label;

  return (
    <div role="group" aria-label={group.name ?? t("option")} className={cn("grid", compact ? "gap-2" : "gap-3")}>
      <p className={cn("text-(--sf-ink)", compact ? "text-[13px]" : "text-sm")}>
        <span className="font-bold">{group.name ?? t("option")}:</span>{" "}
        {selectedLabel && <span className="text-(--sf-muted)">{selectedLabel}</span>}
      </p>
      <div className={cn("flex flex-wrap", compact ? "gap-2" : "gap-2.5")}>
        {group.values.map((value) => {
          const available = isAvailable(value.key);
          const on = value.key === selected;
          const name = available ? value.label : `${value.label} (${tProduct("outOfStock")})`;
          if (group.isColor && value.hex) {
            return (
              <button
                key={value.key}
                type="button"
                onClick={() => onPick(value.key)}
                disabled={!available}
                aria-pressed={on}
                aria-label={name}
                title={name}
                className={cn(
                  "relative grid place-items-center rounded-full transition-shadow duration-150 motion-reduce:transition-none disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-brand)",
                  compact ? "size-10" : "size-11",
                  on ? "shadow-[0_0_0_2px_var(--sf-paper),0_0_0_4px_var(--sf-brand)]" : "hover:shadow-[0_0_0_2px_var(--sf-paper),0_0_0_3px_var(--sf-line)]",
                )}
              >
                <span
                  aria-hidden
                  className={cn("rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]", compact ? "size-8" : "size-9", !available && "opacity-40")}
                  style={{ background: value.hex }}
                />
                {!available && <span aria-hidden className="absolute h-0.5 w-10 -rotate-45 rounded-full bg-(--sf-muted)" />}
              </button>
            );
          }
          return (
            <button
              key={value.key}
              type="button"
              onClick={() => onPick(value.key)}
              disabled={!available}
              aria-pressed={on}
              aria-label={name}
              title={name}
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-full border-[1.5px] font-semibold transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-brand)",
                compact ? "min-h-10 px-3.5 text-[13px]" : "min-h-11 px-4 text-sm",
                // Photos only on the first row (the colour, in practice), where they tell the values apart.
                value.image && group.slot === 0 && "ps-1.5",
                on
                  ? "border-(--sf-brand) bg-(--sf-brand) text-(--sf-brand-ink)"
                  : available
                    ? "border-(--sf-line) bg-(--sf-paper) text-(--sf-ink) hover:border-(--sf-ink)"
                    : "cursor-not-allowed border-(--sf-line) bg-(--sf-paper) text-(--sf-muted) line-through opacity-60",
              )}
            >
              {value.image && group.slot === 0 && (
                <span className={cn("relative shrink-0 overflow-hidden rounded-full bg-(--sf-shelf)", compact ? "size-7" : "size-8")}>
                  <Image src={getPublicUrl(value.image, "products")} alt="" fill sizes="32px" className={cn("object-contain", !available && "grayscale")} />
                </span>
              )}
              <span className="truncate">{value.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** One chip per variant: for variants without options, or two with the same values. */
function FlatVariantPicker({
  product,
  selectedVariantId,
  onSelect,
  compact,
}: {
  product: Product;
  selectedVariantId: string | null;
  onSelect: (variantId: string | null) => void;
  compact: boolean;
}) {
  const locale = useLocale() as ProductLocale;
  const t = useTranslations("storeProduct");
  const tProduct = useTranslations("product");
  const variants = useMemo(
    () => [...(product.productVariants ?? [])].sort((a, b) => Number(variantHasStock(product, b)) - Number(variantHasStock(product, a))),
    [product],
  );
  const selected = variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const selectedLabel = selected ? getVariantDisplayFields(selected, locale).title || selected.title : null;

  return (
    <div className={cn("grid", compact ? "gap-2" : "gap-3")}>
      <p className={cn("text-(--sf-ink)", compact ? "text-[13px]" : "text-sm")}>
        <span className="font-bold">{t("option")}:</span> {selectedLabel && <span className="text-(--sf-muted)">{selectedLabel}</span>}
      </p>
      <div className={cn("flex flex-wrap", compact ? "gap-2" : "gap-2.5")}>
        {variants.map((variant) => {
          const display = getVariantDisplayFields(variant, locale);
          const label = display.title || variant.title || "";
          const on = selectedVariantId === variant.id;
          const available = variantHasStock(product, variant);
          const color = getVariantColor(variant, locale)?.hex ?? null;
          const thumbnail = getVariantImageUrls(variant)[0];
          const name = available ? label : `${label} (${tProduct("outOfStock")})`;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant.id)}
              disabled={!available}
              aria-pressed={on}
              aria-label={name}
              title={name}
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-full border-[1.5px] font-semibold transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-brand)",
                compact ? "min-h-10 px-3.5 text-[13px]" : "min-h-11 px-4 text-sm",
                (thumbnail || color) && "ps-1.5",
                on
                  ? "border-(--sf-brand) bg-(--sf-brand) text-(--sf-brand-ink)"
                  : available
                    ? "border-(--sf-line) bg-(--sf-paper) text-(--sf-ink) hover:border-(--sf-ink)"
                    : "cursor-not-allowed border-(--sf-line) bg-(--sf-paper) text-(--sf-muted) line-through opacity-60",
              )}
            >
              {thumbnail ? (
                <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-(--sf-shelf)">
                  <Image src={getPublicUrl(thumbnail, "products")} alt="" fill sizes="32px" className={cn("object-contain", !available && "grayscale")} />
                </span>
              ) : color ? (
                <span aria-hidden className="size-7 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" style={{ background: color }} />
              ) : null}
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
