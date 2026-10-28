"use client";

import { Controller, useFormContext, useFormState, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Info, Truck } from "lucide-react";
import type { SellerPricingSettings } from "@/lib/utils/product-pricing.lib";
import { cn } from "@/lib/utils";
import {
  FIELD_CLASS,
  FieldError,
  FieldHint,
  FieldLabel,
  GROUP_SELECT_CLASS,
  InputAddon,
  InputGroup,
  NumberStepper,
  ToggleRow,
} from "@/components/form/form-ui";
import { NumberInput, useFieldError } from "./fields";
import { CollapsibleSection } from "./collapsible-section";
import type { AddProductFormData } from "../add-product.schema";

export function ShippingSection({
  id = "sec-shipping",
  sellerPricing,
}: {
  id?: string;
  sellerPricing: SellerPricingSettings;
}) {
  const t = useTranslations("productForm.sections.shipping");
  const tUnits = useTranslations("productForm.price.units");
  const tStock = useTranslations("productForm.sections.stock");
  const form = useFormContext<AddProductFormData>();
  const weightError = useFieldError("dimensions.weight");
  const handlingError = useFieldError("handlingTime");
  const { submitCount } = useFormState({ control: form.control });
  const [weight, weightUnit, freeDelivery, handlingTime] = useWatch({
    control: form.control,
    name: ["dimensions.weight", "dimensions.weightUnit", "freeDelivery", "handlingTime"],
  });
  const hasWeight = typeof weight === "number" && weight > 0;
  const hasHandling = typeof handlingTime === "number" && handlingTime > 0;
  const summary =
    [
      hasHandling ? t("summaryHandling", { days: handlingTime }) : "",
      hasWeight ? `${weight} ${tUnits(weightUnit ?? "g")}` : "",
      freeDelivery || sellerPricing.sellerFreeDelivery ? t("summaryFree") : "",
    ]
      .filter(Boolean)
      .join(" · ") || t("summaryNeedHandling");

  return (
    <CollapsibleSection
      id={id}
      icon={Truck}
      title={t("title")}
      description={t("description")}
      summary={summary}
      summaryTone={hasHandling ? "ok" : submitCount > 0 ? "bad" : "need"}
      invalid={Boolean(weightError || handlingError)}
      filled={hasWeight || Boolean(freeDelivery)}
    >
      {/*
        Fulfillment method is hidden for now (owner, 2026-10-26): every seller
        handles their own delivery, so products keep the default
        `fulfillmentType: "seller_fulfilled"`. Bring this back (and its
        imports: ChoiceCard, Store, Warehouse, TALLABY_SERVICES_ENABLED) when
        Tallaby fulfillment opens.

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>{t("method")}</FieldLabel>
        <Controller
          control={form.control}
          name="fulfillmentType"
          render={({ field }) => (
            <div role="radiogroup" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <ChoiceCard
                icon={Store}
                title={t("sellerTitle")}
                description={t("sellerDescription")}
                selected={field.value !== "platform_fulfilled"}
                onSelect={() => field.onChange("seller_fulfilled")}
              />
              <ChoiceCard
                icon={Warehouse}
                title={t("platformTitle")}
                description={t("platformDescription")}
                selected={field.value === "platform_fulfilled"}
                onSelect={() => field.onChange("platform_fulfilled")}
                disabled={!TALLABY_SERVICES_ENABLED}
                badge={!TALLABY_SERVICES_ENABLED && t("soon")}
              />
            </div>
          )}
        />
      </div>
      */}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="handling-time" required>
            {t("handling")}
          </FieldLabel>
          <Controller
            control={form.control}
            name="handlingTime"
            render={({ field }) => (
              <NumberStepper
                id="handling-time"
                value={field.value}
                min={1}
                onChange={(value) => field.onChange(value ?? 1)}
                suffix={t("days")}
                invalid={Boolean(handlingError)}
                decrementLabel={tStock("decrease")}
                incrementLabel={tStock("increase")}
              />
            )}
          />
          <FieldHint className="text-faint">{t("handlingHint")}</FieldHint>
          <FieldError>{handlingError}</FieldError>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="weight" note={t("optional")}>
            {t("weight")}
          </FieldLabel>
          <InputGroup invalid={Boolean(weightError)}>
            <NumberInput id="weight" name="dimensions.weight" placeholder="0.0" />
            <Controller
              control={form.control}
              name="dimensions.weightUnit"
              render={({ field }) => (
                <select
                  aria-label={t("weight")}
                  className={GROUP_SELECT_CLASS}
                  value={field.value ?? "g"}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <option value="kg">{tUnits("kg")}</option>
                  <option value="g">{tUnits("g")}</option>
                  <option value="lb">{tUnits("lb")}</option>
                </select>
              )}
            />
          </InputGroup>
          <FieldError>{weightError}</FieldError>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel note={t("dimensionsNote")}>{t("dimensions")}</FieldLabel>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-[repeat(3,minmax(0,1fr))_96px]">
          {(
            [
              ["dimensions.length", t("lengthShort")],
              ["dimensions.width", t("widthShort")],
              ["dimensions.height", t("heightShort")],
            ] as const
          ).map(([name, short]) => (
            <InputGroup key={name}>
              <InputAddon position="start">{short}</InputAddon>
              <NumberInput name={name} placeholder="0" />
            </InputGroup>
          ))}
          <Controller
            control={form.control}
            name="dimensions.unit"
            render={({ field }) => (
              <select
                aria-label={t("dimensions")}
                value={field.value ?? "cm"}
                onChange={(e) => field.onChange(e.target.value)}
                className={cn(FIELD_CLASS, "col-span-3 cursor-pointer border border-input sm:col-span-1")}
              >
                <option value="cm">{tUnits("cm")}</option>
                <option value="in">{tUnits("in")}</option>
              </select>
            )}
          />
        </div>
      </div>

      {sellerPricing.sellerFreeDelivery ? (
        <p className="flex items-center gap-2 rounded-xl border bg-muted px-4 py-3 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-primary-ink" aria-hidden />
          {t("storeFreeDelivery")}
        </p>
      ) : (
        <Controller
          control={form.control}
          name="freeDelivery"
          render={({ field }) => (
            <ToggleRow
              id="free-delivery"
              boxed
              checked={!!field.value}
              onCheckedChange={field.onChange}
              title={t("freeTitle")}
              description={t("freeDescription")}
            />
          )}
        />
      )}
    </CollapsibleSection>
  );
}
