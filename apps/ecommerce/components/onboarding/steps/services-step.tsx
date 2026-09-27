"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  FULFILLMENT_SERVICE_TYPES,
  plansForService,
  type FulfillmentPlanView,
  type FulfillmentServiceType,
  type SellerDeliveryMode,
  type ServiceChoice,
} from "@workspace/lib/fulfillment";
import type { OnboardingFormValues } from "../become-seller.dto";
import { tallabyAvailable, tallabyChoice } from "../fulfillment-choices.lib";
import { ChoiceCard, InlineError, PlanCard } from "../onboarding.chunks";

export function ServicesStep({ plans }: { plans: FulfillmentPlanView[] }) {
  const t = useTranslations("onboarding");
  const form = useFormContext<OnboardingFormValues>();
  const [switchedNotice, setSwitchedNotice] = useState(false);

  const setChoice = (type: FulfillmentServiceType, choice: ServiceChoice) => {
    form.setValue(`services.${type}`, choice, { shouldDirty: true });
    form.clearErrors(`services.${type}`);

    // Keeping any service in-house means the seller manages fulfillment.
    if (choice.provider === "seller" && form.getValues("model") === "tallaby_fulfillment") {
      form.setValue("model", "seller_managed", { shouldDirty: true });
      setSwitchedNotice(true);
    }
  };

  return (
    <div className="space-y-6">
      {switchedNotice && (
        <Alert>
          <Info className="size-4" />
          <AlertDescription>{t("model.switchedToManaged")}</AlertDescription>
        </Alert>
      )}
      {FULFILLMENT_SERVICE_TYPES.map((type) => (
        <ServiceSection
          key={type}
          type={type}
          plans={plans}
          onChange={(choice) => setChoice(type, choice)}
        />
      ))}
    </div>
  );
}

function ServiceSection({
  type,
  plans,
  onChange,
}: {
  type: FulfillmentServiceType;
  plans: FulfillmentPlanView[];
  onChange: (choice: ServiceChoice) => void;
}) {
  const t = useTranslations("onboarding");
  const form = useFormContext<OnboardingFormValues>();
  const choice = useWatch({ control: form.control, name: `services.${type}` });
  const servicePlans = plansForService(plans, type);
  const canUseTallaby = tallabyAvailable(plans, type);

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <header>
        <h3 className="font-semibold">{t(`service.${type}.name`)}</h3>
        <p className="text-sm text-muted-foreground">{t(`service.${type}.description`)}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
        <ChoiceCard
          selected={choice.provider === "tallaby"}
          disabled={!canUseTallaby}
          onSelect={() => onChange(tallabyChoice(plans, type, choice))}
          title={
            <span className="flex flex-wrap items-center gap-2">
              {t(`tallabyOption.${type}`)}
              {canUseTallaby && <Badge>{t("recommended")}</Badge>}
            </span>
          }
          description={
            !canUseTallaby
              ? t("tallabyUnavailable")
              : type === "storage"
                ? t("tallabyStorageDetail")
                : undefined
          }
        />
        <ChoiceCard
          selected={choice.provider === "seller"}
          onSelect={() =>
            onChange({
              provider: "seller",
              planId: null,
              config: type === "delivery" ? choice.config : undefined,
            })
          }
          title={t(`sellerOption.${type}`)}
          description={t(`sellerOptionDetail.${type}`)}
        />
      </div>
      <InlineError name={`services.${type}.provider`} />

      {choice.provider === "tallaby" && servicePlans.length > 0 && (
        <div className="space-y-2">
          {servicePlans.length > 1 && (
            <p className="text-sm font-medium">{t("choosePlan")}</p>
          )}
          <div className="grid gap-3" role="radiogroup">
            {servicePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={choice.planId === plan.id}
                onSelect={() => onChange({ provider: "tallaby", planId: plan.id })}
              />
            ))}
          </div>
        </div>
      )}
      {/* Outside the plan list: also shown when Tallaby has no active plan here. */}
      <InlineError name={`services.${type}.planId`} />

      {type === "delivery" && choice.provider === "seller" && (
        <SellerDeliveryMode choice={choice} onChange={onChange} />
      )}
    </section>
  );
}

function SellerDeliveryMode({
  choice,
  onChange,
}: {
  choice: ServiceChoice;
  onChange: (choice: ServiceChoice) => void;
}) {
  const t = useTranslations("onboarding");
  const mode = choice.config?.mode;
  const setMode = (next: SellerDeliveryMode) =>
    onChange({ ...choice, config: { ...choice.config, mode: next } });

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t("deliveryMode")}</p>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
        <ChoiceCard
          selected={mode === "own_riders"}
          onSelect={() => setMode("own_riders")}
          title={t("deliveryMode_own_riders")}
          description={t("deliveryMode_own_ridersHint")}
        />
        <ChoiceCard
          selected={mode === "external_courier"}
          onSelect={() => setMode("external_courier")}
          title={t("deliveryMode_external_courier")}
          description={t("deliveryMode_external_courierHint")}
        />
      </div>
      <InlineError name="services.delivery.config.mode" />
      {mode === "external_courier" && (
        <div className="space-y-1.5">
          <Label htmlFor="courier-name">{t("courierName")}</Label>
          <Input
            id="courier-name"
            placeholder={t("courierNamePlaceholder")}
            value={choice.config?.courierName ?? ""}
            maxLength={100}
            onChange={(e) =>
              onChange({ ...choice, config: { ...choice.config, courierName: e.target.value } })
            }
          />
        </div>
      )}
    </div>
  );
}
