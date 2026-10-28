"use client";

import { Controller, useFormContext, useFormState, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Boxes, Wand2 } from "lucide-react";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import {
  FieldError,
  FieldHint,
  FieldLabel,
  GroupInput,
  InputGroup,
  NumberStepper,
  SubHeading,
} from "@/components/form/form-ui";
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
  const form = useFormContext<AddProductFormData>();
  const quantityError = useFieldError("quantity");
  const variantsError = useFieldError("variants");
  const [variants, quantity, sku] = useWatch({ control: form.control, name: ["variants", "quantity", "sku"] });
  const variantCount = (variants ?? []).length;
  const hasVariants = variantCount > 0;
  const { submitCount } = useFormState({ control: form.control });
  const stock = hasVariants
    ? (variants ?? []).reduce((sum, v) => sum + (typeof v?.stock === "number" ? v.stock : 0), 0)
    : typeof quantity === "number"
      ? quantity
      : 0;
  const summary = hasVariants
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
      summaryTone={stock > 0 ? "ok" : submitCount > 0 ? "bad" : "need"}
      invalid={Boolean(quantityError || variantsError)}
      filled={hasVariants || Boolean(sku?.trim()) || quantity !== defaultValues.quantity}
    >
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
                  className="font-sans rtl:text-right"
                />
                <button
                  type="button"
                  onClick={() =>
                    field.onChange(generateSku(form.getValues("localized.en.title")))
                  }
                  className="flex items-center gap-1.5 border-s border-border bg-muted px-3 text-xs whitespace-nowrap text-muted-foreground transition-colors hover:text-primary-ink"
                >
                  <Wand2 className="size-3.5" />
                  {t("generate")}
                </button>
              </InputGroup>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
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
          {hasVariants && <FieldHint>{t("defaultVariantStock")}</FieldHint>}
          <FieldError>{quantityError}</FieldError>
        </div>
      </div>

      <SubHeading>{t("variantsHeading")}</SubHeading>
      <VariantsEditor sellerPricing={sellerPricing} activeLocale={activeLocale} />
      <FieldError>{variantsError}</FieldError>
    </CollapsibleSection>
  );
}
