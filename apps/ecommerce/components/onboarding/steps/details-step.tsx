"use client";

import { Check, Warehouse } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { ChoiceCard, ChoiceGroup } from "@workspace/ui/components/choice-card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Label } from "@workspace/ui/components/label";
import { Toggle } from "@workspace/ui/components/toggle";
import {
  DAILY_ORDER_RANGES,
  INVENTORY_UNIT_RANGES,
  PRODUCT_SIZE_CATEGORIES,
  SKU_RANGES,
  requiresInventoryDropOff,
  requiresPickupAddress,
} from "@workspace/lib/fulfillment";
import { EGYPT_GOVERNORATES, getGovernorateLabel } from "@workspace/lib/shipping";
import type { OnboardingFormValues } from "../become-seller.dto";
import {
  ChoiceField,
  FieldGrid,
  FieldLabelText,
  SelectField,
  TextAreaField,
  TextField,
  useGovernorateOptions,
} from "../onboarding.chunks";

export function DetailsStep() {
  const t = useTranslations("onboarding");
  const form = useFormContext<OnboardingFormValues>();
  const services = useWatch({ control: form.control, name: "services" });

  const rangeOptions = (ranges: readonly string[]) =>
    ranges.map((value) => ({ value, label: t(`range.${value}`) }));

  return (
    <>
      <ChoiceField
        name="details.estimatedSkus"
        label={t("details.skus")}
        description={t("details.skusWhy")}
        columns={SKU_RANGES.length}
        options={rangeOptions(SKU_RANGES)}
      />
      <ChoiceField
        name="details.estimatedDailyOrders"
        label={t("details.dailyOrders")}
        description={t("details.dailyOrdersWhy")}
        columns={DAILY_ORDER_RANGES.length}
        options={rangeOptions(DAILY_ORDER_RANGES)}
      />
      <ChoiceField
        name="details.sizeCategory"
        label={t("details.sizeCategory")}
        columns={PRODUCT_SIZE_CATEGORIES.length}
        options={PRODUCT_SIZE_CATEGORIES.map((value) => ({
          value,
          label: t(`details.sizeShort_${value}`),
          description: t(`details.sizeHint_${value}`),
        }))}
      />
      <FragileField />

      {services.storage.provider === "tallaby" && (
        <ChoiceField
          name="details.estimatedInventoryUnits"
          label={t("details.inventoryUnits")}
          description={t("details.inventoryUnitsWhy")}
          columns={INVENTORY_UNIT_RANGES.length}
          options={rangeOptions(INVENTORY_UNIT_RANGES)}
        />
      )}

      {services.packaging.provider === "tallaby" && (
        <TextAreaField
          name="details.specialPackagingNotes"
          label={t("details.packagingNotes")}
          placeholder={t("details.packagingNotesPlaceholder")}
          rows={2}
          maxLength={500}
          optional
        />
      )}

      {services.delivery.provider === "tallaby" && <CoverageField />}

      {requiresInventoryDropOff(services) && (
        <Alert variant="info">
          <Warehouse />
          <AlertTitle className="font-semibold">{t("details.dropOffTitle")}</AlertTitle>
          <AlertDescription>{t("details.dropOffBody")}</AlertDescription>
        </Alert>
      )}

      {requiresPickupAddress(services) && <PickupSection />}
    </>
  );
}

function FragileField() {
  const t = useTranslations("onboarding");
  const { control, clearErrors } = useFormContext<OnboardingFormValues>();
  return (
    <FormField
      control={control}
      name="details.hasFragileProducts"
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="text-sm font-semibold text-neutral-900 data-[error=true]:text-neutral-900 dark:text-foreground">
            {t("details.fragile")}
          </FormLabel>
          <FormControl>
            <ChoiceGroup
              ref={field.ref}
              columns={2}
              value={field.value === null ? "" : field.value ? "yes" : "no"}
              onValueChange={(value) => {
                field.onChange(value === "yes");
                clearErrors("details.hasFragileProducts");
              }}
            >
              {(["yes", "no"] as const).map((value) => (
                <ChoiceCard
                  key={value}
                  value={value}
                  title={t(`details.${value}`)}
                  aria-invalid={!!fieldState.error}
                />
              ))}
            </ChoiceGroup>
          </FormControl>
          {!fieldState.error && (
            <FormDescription className="text-[12.5px]">{t("details.fragileWhy")}</FormDescription>
          )}
          <FormMessage className="text-[13px] font-medium" />
        </FormItem>
      )}
    />
  );
}

