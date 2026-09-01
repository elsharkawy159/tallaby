"use client";

import { useEffect, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  calculateDiscountFromFinalPrice,
  calculateProductFinalPrice,
  roundPriceToNearestNine,
  type SellerPricingSettings,
} from "@/lib/utils/product-pricing.lib";
import { CurrencyInput, Toggle } from "@workspace/ui/components";
import { FormLabel } from "@workspace/ui/components/form";
import type { AddProductFormData } from "../add-product.schema";

interface DefaultVariantPriceDisplayProps {
  finalPrice: number;
}

export function DefaultVariantPriceDisplay({
  finalPrice,
}: DefaultVariantPriceDisplayProps) {
  return (
    <div className="space-y-1 min-w-[140px]">
      <p className="text-xs text-gray-500">Uses main product price</p>
      <p className="text-sm font-semibold text-gray-900">
        {finalPrice > 0 ? finalPrice.toFixed(2) : "—"} ج.م
      </p>
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

  const applyNearestNineRounding = (
    field: `variants.${number}.listPrice` | `variants.${number}.price`,
    value: number
  ) => {
    if (value <= 0) {
      return;
    }

    const rounded = roundPriceToNearestNine(value);

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
        label="List"
        placeholder="0.00"
        className="text-sm"
        onBlurValue={(value) =>
          applyNearestNineRounding(`variants.${index}.listPrice`, value)
        }
      />
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <CurrencyInput
            name={`variants.${index}.discountValue`}
            label="Discount"
            placeholder="0.00"
            className="text-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <FormLabel className="text-xs">Type</FormLabel>
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
                    className="flex-1 text-xs rounded-r-none h-9 px-2 min-w-16"
                    aria-label="Amount discount type"
                  >
                    Amt
                  </Toggle>
                  <Toggle
                    pressed={isPercent}
                    onPressedChange={() => field.onChange("percent")}
                    variant="outline"
                    className="flex-1 text-xs rounded-l-none border-l-0 h-9 min-w-16"
                    aria-label="Percent discount type"
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
        label="Final"
        placeholder="0.00"
        className="text-sm"
        onBlurValue={(value) =>
          applyNearestNineRounding(`variants.${index}.price`, value)
        }
      />
    </div>
  );
}
