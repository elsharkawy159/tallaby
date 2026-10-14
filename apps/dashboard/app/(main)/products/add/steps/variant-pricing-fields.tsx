"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/i18n/format";

import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  calculateDiscountFromFinalPrice,
  calculateProductFinalPrice,
  calculateSellerEarning,
  type SellerPricingSettings,
} from "@/lib/utils/product-pricing.lib";
import type { AddProductFormData } from "../add-product.schema";
import { DiscountField, MoneyField, useFieldError } from "../sections/fields";
import { DiscountExpiryField } from "./discount-expiry-field";

interface VariantPricingFieldsProps {
  index: number;
  sellerPricing: SellerPricingSettings;
}

/** List price + discount for one variant row; the final price is derived. */
export function VariantPricingFields({ index, sellerPricing }: VariantPricingFieldsProps) {
  const form = useFormContext<AddProductFormData>();
  const t = useTranslations("productForm.variantPricing");
  const tVariants = useTranslations("productForm.variants");
  const locale = useLocale();
  const priceError = useFieldError(`variants.${index}.price`);

  const [listPrice, discountValue, discountType, finalPrice] = useWatch({
    control: form.control,
    name: [
      `variants.${index}.listPrice`,
      `variants.${index}.discountValue`,
      `variants.${index}.discountType`,
      `variants.${index}.price`,
    ],
  });

  const prevPricingRef = useRef({ listPrice, discountValue, discountType, finalPrice });

  useEffect(() => {
    const numericList = typeof listPrice === "number" ? listPrice : 0;
    const prev = prevPricingRef.current;
    const listChanged = listPrice !== prev.listPrice;
    const discountChanged =
      discountValue !== prev.discountValue || discountType !== prev.discountType;
    const finalChanged = finalPrice !== prev.finalPrice;
    prevPricingRef.current = { listPrice, discountValue, discountType, finalPrice };

    if (numericList <= 0) return;

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

  const sellingPrice = finalPrice || listPrice;
  const sellerEarning = calculateSellerEarning(sellingPrice, sellerPricing);

  return (
    <div className="flex min-w-[260px] flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 [&_input]:text-[13px] [&_select]:h-full [&>div]:h-9">
        <MoneyField
          name={`variants.${index}.listPrice`}
          invalid={Boolean(priceError)}
          placeholder={t("list")}
        />
        <DiscountField
          valueName={`variants.${index}.discountValue`}
          typeName={`variants.${index}.discountType`}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {typeof sellingPrice === "number" && sellingPrice > 0 ? (
          <>
            <span className="font-semibold text-foreground">
              {tVariants("finalPrice", { amount: formatMoney(sellingPrice, locale) })}
            </span>
            {sellerEarning > 0 && (
              <> · {t("youReceive", { amount: formatMoney(sellerEarning, locale) })}</>
            )}
          </>
        ) : (
          "—"
        )}
      </p>
      {priceError && <p className="text-xs text-destructive">{priceError}</p>}
      <DiscountExpiryField name={`variants.${index}.discountEndsAt`} />
    </div>
  );
}
