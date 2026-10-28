"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import type { ProductVariant } from "@/components/product-page/product-page.lib";
import type { Product } from "@/components/product-page/product-page.types";
import type { ProductLocale } from "@/lib/product-translations";
import { cn } from "@/lib/utils";
import { getVariantColor } from "@/lib/variant-colors";
import { getVariantImageUrls } from "@/lib/variant-images";
import { getVariantDisplayFields } from "@/lib/variant-localized";

/** "Color: Red" → ["Color", "Red"]; a bare value has no name. */
const splitOption = (option: string): [string | null, string] => {
  const match = option.match(/^(.+?):\s*(.+)$/);
  return match ? [match[1]!.trim(), match[2]!.trim()] : [null, option.trim()];
};

/**
 * The store product page's variant picker (the store look of
 * `VariantPicker`, same data and selection): "Color: Red" on top, then round
 * colour swatches (a ring on the selected one) or pill chips (brand when
 * selected), sold-out ones struck through and disabled. 44px tap targets;
 * in-stock variants first.
 */
export function StoreVariantPicker({
  product,
  selectedVariantId,
  selectedVariant,
  onSelect,
}: {
  product: Product;
  selectedVariantId: string | null;
  selectedVariant: ProductVariant | null;
  onSelect: (variantId: string | null) => void;
}) {
  const locale = useLocale() as ProductLocale;
  const t = useTranslations("storeProduct");
  const tProduct = useTranslations("product");

  const variants = useMemo(
    () => [...(product.productVariants ?? [])].sort((a, b) => Number(Number(b.stock ?? 0) > 0) - Number(Number(a.stock ?? 0) > 0)),
    [product.productVariants],
  );

  const optionNames = useMemo(() => {
    const names = new Set<string>();
    for (const variant of product.productVariants ?? []) {
      const display = getVariantDisplayFields(variant, locale);
      for (const option of [display.option1, display.option2, display.option3]) {
        const [name] = option ? splitOption(option) : [null];
        if (name) names.add(name);
      }
    }
    return [...names];
  }, [product.productVariants, locale]);

  const selectedLabel = useMemo(() => {
    if (!selectedVariant) return null;
    const display = getVariantDisplayFields(selectedVariant, locale);
    // One option (Color): its value; several: the variant's whole title.
    if (optionNames.length === 1) {
      const option = [display.option1, display.option2, display.option3].find((o) => o && splitOption(o)[0] === optionNames[0]);
      if (option) return splitOption(option)[1];
    }
    return display.title || selectedVariant.title || null;
  }, [selectedVariant, optionNames, locale]);

  return (
    <div className="grid gap-3">
      <p className="text-sm text-(--sf-ink)">
        <span className="font-bold">{optionNames.length ? optionNames.join(" / ") : t("option")}:</span>{" "}
        {selectedLabel && <span className="text-(--sf-muted)">{selectedLabel}</span>}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {variants.map((variant) => {
          const display = getVariantDisplayFields(variant, locale);
          const options = [display.option1, display.option2, display.option3].filter((o): o is string => Boolean(o));
          const label = display.title || variant.title || options.map((o) => splitOption(o)[1]).join(" / ") || "";
          const isSelected = selectedVariantId === variant.id;
          const isAvailable = Number(variant.stock ?? 0) > 0;
          const color = getVariantColor(variant, locale)?.hex ?? null;
          const thumbnail = getVariantImageUrls(variant)[0];
          const name = isAvailable ? label : `${label} (${tProduct("outOfStock")})`;

          if (color) {
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => onSelect(variant.id)}
                disabled={!isAvailable}
                aria-pressed={isSelected}
                aria-label={name}
                title={name}
                className={cn(
                  "relative grid size-11 place-items-center rounded-full transition-shadow duration-150 motion-reduce:transition-none disabled:cursor-not-allowed",
                  isSelected
                    ? "shadow-[0_0_0_2px_var(--sf-paper),0_0_0_4px_var(--sf-brand)]"
                    : "hover:shadow-[0_0_0_2px_var(--sf-paper),0_0_0_3px_var(--sf-line)]",
                )}
              >
                <span
                  aria-hidden
                  className={cn("size-9 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]", !isAvailable && "opacity-40")}
                  style={{ background: color }}
                />
                {!isAvailable && <span aria-hidden className="absolute h-0.5 w-10 -rotate-45 rounded-full bg-(--sf-muted)" />}
              </button>
            );
          }

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant.id)}
              disabled={!isAvailable}
              aria-pressed={isSelected}
              aria-label={name}
              title={name}
              className={cn(
                "inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-semibold transition-colors duration-150 motion-reduce:transition-none",
                thumbnail && "ps-1.5",
                isSelected
                  ? "border-(--sf-brand) bg-(--sf-brand) text-(--sf-brand-ink)"
                  : isAvailable
                    ? "border-(--sf-line) bg-(--sf-paper) text-(--sf-ink) hover:border-(--sf-ink)"
                    : "cursor-not-allowed border-(--sf-line) bg-(--sf-paper) text-(--sf-muted) line-through opacity-60",
              )}
            >
              {thumbnail && (
                <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-(--sf-shelf)">
                  <Image src={getPublicUrl(thumbnail, "products")} alt="" fill sizes="32px" className={cn("object-contain", !isAvailable && "grayscale")} />
                </span>
              )}
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
