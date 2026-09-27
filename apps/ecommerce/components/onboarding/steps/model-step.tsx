"use client";

import { Check, PackageCheck, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";
import {
  FULFILLMENT_SERVICE_TYPES,
  type FulfillmentModel,
  type FulfillmentPlanView,
} from "@workspace/lib/fulfillment";
import type { OnboardingFormValues } from "../become-seller.dto";
import { Badge } from "@workspace/ui/components/badge";
import {
  sellerManagedPreset,
  tallabyAvailableEverywhere,
  tallabyPreset,
} from "../fulfillment-choices.lib";
import { ChoiceCard, InlineError } from "../onboarding.chunks";

export function ModelStep({ plans }: { plans: FulfillmentPlanView[] }) {
  const t = useTranslations("onboarding");
  const form = useFormContext<OnboardingFormValues>();
  const model = useWatch({ control: form.control, name: "model" });
  // Full Tallaby fulfillment needs an active plan in every service.
  const tallabyEverywhere = tallabyAvailableEverywhere(plans);

  const choose = (next: FulfillmentModel) => {
    if (next === model) return;
    const services = form.getValues("services");
    form.setValue(
      "services",
      next === "tallaby_fulfillment" ? tallabyPreset(plans, services) : sellerManagedPreset(plans),
      { shouldDirty: true }
    );
    form.setValue("model", next, { shouldDirty: true });
    form.clearErrors(["model", "services"]);
  };

  return (
    <div className="space-y-4" role="radiogroup">
      <ChoiceCard
        selected={model === "tallaby_fulfillment"}
        disabled={!tallabyEverywhere}
        onSelect={() => choose("tallaby_fulfillment")}
        title={
          <span className="flex items-center gap-2">
            <PackageCheck className="size-4 text-primary" />
            {t("model.tallabyTitle")}
            {tallabyEverywhere && <Badge className="ms-1">{t("recommended")}</Badge>}
          </span>
        }
        description={
          tallabyEverywhere ? t("model.tallabyDescription") : t("tallabyUnavailable")
        }
      >
        <div className="pt-2">
          <p className="text-xs font-medium text-muted-foreground">{t("model.includes")}</p>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {FULFILLMENT_SERVICE_TYPES.map((type) => (
              <li key={type} className="flex items-center gap-1">
                <Check className="size-3.5 text-primary" />
                {t(`service.${type}.name`)}
              </li>
            ))}
          </ul>
        </div>
      </ChoiceCard>
      <ChoiceCard
        selected={model === "seller_managed"}
        onSelect={() => choose("seller_managed")}
        title={
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            {t("model.manageTitle")}
          </span>
        }
        description={t("model.manageDescription")}
      />
      <InlineError name="model" />
    </div>
  );
}
