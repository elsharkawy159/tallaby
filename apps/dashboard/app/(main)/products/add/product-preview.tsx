"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Eye, Heart, ImageIcon, ShoppingCart } from "lucide-react";
import { formatPrice } from "@workspace/lib";
import { ProductCardView, type ProductCardSwatch } from "@workspace/ui/components/product-card";
import { getPublicUrl } from "@/lib/utils";
import { flattenCategoryTree } from "./add-product.lib";
import type { AddProductFormData, CategoryOption, SupportedLocale } from "./add-product.schema";
import type { VariantTypeFormValue } from "@/lib/utils/variant-types.lib";

const MAX_SWATCHES = 5;

/** Same rule as the storefront: a set percent wins, otherwise derive it. */
function discountPercent(
  list: number,
  final: number,
  type: string | undefined,
  value: number | undefined
): number | null {
  if (list <= 0 || final >= list) return null;
  if (type === "percent" && value && value > 0) return Math.min(99, Math.round(value));
  const percent = Math.round(((list - final) / list) * 100);
  return percent > 0 ? Math.min(99, percent) : null;
}

/**
 * The storefront product card fed with the form's live values. It renders the
 * very component the shop uses, so card design changes show up here too.
 */
export function ProductPreview({
  activeLocale,
  categories,
}: {
  activeLocale: SupportedLocale;
  categories: CategoryOption[];
}) {
  const t = useTranslations("productForm.page");
  const uiLocale = useLocale();
  const form = useFormContext<AddProductFormData>();
  const [localized, images, price, variantTypes, categoryId] = useWatch({
    control: form.control,
    name: ["localized", "images", "price", "variantTypes", "categoryId"],
  });

  const other: SupportedLocale = activeLocale === "en" ? "ar" : "en";
  const title =
    localized?.[activeLocale]?.title?.trim() || localized?.[other]?.title?.trim() || "";
  const list = typeof price?.list === "number" ? price.list : 0;
  const final = typeof price?.final === "number" && price.final > 0 ? price.final : list;
  const cover = images?.[0];

  const swatches = useMemo<ProductCardSwatch[]>(() => {
    const colorType = (variantTypes as VariantTypeFormValue[] | undefined)?.find(
      (type) => type.kind === "color"
    );
    if (!colorType) return [];
    const values = colorType.localized[activeLocale].values;
    const fallback = colorType.localized[other].values;
    return Array.from({ length: Math.max(values.length, fallback.length) }, (_, i) => ({
      key: String(i),
      label: values[i] || fallback[i] || "",
      hex: colorType.swatches?.[i] || "",
    })).filter((swatch) => swatch.hex);
  }, [variantTypes, activeLocale, other]);

  const categoryPath = useMemo(() => {
    if (!categoryId) return null;
    const entry = flattenCategoryTree(categories).find((item) => item.category.id === categoryId);
    return entry?.path
      .map((c) => (uiLocale === "ar" ? c.nameAr || c.name : c.name))
      .join(" › ");
  }, [categories, categoryId, uiLocale]);

  const percent = discountPercent(list, final, price?.discountType, price?.discountValue);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b px-3.5 py-3 text-xs text-muted-foreground">
        <span>{t("preview")}</span>
        <Eye className="size-[15px]" aria-hidden />
      </div>
      {/* The storefront is light-only, so keep the card on its own light surface. */}
      <div className="bg-[#fafaf8] p-3.5">
        <div className="mx-auto max-w-[260px]">
          <ProductCardView
            dir={activeLocale === "ar" ? "rtl" : "ltr"}
            title={title || t("previewName")}
            image={cover ? getPublicUrl(cover, "products") : ""}
            renderImage={({ src, alt, className }) =>
              src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={alt} className={className} />
              ) : (
                <div className="grid aspect-[2.6/3] w-full place-items-center rounded-md bg-[repeating-linear-gradient(135deg,transparent_0_8px,rgba(0,0,0,0.04)_8px_9px)] text-gray-400">
                  <ImageIcon className="size-8" aria-hidden />
                </div>
              )
            }
            priceHtml={formatPrice(final, activeLocale)}
            listPriceHtml={list > final ? formatPrice(list, activeLocale) : null}
            discountPercent={percent}
            swatches={swatches.slice(0, MAX_SWATCHES)}
            swatchOverflow={Math.max(0, swatches.length - MAX_SWATCHES)}
            topEndSlot={
              <span className="grid size-8 place-items-center rounded-lg bg-white/90 text-gray-700 shadow-sm">
                <Heart className="size-4" aria-hidden />
              </span>
            }
            bottomEndSlot={
              <span className="grid size-8 place-items-center rounded-lg bg-accent text-white shadow-sm">
                <ShoppingCart className="size-4" aria-hidden />
              </span>
            }
            className={title ? undefined : "[&_h3]:text-gray-400"}
          />
        </div>
      </div>
      {categoryPath && (
        <p className="truncate border-t px-3.5 py-2.5 text-xs text-muted-foreground" title={categoryPath}>
          {t("previewCategory", { category: categoryPath })}
        </p>
      )}
    </div>
  );
}
