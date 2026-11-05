"use client";

import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Banknote } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import { formatMoneyMarked } from "@/lib/i18n/format";
import { MixedCurrencyNote, useAccountMoney } from "@/components/account-money.client";
import { MoneyText } from "@/components/money";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import { cn } from "@/lib/utils";
import { FieldError, FieldHint, FieldLabel, SectionCard } from "@/app/(main)/products/add/form-kit";
import { DiscountExpiryField } from "../steps/discount-expiry-field";
import { MoneyField, useFieldError } from "./fields";
import type { AddProductFormData } from "../add-product.schema";

const positive = (value: unknown): value is number => typeof value === "number" && value > 0;
const isSale = (list: unknown, final: unknown) => positive(list) && positive(final) && final < list;

/**
 * Price, and a Discount switch that adds the sale price. The sale price is
 * `price.final`; the discount is kept as the amount off, so the sale price
 * stays put if the seller changes the price afterwards.
 */
export function PricingSection({
  id = "sec-price",
  sellerPricing,
}: {
  id?: string;
  sellerPricing: SellerPricingSettings;
}) {
  const t = useTranslations("productForm.sections.pricing");
  const locale = useLocale();
  const { unit } = useAccountMoney();
  const form = useFormContext<AddProductFormData>();
  const [listPrice, finalPrice, discountValue, discountEndsAt] = useWatch({
    control: form.control,
    name: ["price.list", "price.final", "price.discountValue", "price.discountEndsAt"],
  });
  const listError = useFieldError("price.list");
  const finalError = useFieldError("price.final");

  const [discountOn, setDiscountOn] = useState(() => isSale(listPrice, finalPrice));
  // An end date set before (edit, import, AI) stays visible; new discounts don't ask for one.
  const [showExpiry, setShowExpiry] = useState(() => Boolean(discountEndsAt));

  // The switch turns the discount on, and so does a sale price written from
  // outside the field (AI fill). A whole-form reset (draft restore, import,
  // start over) has no field name and follows the prices either way.
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === undefined) setDiscountOn(isSale(values.price?.list, values.price?.final));
      else if (name === "price.final" && isSale(values.price?.list, values.price?.final)) setDiscountOn(true);
      if (values.price?.discountEndsAt) setShowExpiry(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const quiet = { shouldDirty: false, shouldValidate: false };
    if (!positive(listPrice)) return;
    if (form.getValues("price.base") !== listPrice) form.setValue("price.base", listPrice, quiet);

    if (!discountOn) {
      if (finalPrice !== listPrice) {
        form.setValue("price.final", listPrice, { shouldValidate: form.formState.submitCount > 0 });
      }
      if (discountValue !== undefined) form.setValue("price.discountValue", undefined, quiet);
      if (form.getValues("price.discountEndsAt")) form.setValue("price.discountEndsAt", null, quiet);
      return;
    }

    const amountOff = positive(finalPrice) && finalPrice < listPrice ? listPrice - finalPrice : undefined;
    if (form.getValues("price.discountType") !== "amount") form.setValue("price.discountType", "amount", quiet);
    if (amountOff !== discountValue) form.setValue("price.discountValue", amountOff, quiet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPrice, finalPrice, discountOn]);

  const toggleDiscount = (on: boolean) => {
    setDiscountOn(on);
    if (on) {
      // Start empty so the seller types the sale price, not a copy of the price.
      if (finalPrice === listPrice) form.setValue("price.final", undefined as unknown as number);
      requestAnimationFrame(() => document.getElementById("price-sale")?.focus());
    }
  };

  const hasSale = discountOn && positive(listPrice) && positive(finalPrice) && finalPrice < listPrice;
  const percent = hasSale ? Math.round((1 - finalPrice / listPrice) * 100) : 0;

  return (
    <SectionCard
      id={id}
      icon={Banknote}
      title={t("title")}
      description={t("description")}
      divided={false}
      invalid={Boolean(listError || finalError)}
    >
      <MixedCurrencyNote className="mb-3.5" />
      <div className="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="price-list" required>
            {t("productPrice")}
          </FieldLabel>
          <MoneyField id="price-list" name="price.list" invalid={Boolean(listError)} />
          <FieldError>{listError}</FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          {/* Lines the switch up with the input beside it. */}
          <span className="hidden text-[13.5px] leading-normal select-none sm:block" aria-hidden>
            &nbsp;
          </span>
          <label
            htmlFor="price-discount-on"
            className="flex h-[46px] cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5"
          >
            <Switch id="price-discount-on" checked={discountOn} onCheckedChange={toggleDiscount} />
            <span className="text-[13.5px] font-bold text-(--s-ink)">{t("discount")}</span>
          </label>
        </div>
      </div>

      {discountOn && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="price-sale" required>
            {t("salePrice")}
            <span className="font-normal text-muted-foreground">({t("finalPrice")})</span>
          </FieldLabel>
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <MoneyField id="price-sale" name="price.final" invalid={Boolean(finalError)} />
            </div>
            <span
              className={cn(
                "inline-flex h-[46px] shrink-0 items-center rounded-[14px] border px-3.5 text-[13px] font-bold whitespace-nowrap",
                hasSale ? "border-transparent bg-success-soft text-success" : "border-(--s-line) bg-(--s-surface-2) text-(--s-faint)"
              )}
            >
              {hasSale ? t("percentOff", { percent }) : t("percentOffEmpty")}
            </span>
          </div>
          {finalError ? (
            <FieldError>{finalError}</FieldError>
          ) : (
            <FieldHint className="text-faint">
              {hasSale
                ? <MoneyText locale={locale}>{t("customerSaves", { amount: formatMoneyMarked(listPrice - finalPrice, locale, unit) })}</MoneyText>
                : t("salePriceHint")}
            </FieldHint>
          )}
          {showExpiry && (
            <DiscountExpiryField
              name="price.discountEndsAt"
              title={t("expiryTitle")}
              description={t("expiryDescription")}
            />
          )}
        </div>
      )}
    </SectionCard>
  );
}
