"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { EGYPT_GOVERNORATES } from "@workspace/lib/shipping";
import {
  FieldGrid,
  SelectField,
  TextField,
  useGovernorateOptions,
} from "../onboarding.chunks";

export function LegalAddressStep() {
  const t = useTranslations("onboarding");
  const governorates = useGovernorateOptions(EGYPT_GOVERNORATES);

  return (
    <>
      <Alert variant="info">
        <CircleAlert />
        <AlertDescription>{t("legalAddressWhy")}</AlertDescription>
      </Alert>

      <FieldGrid>
        <TextField
          name="legalAddress.street"
          label={t("streetAddress")}
          placeholder={t("streetAddressPlaceholder")}
          className="sm:col-span-2"
        />
        <SelectField
          name="legalAddress.state"
          label={t("governorate")}
          placeholder={t("selectGovernorate")}
          options={governorates}
        />
        <TextField name="legalAddress.city" label={t("city")} placeholder={t("enterCity")} />
        <TextField
          name="legalAddress.postalCode"
          label={t("postalZipCode")}
          placeholder="11765"
          inputMode="numeric"
          dir="ltr"
          optional
        />
      </FieldGrid>
    </>
  );
}
