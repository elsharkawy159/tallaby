"use client";

import { Controller, useFormContext, useFormState, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/i18n/format";
import { Boxes, Wand2 } from "lucide-react";
import { Switch } from "@workspace/ui/components/switch";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import {
  FieldError,
  FieldHint,
  FieldLabel,
  GroupInput,
  InputGroup,
  NumberStepper,
  SubHeading,
} from "@/app/(main)/products/add/form-kit";
import { generateSku } from "../add-product.lib";
import { useFieldError } from "./fields";
import { VariantsEditor } from "./variants-editor";
import { CollapsibleSection } from "./collapsible-section";
import { defaultValues, type AddProductFormData, type SupportedLocale } from "../add-product.schema";

export function InventorySection({
  id = "sec-stock",
  sellerPricing,
  activeLocale,
}: {
  id?: string;
  sellerPricing: SellerPricingSettings;
  activeLocale: SupportedLocale;
}) {
  const t = useTranslations("productForm.sections.stock");
  const tPage = useTranslations("productForm.page");
  const locale = useLocale();
  const form = useFormContext<AddProductFormData>();
  const quantityError = useFieldError("quantity");
  const variantsError = useFieldError("variants");
  const [variants, quantity, sku, trackStockValue] = useWatch({ control: form.control, name: ["variants", "quantity", "sku", "trackStock"] });
  // Unlimited stock (0138, F-51): the count is hidden, and stays saved as it was.
  const trackStock = trackStockValue !== false;
  const variantCount = (variants ?? []).length;
  const hasVariants = variantCount > 0;
  const { submitCount } = useFormState({ control: form.control });
  const stock = hasVariants
    ? (variants ?? []).reduce((sum, v) => sum + (typeof v?.stock === "number" ? v.stock : 0), 0)
    : typeof quantity === "number"
      ? quantity
      : 0;
  const summary = !trackStock
    ? t("summaryUnlimited")
    : hasVariants
    ? t("summaryVariants", { count: variantCount, stock })
    : stock > 0
      ? t("summaryStock", { stock })
      : t("summaryNeedQuantity");

  return (
    <CollapsibleSection
      id={id}
      icon={Boxes}
      title={t("title")}
      description={t("description")}
      summary={summary}
      summaryTone={!trackStock || stock > 0 ? "ok" : submitCount > 0 ? "bad" : "need"}
      invalid={Boolean(quantityError || variantsError)}
      filled={hasVariants || !trackStock || Boolean(sku?.trim()) || quantity !== defaultValues.quantity}
    >
      <Controller
        control={form.control}
        name="trackStock"
        render={({ field }) => (
          <label htmlFor="track-stock" className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border-[1.5px] border-(--s-field) bg-(--s-surface) px-4 py-3.5">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[13.5px] font-bold text-(--s-ink)">{t("trackStock")}</span>
              <span className="text-xs text-(--s-subtle)">{t(field.value === false ? "trackStockOff" : "trackStockOn")}</span>
            </span>
            <Switch id="track-stock" checked={field.value !== false} onCheckedChange={field.onChange} />
          </label>
        )}
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="sku" note={tPage("optional")}>
            {t("sku")}
          </FieldLabel>
          <Controller
            control={form.control}
            name="sku"
            render={({ field }) => (
              <InputGroup>
                <GroupInput
                  id="sku"
                  dir="ltr"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="PROD-12345"
                  className="font-montserrat rtl:text-right"
                />
                <button
                  type="button"
                  onClick={() =>
                    field.onChange(generateSku(form.getValues("localized.en.title")))
                  }
                  className="flex items-center gap-1.5 cursor-pointer border-s border-(--s-line-soft) bg-(--s-surface-2) px-3 text-xs font-semibold whitespace-nowrap text-(--s-subtle) transition-colors hover:text-(--s-primary)"
                >
                  <Wand2 className="size-3.5" />
                  {t("generate")}
                </button>
              </InputGroup>
            )}
          />
        </div>

        {/* With combinations, stock is set per combination below (the default one holds the product's quantity); this is the total. */}
        {trackStock && hasVariants && <div className="flex flex-col gap-1.5">
          <FieldLabel>{t("totalStock")}</FieldLabel>
          <div className="flex h-[46px] items-center rounded-[14px] border-[1.5px] border-(--s-line) bg-(--s-surface-2) px-3.5 font-montserrat text-sm font-semibold tabular-nums text-(--s-text)">
            {formatNumber(stock, locale)}
          </div>
          <FieldHint>{t("totalStockHint", { count: variantCount })}</FieldHint>
          <FieldError>{quantityError}</FieldError>
        </div>}

        {trackStock && !hasVariants && <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="quantity" required>
            {t("quantity")}
          </FieldLabel>
          <Controller
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <NumberStepper
                id="quantity"
                value={field.value}
                onChange={(value) => field.onChange(value ?? 0)}
                onBlur={field.onBlur}
                invalid={Boolean(quantityError)}
                decrementLabel={t("decrease")}
                incrementLabel={t("increase")}
              />
            )}
          />
          <FieldError>{quantityError}</FieldError>
        </div>}
      </div>

      <SubHeading>{t("variantsHeading")}</SubHeading>
      <VariantsEditor sellerPricing={sellerPricing} activeLocale={activeLocale} />
      <FieldError>{variantsError}</FieldError>
    </CollapsibleSection>
  );
}
