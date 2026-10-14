"use client";

import { useEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Banknote } from "lucide-react";
import { formatMoney } from "@/lib/i18n/format";
import {
  calculateDiscountFromFinalPrice,
  calculateProductFinalPrice,
  calculateSellerEarning,
  type SellerPricingSettings,
} from "@/lib/utils/product-pricing.lib";
import { FieldError, FieldHint, FieldLabel, SectionCard } from "@/components/form/form-ui";
import { DiscountExpiryField } from "../steps/discount-expiry-field";
import { DiscountField, MoneyField, useFieldError } from "./fields";
import type { AddProductFormData } from "../add-product.schema";

/**
 * Keeps `price.final` (and `price.base`) in step with the list price and
 * discount; when only the final price changes (import, edit) it back-fills the
 * discount instead.
 */
export function useMainPriceSync(sellerPricing: SellerPricingSettings) {
  const form = useFormContext<AddProductFormData>();
  const [listPrice, discountValue, discountType, finalPrice] = useWatch({
    control: form.control,
    name: ["price.list", "price.discountValue", "price.discountType", "price.final"],
  });
  const prev = useRef({ listPrice, discountValue, discountType, finalPrice });

  useEffect(() => {
    const numericList = typeof listPrice === "number" ? listPrice : 0;
    const before = prev.current;
    const listChanged = listPrice !== before.listPrice;
    const discountChanged =
      discountValue !== before.discountValue || discountType !== before.discountType;
    const finalChanged = finalPrice !== before.finalPrice;
    prev.current = { listPrice, discountValue, discountType, finalPrice };

    if (numericList <= 0) return;

    form.setValue("price.base", numericList, { shouldDirty: true, shouldValidate: false });

    if (listChanged || discountChanged || !finalPrice) {
      const calculatedFinal = calculateProductFinalPrice(
        numericList,
        discountValue,
        discountType,
        sellerPricing
      );
      if (calculatedFinal !== finalPrice) {
        form.setValue("price.final", calculatedFinal, {
          shouldDirty: true,
          shouldValidate: form.formState.submitCount > 0,
        });
      }
      prev.current.finalPrice = calculatedFinal;
      return;
    }

    if (finalChanged) {
      const calculatedDiscount = calculateDiscountFromFinalPrice(
        numericList,
        finalPrice,
        discountType,
        sellerPricing
      );
      form.setValue("price.discountValue", calculatedDiscount, {
        shouldDirty: true,
        shouldValidate: false,
      });
      prev.current.discountValue = calculatedDiscount;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPrice, discountValue, discountType, finalPrice, sellerPricing]);
}

export function PricingSection({
  id = "sec-price",
  sellerPricing,
}: {
  id?: string;
  sellerPricing: SellerPricingSettings;
}) {
  const t = useTranslations("productForm.sections.pricing");
  const tPage = useTranslations("productForm.page");
  const locale = useLocale();
  const form = useFormContext<AddProductFormData>();
  useMainPriceSync(sellerPricing);

  const [listPrice, finalPrice] = useWatch({
    control: form.control,
    name: ["price.list", "price.final"],
  });
  const listError = useFieldError("price.list");
  const finalError = useFieldError("price.final");

  const list = typeof listPrice === "number" ? listPrice : 0;
  const final = typeof finalPrice === "number" && finalPrice > 0 ? finalPrice : list;
  const saving = list > final ? list - final : 0;
  const percent = list > 0 && saving > 0 ? Math.round((saving / list) * 100) : 0;
  const earning = calculateSellerEarning(final, sellerPricing);

  return (
    <SectionCard
      id={id}
      icon={Banknote}
      title={t("title")}
      description={t("description")}
      divided={false}
      invalid={Boolean(listError || finalError)}
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="price-list" required>
            {t("productPrice")}
          </FieldLabel>
          <MoneyField id="price-list" name="price.list" invalid={Boolean(listError)} />
          <FieldError>{listError}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="price-discount" note={tPage("optional")}>
            {t("discount")}
          </FieldLabel>
          <DiscountField
            id="price-discount"
            valueName="price.discountValue"
            typeName="price.discountType"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-primary-soft px-4 py-3.5">
        <div>
          <span className="block text-xs text-muted-foreground">{t("finalForCustomer")}</span>
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-2xl leading-tight font-extrabold text-primary-ink tabular-nums">
              {formatMoney(final, locale)}
            </span>
            {saving > 0 && (
              <s className="font-sans text-[13px] text-faint tabular-nums">
                {formatMoney(list, locale)}
              </s>
            )}
          </div>
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          {saving > 0 ? (
            <>
              <Pill tone="success">{t("save", { amount: formatMoney(saving, locale) })}</Pill>
              <Pill>{t("percentOff", { percent })}</Pill>
            </>
          ) : (
            <Pill>{t("noDiscount")}</Pill>
          )}
          {earning > 0 && <Pill>{t("youReceive", { amount: formatMoney(earning, locale) })}</Pill>}
        </div>
      </div>
      <FieldError>{finalError}</FieldError>
      <FieldHint className="-mt-2 text-faint">{t("roundingHint")}</FieldHint>

      <DiscountExpiryField
        name="price.discountEndsAt"
        title={t("expiryTitle")}
        description={t("expiryDescription")}
      />
    </SectionCard>
  );
}

function Pill({ tone, children }: { tone?: "success"; children: React.ReactNode }) {
  return (
    <span
      className={
        tone === "success"
          ? "inline-flex h-[26px] items-center rounded-full bg-success-soft px-2.5 text-xs font-semibold whitespace-nowrap text-success"
          : "inline-flex h-[26px] items-center rounded-full bg-card px-2.5 text-xs whitespace-nowrap"
      }
    >
      {children}
    </span>
  );
}
