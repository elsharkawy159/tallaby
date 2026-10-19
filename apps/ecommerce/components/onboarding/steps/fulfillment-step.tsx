"use client";

import { useState, type ComponentType } from "react";
import {
  ChevronDown,
  CircleCheck,
  Headset,
  Info,
  Package,
  PackageCheck,
  SlidersHorizontal,
  Truck,
  Undo2,
  Warehouse,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import {
  ChoiceCard,
  ChoiceGroup,
  ChoiceIndicator,
  ChoiceItem,
} from "@workspace/ui/components/choice-card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@workspace/ui/components/segmented-control";
import {
  FULFILLMENT_SERVICE_TYPES,
  localizedPlanDescription,
  localizedPlanName,
  localizedText,
  plansForService,
  TALLABY_FULFILLMENT_ENABLED,
  type FulfillmentModel,
  type FulfillmentPlanView,
  type FulfillmentServiceType,
  type SellerDeliveryMode,
  type ServiceChoice,
} from "@workspace/lib/fulfillment";
import { getGovernorateLabel } from "@workspace/lib/shipping";
import type { OnboardingFormValues } from "../become-seller.dto";
import {
  sellerManagedPreset,
  tallabyAvailable,
  tallabyAvailableEverywhere,
  tallabyChoice,
  tallabyPreset,
} from "../fulfillment-choices.lib";
import { FeatureList, InlineError, PlanPricing } from "../onboarding.chunks";

export const SERVICE_ICONS: Record<FulfillmentServiceType, ComponentType<{ className?: string }>> = {
  storage: Warehouse,
  packaging: Package,
  delivery: Truck,
  customer_service: Headset,
  returns: Undo2,
};

export function FulfillmentStep({ plans }: { plans: FulfillmentPlanView[] }) {
  const t = useTranslations("onboarding");
  const form = useFormContext<OnboardingFormValues>();
  const model = useWatch({ control: form.control, name: "model" });
  const services = useWatch({ control: form.control, name: "services" });
  const [switchedNotice, setSwitchedNotice] = useState(false);
  // Full Tallaby fulfillment needs an active plan in every service.
  const tallabyEverywhere = tallabyAvailableEverywhere(plans);
  const tallabyCount = FULFILLMENT_SERVICE_TYPES.filter(
    (type) => services[type].provider === "tallaby"
  ).length;

  const chooseModel = (next: FulfillmentModel) => {
    if (next === model) return;
    form.setValue(
      "services",
      next === "tallaby_fulfillment"
        ? tallabyPreset(plans, form.getValues("services"))
        : sellerManagedPreset(plans),
      { shouldDirty: true }
    );
    form.setValue("model", next, { shouldDirty: true });
    form.clearErrors(["model", "services"]);
    setSwitchedNotice(false);
  };

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
    <>
      <div className="space-y-2">
        <ChoiceGroup
          columns={2}
          stack
          className="gap-3"
          value={model || ""}
          onValueChange={(value) => chooseModel(value as FulfillmentModel)}
        >
          <ChoiceCard
            value="tallaby_fulfillment"
            size="lg"
            indicator
            disabled={!TALLABY_FULFILLMENT_ENABLED || !tallabyEverywhere}
            icon={<PackageCheck className="size-5.5" />}
            badge={
              !TALLABY_FULFILLMENT_ENABLED ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11.5px] font-semibold text-muted-foreground">
                  {t("model.soon")}
                </span>
              ) : (
                tallabyEverywhere && (
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-accent-ink">
                    {t("recommended")}
                  </span>
                )
              )
            }
            title={t("model.tallabyTitle")}
            description={
              !TALLABY_FULFILLMENT_ENABLED || tallabyEverywhere
                ? t("model.tallabyDescription")
                : t("tallabyUnavailable")
            }
          />
          <ChoiceCard
            value="seller_managed"
            size="lg"
            indicator
            icon={<SlidersHorizontal className="size-5.5" />}
            title={t("model.manageTitle")}
            description={t("model.manageDescription")}
          />
        </ChoiceGroup>
        <InlineError name="model" />
      </div>

      {switchedNotice && (
        <Alert variant="info">
          <Info />
          <AlertDescription>{t("model.switchedToManaged")}</AlertDescription>
        </Alert>
      )}

      <div className="-mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-neutral-900 dark:text-foreground">
          {t("fulfillment.services")}
        </h3>
        <span className="text-[13px] text-muted-foreground">
          {t("fulfillment.tallabyCount", {
            count: tallabyCount,
            total: FULFILLMENT_SERVICE_TYPES.length,
          })}
        </span>
      </div>

      <div className="divide-y divide-neutral-200 overflow-hidden rounded-[14px] border border-neutral-200 dark:divide-input dark:border-input">
        {FULFILLMENT_SERVICE_TYPES.map((type) => (
          <ServiceRow
            key={type}
            type={type}
            plans={plans}
            choice={services[type]}
            onChange={(choice) => setChoice(type, choice)}
          />
        ))}
      </div>

      <Alert variant="muted">
        <CircleCheck />
        <AlertDescription>{t("fulfillment.pricingNote")}</AlertDescription>
      </Alert>
    </>
  );
}

