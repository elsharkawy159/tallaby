"use client";

import { useTranslations } from "next-intl";
import { EGYPT_GOVERNORATES } from "@workspace/lib/shipping";
import { SelectField, TextField, useGovernorateOptions } from "../onboarding.chunks";

export function LegalAddressStep() {
  const t = useTranslations("onboarding");
  const governorates = useGovernorateOptions(EGYPT_GOVERNORATES);

  return (
    <div className="space-y-4 md:space-y-6">
      <p className="text-sm text-muted-foreground">{t("legalAddressWhy")}</p>

      <TextField
        name="legalAddress.street"
        label={t("streetAddress")}
        placeholder={t("streetAddressPlaceholder")}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          name="legalAddress.state"
          label={t("governorate")}
          placeholder={t("selectGovernorate")}
          options={governorates}
        />
        <TextField name="legalAddress.city" label={t("city")} placeholder={t("enterCity")} />
      </div>

      <TextField
        name="legalAddress.postalCode"
        label={t("postalZipCode")}
        placeholder={t("enterPostalCode")}
        dir="ltr"
      />
    </div>
  );
}
