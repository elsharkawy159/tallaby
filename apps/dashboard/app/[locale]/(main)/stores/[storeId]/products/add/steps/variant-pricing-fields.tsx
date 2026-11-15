"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatMoneyMarked } from "@/lib/i18n/format";
import { useAccountMoney } from "@/components/account-money.client";
import { MoneyText } from "@/components/money";

import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  calculateDiscountFromFinalPrice,
  calculateProductFinalPrice,
  calculateSellerEarning,
  type SellerPricingSettings,
} from "@/lib/utils/product-pricing.lib";
import type { AddProductFormData } from "../add-product.schema";
import { DiscountField } from "../sections/fields";
import { DiscountExpiryField } from "./discount-expiry-field";

interface VariantPricingFieldsProps {
  index: number;
  sellerPricing: SellerPricingSettings;
}

/** One variant's discount; the final price comes from it and the row's price. */
export function VariantPricingFields({ index, sellerPricing }: VariantPricingFieldsProps) {
  const form = useFormContext<AddProductFormData>();
  const t = useTranslations("productForm.variantPricing");
  const tVariants = useTranslations("productForm.variants");
  const locale = useLocale();
  const { unit } = useAccountMoney();

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
    <div className="flex min-w-0 flex-col gap-2">
      <div className="max-w-64">
        <DiscountField
          valueName={`variants.${index}.discountValue`}
          typeName={`variants.${index}.discountType`}
          className="h-10"
        />
      </div>
      <p className="text-xs text-(--s-muted)">
        {typeof sellingPrice === "number" && sellingPrice > 0 ? (
          <>
            <span className="font-semibold text-(--s-text)">
              <MoneyText locale={locale}>{tVariants("finalPrice", { amount: formatMoneyMarked(sellingPrice, locale, unit) })}</MoneyText>
            </span>
            {sellerEarning > 0 && (
              <> · <MoneyText locale={locale}>{t("youReceive", { amount: formatMoneyMarked(sellerEarning, locale, unit) })}</MoneyText></>
            )}
          </>
        ) : (
          "—"
        )}
      </p>
      <DiscountExpiryField name={`variants.${index}.discountEndsAt`} />
    </div>
  );
}
