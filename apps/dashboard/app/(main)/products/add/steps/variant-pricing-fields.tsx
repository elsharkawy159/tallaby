"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/i18n/format";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  calculateDiscountFromFinalPrice,
  calculateProductFinalPrice,
  roundPriceUpToNearestFive,
  type SellerPricingSettings,
} from "@/lib/utils/product-pricing.lib";
import { getPublicUrl } from "@/lib/utils";
import { CurrencyInput, Toggle } from "@workspace/ui/components";
import { FormLabel } from "@workspace/ui/components/form";
import type { AddProductFormData } from "../add-product.schema";
import { DiscountExpiryField } from "./discount-expiry-field";

interface DefaultVariantPriceDisplayProps {
  finalPrice: number;
}

export function DefaultVariantPriceDisplay({
  finalPrice,
}: DefaultVariantPriceDisplayProps) {
  const t = useTranslations("productForm.variantPricing");
  const locale = useLocale();
  return (
    <div className="space-y-1 min-w-[140px]">
      <p className="text-xs text-muted-foreground">{t("usesMainPrice")}</p>
      <p className="text-sm font-semibold text-foreground">
        {finalPrice > 0 ? formatMoney(finalPrice, locale) : "—"}
      </p>
    </div>
  );
}

interface DefaultVariantImagesDisplayProps {
  images: string[];
}

export function DefaultVariantImagesDisplay({
  images,
}: DefaultVariantImagesDisplayProps) {
  const t = useTranslations("productForm.variantPricing");
  return (
    <div className="space-y-2 min-w-[140px]">
      <p className="text-xs text-muted-foreground">{t("usesMainImages")}</p>
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {images.slice(0, 5).map((image) => (
            <div
              key={image}
              className="relative size-10 overflow-hidden rounded-md border border-border bg-muted/50"
            >
              <Image
                src={getPublicUrl(image, "products")}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("addImagesHint")}</p>
      )}
    </div>
  );
}

interface VariantPricingFieldsProps {
  index: number;
  sellerPricing: SellerPricingSettings;
}

export function VariantPricingFields({
  index,
  sellerPricing,
}: VariantPricingFieldsProps) {
  const form = useFormContext<AddProductFormData>();
  const t = useTranslations("productForm.variantPricing");

  const listPrice = form.watch(`variants.${index}.listPrice`);
  const discountValue = form.watch(`variants.${index}.discountValue`);
  const discountType = form.watch(`variants.${index}.discountType`);
  const finalPrice = form.watch(`variants.${index}.price`);

  const prevPricingRef = useRef({
    listPrice,
    discountValue,
    discountType,
    finalPrice,
  });

  useEffect(() => {
    const numericList = typeof listPrice === "number" ? listPrice : 0;
    const prev = prevPricingRef.current;

    const listChanged = listPrice !== prev.listPrice;
    const discountChanged =
      discountValue !== prev.discountValue ||
      discountType !== prev.discountType;
    const finalChanged = finalPrice !== prev.finalPrice;

    prevPricingRef.current = {
      listPrice,
      discountValue,
      discountType,
      finalPrice,
    };

    if (numericList <= 0) {
      return;
    }

    if (listChanged || discountChanged) {
      const calculatedFinal = calculateProductFinalPrice(
        numericList,
        discountValue,
        discountType,
        sellerPricing
      );

      form.setValue(`variants.${index}.price`, calculatedFinal, {
        shouldDirty: true,
        shouldValidate: true,
      });
      prevPricingRef.current.finalPrice = calculatedFinal;
      return;
    }

    if (finalChanged) {
      const calculatedDiscount = calculateDiscountFromFinalPrice(
        numericList,
        finalPrice,
        discountType,
        sellerPricing
      );

      form.setValue(`variants.${index}.discountValue`, calculatedDiscount, {
        shouldDirty: true,
        shouldValidate: true,
      });
      prevPricingRef.current.discountValue = calculatedDiscount;
    }
  }, [listPrice, discountValue, discountType, finalPrice, form, index, sellerPricing]);

  const applyNearestFiveRounding = (
    field: `variants.${number}.listPrice` | `variants.${number}.price`,
    value: number
  ) => {
    if (value <= 0) {
      return;
    }

    const rounded = roundPriceUpToNearestFive(value);

    if (rounded !== value) {
      form.setValue(field, rounded, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="space-y-2 min-w-[280px]">
      <CurrencyInput
        name={`variants.${index}.listPrice`}
        label={t("list")}
        placeholder="0.00"
        className="text-sm"
        onBlurValue={(value) =>
          applyNearestFiveRounding(`variants.${index}.listPrice`, value)
        }
      />
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <CurrencyInput
            name={`variants.${index}.discountValue`}
            label={t("discount")}
            placeholder="0.00"
            className="text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <FormLabel className="text-xs">{t("type")}</FormLabel>
          <Controller
            name={`variants.${index}.discountType`}
            control={form.control}
            defaultValue="percent"
            render={({ field }) => {
              const currentValue = field.value || "percent";
              const isAmount = currentValue === "amount";
              const isPercent = currentValue === "percent";

              return (
                <div className="flex items-center">
                  <Toggle
                    pressed={isAmount}
                    onPressedChange={() => field.onChange("amount")}
                    variant="outline"
                    className="flex-1 text-xs rounded-e-none h-9 px-2 min-w-16"
                    aria-label={t("amountType")}
                  >
                    {t("amount")}
                  </Toggle>
                  <Toggle
                    pressed={isPercent}
                    onPressedChange={() => field.onChange("percent")}
                    variant="outline"
                    className="flex-1 text-xs rounded-s-none border-s-0 h-9 min-w-16"
                    aria-label={t("percentType")}
                  >
                    %
                  </Toggle>
                </div>
              );
            }}
          />
        </div>
      </div>
      <CurrencyInput
        name={`variants.${index}.price`}
        label={t("final")}
        placeholder="0.00"
        className="text-sm"
        onBlurValue={(value) =>
          applyNearestFiveRounding(`variants.${index}.price`, value)
        }
      />
      <DiscountExpiryField
        name={`variants.${index}.discountEndsAt`}
      />
    </div>
  );
}
