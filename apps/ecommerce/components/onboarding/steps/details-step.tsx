"use client";

import { useLocale, useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import { Warehouse } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
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
  ChoiceCard,
  InlineError,
  SelectField,
  TextAreaField,
  TextField,
  useGovernorateOptions,
} from "../onboarding.chunks";

export function DetailsStep() {
  const t = useTranslations("onboarding");
  const form = useFormContext<OnboardingFormValues>();
  const services = useWatch({ control: form.control, name: "services" });
  const fragile = useWatch({ control: form.control, name: "details.hasFragileProducts" });

  const rangeOptions = (ranges: readonly string[]) =>
    ranges.map((value) => ({ value, label: t(`range.${value}`) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          name="details.estimatedSkus"
          label={t("details.skus")}
          description={t("details.skusWhy")}
          placeholder={t("details.select")}
          options={rangeOptions(SKU_RANGES)}
        />
        <SelectField
          name="details.estimatedDailyOrders"
          label={t("details.dailyOrders")}
          description={t("details.dailyOrdersWhy")}
          placeholder={t("details.select")}
          options={rangeOptions(DAILY_ORDER_RANGES)}
        />
      </div>

      <SelectField
        name="details.sizeCategory"
        label={t("details.sizeCategory")}
        placeholder={t("details.select")}
        options={PRODUCT_SIZE_CATEGORIES.map((value) => ({
          value,
          label: t(`details.size_${value}`),
        }))}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium">{t("details.fragile")}</p>
        <p className="text-sm text-muted-foreground">{t("details.fragileWhy")}</p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup">
          {[true, false].map((value) => (
            <ChoiceCard
              key={String(value)}
              className="py-3"
              selected={fragile === value}
              onSelect={() => {
                form.setValue("details.hasFragileProducts", value, { shouldDirty: true });
                form.clearErrors("details.hasFragileProducts");
              }}
              title={value ? t("details.yes") : t("details.no")}
            />
          ))}
        </div>
        <InlineError name="details.hasFragileProducts" />
      </div>

      {services.storage.provider === "tallaby" && (
        <SelectField
          name="details.estimatedInventoryUnits"
          label={t("details.inventoryUnits")}
          description={t("details.inventoryUnitsWhy")}
          placeholder={t("details.select")}
          options={rangeOptions(INVENTORY_UNIT_RANGES)}
        />
      )}

      {services.packaging.provider === "tallaby" && (
        <TextAreaField
          name="details.specialPackagingNotes"
          label={t("details.packagingNotes")}
          placeholder={t("details.packagingNotesPlaceholder")}
        />
      )}

      {services.delivery.provider === "tallaby" && <CoverageField />}

      {requiresInventoryDropOff(services) && (
        <Alert>
          <Warehouse className="size-4" />
          <AlertTitle>{t("details.dropOffTitle")}</AlertTitle>
          <AlertDescription>{t("details.dropOffBody")}</AlertDescription>
        </Alert>
      )}

      {requiresPickupAddress(services) && <PickupSection />}
    </div>
  );
}

function CoverageField() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const form = useFormContext<OnboardingFormValues>();
  const selected = useWatch({ control: form.control, name: "details.coverageGovernorates" }) ?? [];

  const toggle = (value: string, checked: boolean) =>
    form.setValue(
      "details.coverageGovernorates",
      checked ? [...selected, value] : selected.filter((v) => v !== value),
      { shouldDirty: true }
    );

  return (
    <fieldset className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend className="text-sm font-medium">{t("details.coverage")}</legend>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              form.setValue("details.coverageGovernorates", [...EGYPT_GOVERNORATES], {
                shouldDirty: true,
              })
            }
          >
            {t("details.selectAll")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => form.setValue("details.coverageGovernorates", [], { shouldDirty: true })}
          >
            {t("details.clearAll")}
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{t("details.coverageWhy")}</p>
      <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-3">
        {EGYPT_GOVERNORATES.map((value) => {
          const id = `coverage-${value.replace(/\s+/g, "-")}`;
          return (
            <div key={value} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={selected.includes(value)}
                onCheckedChange={(checked) => toggle(value, checked === true)}
              />
              <Label htmlFor={id} className="text-sm font-normal">
                {getGovernorateLabel(value, locale)}
              </Label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function PickupSection() {
  const t = useTranslations("onboarding");
  const form = useFormContext<OnboardingFormValues>();
  const sameAsLegal = useWatch({ control: form.control, name: "pickup.sameAsLegal" });
  const governorates = useGovernorateOptions(EGYPT_GOVERNORATES);

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <header>
        <h3 className="font-semibold">{t("details.pickupTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("details.pickupWhy")}</p>
      </header>

      <div className="flex items-center gap-2">
        <Checkbox
          id="pickup-same-as-legal"
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

      {!sameAsLegal && (
        <>
          <TextField name="pickup.street" label={t("details.street")} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              name="pickup.governorate"
              label={t("governorate")}
              placeholder={t("selectGovernorate")}
              options={governorates}
            />
            <TextField name="pickup.city" label={t("city")} />
          </div>
          <TextField name="pickup.landmark" label={t("details.landmark")} />
        </>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField name="pickup.contactName" label={t("details.contactName")} />
        <TextField
          name="pickup.contactPhone"
          type="tel"
          dir="ltr"
          label={t("details.contactPhone")}
          placeholder="01XXXXXXXXX"
        />
      </div>
    </section>
  );
}