const pillClass =
  "h-9 min-w-0 cursor-pointer gap-1.5 rounded-full border border-neutral-300 bg-card px-3.5 text-[13.5px] font-normal text-neutral-700 hover:border-secondary hover:bg-card hover:text-neutral-700 dark:border-input dark:text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-white [&_svg]:size-3.5";

function CoverageField() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const form = useFormContext<OnboardingFormValues>();
  const selected = useWatch({ control: form.control, name: "details.coverageGovernorates" }) ?? [];
  const all = selected.length === EGYPT_GOVERNORATES.length;
  const set = (next: string[]) =>
    form.setValue("details.coverageGovernorates", next, { shouldDirty: true });

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-foreground">
        <FieldLabelText optional>{t("details.coverage")}</FieldLabelText>
      </legend>
      <div className="flex flex-wrap gap-2">
        <Toggle
          pressed={all}
          onPressedChange={() => set(all ? [] : [...EGYPT_GOVERNORATES])}
          className={`${pillClass} font-semibold`}
        >
          {all && <Check aria-hidden />}
          {t("details.allEgypt")}
        </Toggle>
        {EGYPT_GOVERNORATES.map((value) => {
          const on = selected.includes(value);
          return (
            <Toggle
              key={value}
              pressed={on}
              onPressedChange={(pressed) =>
                set(pressed ? [...selected, value] : selected.filter((v) => v !== value))
              }
              className={pillClass}
            >
              {on && <Check aria-hidden />}
              {getGovernorateLabel(value, locale)}
            </Toggle>
          );
        })}
      </div>
      <p className="text-[12.5px] text-muted-foreground">{t("details.coverageWhy")}</p>
    </fieldset>
  );
}

function PickupSection() {
  const t = useTranslations("onboarding");
  const form = useFormContext<OnboardingFormValues>();
  const sameAsLegal = useWatch({ control: form.control, name: "pickup.sameAsLegal" });
  const governorates = useGovernorateOptions(EGYPT_GOVERNORATES);

  return (
    <section className="space-y-4 rounded-[14px] border border-neutral-200 p-5 dark:border-input">
      <header>
        <h3 className="text-base font-bold text-neutral-900 dark:text-foreground">
          {t("details.pickupTitle")}
        </h3>
        <p className="text-[13px] text-muted-foreground">{t("details.pickupWhy")}</p>
      </header>

      <div className="flex items-center gap-2.5">
        <Checkbox
          id="pickup-same-as-legal"
          className="size-5 rounded-md"
          checked={sameAsLegal}
          onCheckedChange={(checked) => {
            form.setValue("pickup.sameAsLegal", checked === true, { shouldDirty: true });
            form.clearErrors("pickup");
          }}
        />
        <Label htmlFor="pickup-same-as-legal" className="font-normal">
          {t("details.sameAsLegal")}
        </Label>
      </div>

      <FieldGrid>
        {!sameAsLegal && (
          <>
            <TextField name="pickup.street" label={t("details.street")} className="sm:col-span-2" />
            <SelectField
              name="pickup.governorate"
              label={t("governorate")}
              placeholder={t("selectGovernorate")}
              options={governorates}
            />
            <TextField name="pickup.city" label={t("city")} />
            <TextField
              name="pickup.landmark"
              label={t("details.landmark")}
              className="sm:col-span-2"
              optional
            />
          </>
        )}
        <TextField name="pickup.contactName" label={t("details.contactName")} optional />
        <TextField
          name="pickup.contactPhone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          label={t("details.contactPhone")}
          placeholder="01XXXXXXXXX"
        />
      </FieldGrid>
    </section>
  );
}