function ServiceRow({
  type,
  plans,
  choice,
  onChange,
}: {
  type: FulfillmentServiceType;
  plans: FulfillmentPlanView[];
  choice: ServiceChoice;
  onChange: (choice: ServiceChoice) => void;
}) {
  const t = useTranslations("onboarding");
  const canUseTallaby = tallabyAvailable(plans, type);
  const byTallaby = choice.provider === "tallaby";
  const Icon = SERVICE_ICONS[type];

  const setProvider = (provider: string) =>
    onChange(
      provider === "tallaby"
        ? tallabyChoice(plans, type, choice)
        : {
            provider: "seller",
            planId: null,
            config: type === "delivery" ? choice.config : undefined,
          }
    );

  return (
    <div className="bg-card px-4.5 py-4">
      <div className="flex flex-wrap items-center gap-3.5 sm:flex-nowrap">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-[10px]",
            byTallaby ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-neutral-900 dark:text-foreground">
            {t(`service.${type}.name`)}
          </p>
          <p className="text-[13px] leading-normal text-muted-foreground">
            {canUseTallaby ? t(`service.${type}.description`) : t("tallabyUnavailable")}
          </p>
        </div>
        <SegmentedControl
          value={choice.provider}
          onValueChange={setProvider}
          aria-label={t(`service.${type}.name`)}
          className="ms-13.5 sm:ms-0"
        >
          <SegmentedControlItem value="tallaby" disabled={!canUseTallaby}>
            {t("review.handledBy_tallaby")}
          </SegmentedControlItem>
          <SegmentedControlItem value="seller">{t("fulfillment.me")}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div className="space-y-2 empty:hidden sm:ms-13.5">
        {byTallaby && plansForService(plans, type).length > 0 && (
          <PlanPicker type={type} plans={plans} choice={choice} onChange={onChange} />
        )}
        {type === "delivery" && !byTallaby && (
          <SellerDeliveryMode choice={choice} onChange={onChange} />
        )}
        <InlineError name={`services.${type}.provider`} />
        <InlineError name={`services.${type}.planId`} />
      </div>
    </div>
  );
}

function PlanPicker({
  type,
  plans,
  choice,
  onChange,
}: {
  type: FulfillmentServiceType;
  plans: FulfillmentPlanView[];
  choice: ServiceChoice;
  onChange: (choice: ServiceChoice) => void;
}) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const servicePlans = plansForService(plans, type);
  const current = servicePlans.find((plan) => plan.id === choice.planId);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] bg-muted px-3 py-2.5 text-[13.5px] text-neutral-700 hover:bg-neutral-100 dark:text-foreground dark:hover:bg-input/40">
        <span>
          {t("fulfillment.plan")}:{" "}
          <b className="text-neutral-900 dark:text-foreground">
            {current ? localizedPlanName(current, locale) : t("choosePlan")}
          </b>
        </span>
        <span className="flex items-center gap-1 font-semibold text-primary">
          {open ? t("fulfillment.done") : t("fulfillment.change")}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ChoiceGroup
          stack
          columns={1}
          className="mt-2 gap-2"
          value={choice.planId ?? ""}
          onValueChange={(planId) => onChange({ provider: "tallaby", planId })}
        >
          {servicePlans.map((plan) => (
            <ChoiceItem
              key={plan.id}
              value={plan.id}
              className="flex items-start gap-3 rounded-[10px] px-3.5 py-3 data-[state=checked]:shadow-none"
            >
              <ChoiceIndicator className="mt-0.5" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-neutral-900 dark:text-foreground">
                  {localizedPlanName(plan, locale)}
                </span>
                {localizedPlanDescription(plan, locale) && (
                  <span className="text-[12.5px] text-muted-foreground">
                    {localizedPlanDescription(plan, locale)}
                  </span>
                )}
                <FeatureList items={plan.features.map((f) => localizedText(f, locale))} />
                {plan.serviceType === "delivery" && <DeliveryAvailability plan={plan} />}
                <PlanPricing plan={plan} className="mt-1" />
              </span>
            </ChoiceItem>
          ))}
        </ChoiceGroup>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DeliveryAvailability({ plan }: { plan: FulfillmentPlanView }) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const governorates = plan.availability?.governorates;
  return (
    <span className="mt-1 text-xs text-muted-foreground">
      {governorates?.length
        ? t("availableIn", {
            areas: governorates
              .map((g) => getGovernorateLabel(g, locale))
              .join(locale.startsWith("ar") ? "، " : ", "),
          })
        : t("availabilityConfirmed")}
    </span>
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
    <div className="mt-3 space-y-3">
      <p className="text-sm font-semibold text-neutral-900 dark:text-foreground">
        {t("deliveryMode")}
      </p>
      <ChoiceGroup
        columns={2}
        stack
        value={mode ?? ""}
        onValueChange={(value) => setMode(value as SellerDeliveryMode)}
      >
        <ChoiceCard
          value="own_riders"
          title={t("deliveryMode_own_riders")}
          description={t("deliveryMode_own_ridersHint")}
        />
        <ChoiceCard
          value="external_courier"
          title={t("deliveryMode_external_courier")}
          description={t("deliveryMode_external_courierHint")}
        />
      </ChoiceGroup>
      <InlineError name="services.delivery.config.mode" />
      {mode === "external_courier" && (
        <div className="space-y-2">
          <Label htmlFor="courier-name" className="text-sm font-semibold">
            {t("courierName")}
          </Label>
          <Input
            id="courier-name"
            className="h-11.5 rounded-[10px] bg-card px-3.5 text-[15px] md:text-[15px]"
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
