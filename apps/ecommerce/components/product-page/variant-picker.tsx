"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice, getPriceFinal } from "@workspace/lib";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@workspace/ui/components/carousel";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { useCurrencyLabel } from "@/lib/currency-label.client";
import { getVariantImageUrls } from "@/lib/variant-images";
import { getVariantDisplayFields } from "@/lib/variant-localized";
import { getVariantColor, withAlpha } from "@/lib/variant-colors";
import type { ProductLocale } from "@/lib/product-translations";
import type { ProductVariant } from "./product-page.lib";
import type { Product } from "./product-page.types";

interface VariantPickerProps {
  product: Product;
  selectedVariantId: string | null;
  selectedVariant: ProductVariant | null;
  onSelect: (variantId: string | null) => void;
}

/**
 * The variant swatches of a product page: the option label and the
 * selected variant's name, then a free-drag carousel on phones and a
 * wrapping grid on desktop (in-stock variants first).
 */
export const VariantPicker = ({
  product,
  selectedVariantId,
  selectedVariant,
  onSelect: setSelectedVariantId,
}: VariantPickerProps) => {
  const locale = useLocale() as ProductLocale;
  const currencyLabel = useCurrencyLabel();
  const t = useTranslations("product");

  // In-stock variants first; the sort is stable, so the original order is
  // kept within each group.
  const sortedVariants = useMemo(
    () =>
      [...(product.productVariants ?? [])].sort(
        (a, b) =>
          Number(Number(b.stock ?? 0) > 0) - Number(Number(a.stock ?? 0) > 0),
      ),
    [product.productVariants],
  );

  const variantOptionLabel = useMemo(() => {
    if (!product.productVariants?.length) return t("selectVariant");

    const optionNames = new Set<string>();
    for (const variant of product.productVariants) {
      const display = getVariantDisplayFields(variant, locale);
      for (const option of [
        display.option1,
        display.option2,
        display.option3,
      ]) {
        if (!option) continue;
        const match = option.match(/^(.+?):\s*(.+)$/);
        if (match?.[1]) optionNames.add(match[1].trim());
      }
    }

    if (optionNames.size === 0) return t("selectVariant");

    return t("selectOption", {
      option: Array.from(optionNames).join(" / "),
    });
  }, [product.productVariants, t]);
  const selectedVariantLabel = selectedVariant
    ? getVariantDisplayFields(selectedVariant, locale).title ||
      selectedVariant.title
    : null;

  const renderVariantButton = (
    variant: NonNullable<Product["productVariants"]>[number],
  ) => {
    const display = getVariantDisplayFields(variant, locale);
    const isSelected = selectedVariantId === variant.id;
    const variantStock = Number(variant.stock ?? 0);
    const isAvailable = variantStock > 0;
    const isDefaultVariant = variant.isDefault === true;
    const optionParts: string[] = [];
    if (display.option1) optionParts.push(display.option1);
    if (display.option2) optionParts.push(display.option2);
    if (display.option3) optionParts.push(display.option3);
    // variant.title is nullable; an empty label must not crash `.charAt` below.
    const variantLabel = display.title || variant.title || optionParts.join(" ") || "";
    const variantDescription = optionParts.join(" • ");
    const variantThumbnail = getVariantImageUrls(variant)[0];
    // Color variants get outlined in their own color instead of
    // the generic primary border.
    const colorHex = isAvailable
      ? (getVariantColor(variant, locale)?.hex ?? null)
      : null;
    // The inset hairline keeps pale colors (white, beige) readable
    // as an outline against the white card.
    const colorStyle = colorHex
      ? isSelected
        ? {
            borderColor: colorHex,
            boxShadow: `0 0 0 3px ${withAlpha(colorHex, 0.3)}, inset 0 0 0 1px rgba(0,0,0,0.08)`,
          }
        : {
            borderColor: withAlpha(colorHex, 0.55),
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
          }
      : undefined;

    return (
      <button
        key={variant.id}
        onClick={() => setSelectedVariantId(variant.id)}
        disabled={!isAvailable}
        title={variantDescription || variantLabel}
        aria-pressed={isSelected}
        aria-label={
          isAvailable
            ? variantLabel
            : `${variantLabel} (${t("outOfStock")})`
        }
        style={colorStyle}
        className={`group relative flex h-28 w-28 flex-col items-stretch overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 ease-out ${
          isSelected
            ? colorHex
              ? "bg-white shadow-lg"
              : "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/25"
            : isAvailable
              ? colorHex
                ? "bg-white hover:-translate-y-0.5"
                : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              : "cursor-not-allowed border-gray-100 bg-gray-50"
        }`}
      >
        {/* Visual: thumbnail image or a soft gradient placeholder */}
        <div className="relative flex-1 overflow-hidden">
          {variantThumbnail ? (
            <Image
              src={getPublicUrl(variantThumbnail, "products")}
              alt={variantLabel}
              title={variantLabel ?? undefined}
              fill
              sizes="96px"
              className={`object-contain transition-transform duration-300 ${
                isAvailable
                  ? "group-hover:scale-105"
                  : "opacity-40 grayscale"
              }`}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${
                isSelected
                  ? "from-primary/15 to-primary/5"
                  : "from-gray-50 to-gray-100"
              }`}
            >
              <span
                className={`text-2xl font-bold ${
                  isSelected ? "text-primary/60" : "text-gray-300"
                }`}
              >
                {variantLabel.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Default badge */}
          {isDefaultVariant && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white shadow-sm">
              {t("defaultVariant")}
            </span>
          )}

          {/* Selected checkmark */}
          {isSelected && (
            <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          )}

          {/* Out of stock: dim overlay + diagonal strike */}
          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/10">
              <span className="h-px w-[140%] -rotate-[22deg] bg-gray-400/80" />
            </div>
          )}
        </div>

        {/* Label strip */}
        <div
          className={`shrink-0 border-t rtl:text-right px-1.5 py-1.5 ${
            isSelected
              ? "border-primary/20 bg-primary/5"
              : "border-gray-100 bg-white"
          }`}
        >
          <p
            className={`truncate text-[11px] font-semibold leading-tight ${
              isSelected ? "text-primary" : "text-gray-900"
            }`}
          >
            {variantLabel}
          </p>
          {isAvailable ? (
            <p
              className="truncate text-[10px] font-medium leading-tight text-gray-500"
              dangerouslySetInnerHTML={{
                __html: formatPrice(
                  getPriceFinal(variant.price),
                  locale,
                  "sm",
                  currencyLabel,
                ),
              }}
            />
          ) : (
            <p className="truncate text-[10px] font-medium leading-tight text-red-500">
              {t("outOfStock")}
            </p>
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      <p className="mb-2 flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-semibold text-gray-900">{variantOptionLabel}</span>
        {selectedVariantLabel && (
          <span className="text-gray-500">{selectedVariantLabel}</span>
        )}
      </p>
      {/* Mobile: free-drag carousel */}
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
          direction: locale === "ar" ? "rtl" : "ltr",
        }}
        className="md:hidden"
      >
        <CarouselContent className="-ms-3 py-2">
          {sortedVariants.map((variant) => (
            <CarouselItem key={variant.id} className="basis-auto ps-3">
              {renderVariantButton(variant)}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Desktop: wrapping grid */}
      <div className="hidden flex-wrap gap-3 md:flex">
        {sortedVariants.map(renderVariantButton)}
      </div>
    </>
  );
};
