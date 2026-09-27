"use client";

import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  FULFILLMENT_SERVICE_TYPES,
  localizedPlanName,
  requiresInventoryDropOff,
  requiresPickupAddress,
  type FulfillmentPlanView,
} from "@workspace/lib/fulfillment";
import { getGovernorateLabel } from "@workspace/lib/shipping";
import {
  toPickupAddress,
  type OnboardingFormValues,
  type OnboardingStep,
} from "../become-seller.dto";
import { PlanPricing } from "../onboarding.chunks";

export function ReviewStep({
  plans,
  onEdit,
}: {
  plans: FulfillmentPlanView[];
  onEdit: (step: OnboardingStep) => void;
}) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const values = useFormContext<OnboardingFormValues>().getValues();
  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const none = t("review.notProvided");
  const d = values.details;
  const pickup = toPickupAddress(values);

  return (
    <div className="space-y-4">
      <ReviewSection title={t("review.business")} onEdit={() => onEdit("business")}>
        <Row label={t("businessName")} value={values.businessName} />
        <Row
          label={t("businessType")}
          value={values.businessType ? t(`businessType_${values.businessType}`) : none}
        />
        <Row label={t("supportEmail")} value={values.supportEmail} dir="ltr" />
        <Row label={t("supportPhone")} value={values.supportPhone || none} dir="ltr" />
      </ReviewSection>

      <ReviewSection title={t("review.address")} onEdit={() => onEdit("legal")}>
        <Row
          label={t("streetAddress")}
          value={[
            values.legalAddress.street,
            values.legalAddress.city,
            values.legalAddress.state && getGovernorateLabel(values.legalAddress.state, locale),
          ]
            .filter(Boolean)
            .join(locale.startsWith("ar") ? "، " : ", ")}
        />
      </ReviewSection>

      <ReviewSection title={t("review.fulfillment")} onEdit={() => onEdit("model")}>
        <p className="text-sm">
          {values.model === "tallaby_fulfillment" ? t("model.tallabyTitle") : t("model.manageTitle")}
        </p>
      </ReviewSection>

      <ReviewSection title={t("review.requestedServices")} onEdit={() => onEdit("services")}>
        <ul className="divide-y">
          {FULFILLMENT_SERVICE_TYPES.map((type) => {
            const choice = values.services[type];
            const plan = choice.planId ? planById.get(choice.planId) : undefined;
            return (
              <li key={type} className="flex flex-wrap items-start justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t(`service.${type}.name`)}</p>
                  {plan && (
                    <div className="mt-0.5 space-y-0.5">
                      <p className="text-sm text-muted-foreground">
                        {localizedPlanName(plan, locale)}
                      </p>
                      <PlanPricing plan={plan} />
                    </div>
                  )}
                  {type === "delivery" && choice.provider === "seller" && choice.config?.mode && (
                    <p className="text-sm text-muted-foreground">
                      {t(`deliveryMode_${choice.config.mode}`)}
                      {choice.config.mode === "external_courier" && choice.config.courierName
                        ? ` · ${choice.config.courierName}`
                        : ""}
                    </p>
                  )}
                </div>
                <Badge variant={choice.provider === "tallaby" ? "default" : "secondary"}>
                  {t(`review.handledBy_${choice.provider}`)}
                </Badge>
              </li>
            );
          })}
        </ul>
        {FULFILLMENT_SERVICE_TYPES.some((type) => values.services[type].provider === "tallaby") && (
          <p className="pt-2 text-xs text-muted-foreground">{t("review.confirmedAfterContact")}</p>
        )}
      </ReviewSection>

      <ReviewSection title={t("review.operations")} onEdit={() => onEdit("details")}>
        <Row label={t("details.skus")} value={d.estimatedSkus ? t(`range.${d.estimatedSkus}`) : none} />
        <Row
          label={t("details.dailyOrders")}
          value={d.estimatedDailyOrders ? t(`range.${d.estimatedDailyOrders}`) : none}
        />
        <Row
          label={t("details.sizeCategory")}
          value={d.sizeCategory ? t(`details.size_${d.sizeCategory}`) : none}
        />
        <Row
          label={t("details.fragile")}
          value={
            d.hasFragileProducts === null ? none : d.hasFragileProducts ? t("details.yes") : t("details.no")
          }
        />
        {values.services.storage.provider === "tallaby" && (
          <Row
            label={t("details.inventoryUnits")}
            value={d.estimatedInventoryUnits ? t(`range.${d.estimatedInventoryUnits}`) : none}
          />
        )}
        {values.services.packaging.provider === "tallaby" && d.specialPackagingNotes && (
          <Row label={t("details.packagingNotes")} value={d.specialPackagingNotes} />
        )}
        {values.services.delivery.provider === "tallaby" && d.coverageGovernorates.length > 0 && (
          <Row
            label={t("details.coverage")}
            value={d.coverageGovernorates
              .map((g) => getGovernorateLabel(g, locale))
              .join(locale.startsWith("ar") ? "، " : ", ")}
          />
        )}
      </ReviewSection>

      {requiresInventoryDropOff(values.services) && (
        <ReviewSection title={t("details.dropOffTitle")} onEdit={() => onEdit("services")}>
          <p className="text-sm text-muted-foreground">{t("details.dropOffBody")}</p>
        </ReviewSection>
      )}

      {requiresPickupAddress(values.services) && pickup && (
        <ReviewSection title={t("review.pickup")} onEdit={() => onEdit("details")}>
          <Row
            label={t("details.street")}
            value={[pickup.street, pickup.city, pickup.governorate && getGovernorateLabel(pickup.governorate, locale)]
              .filter(Boolean)
              .join(locale.startsWith("ar") ? "، " : ", ")}
          />
          {pickup.contactName && <Row label={t("details.contactName")} value={pickup.contactName} />}
          <Row label={t("details.contactPhone")} value={pickup.contactPhone || none} dir="ltr" />
        </ReviewSection>
      )}
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("onboarding");
  return (
    <section className="rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" />
          {t("review.edit")}
        </Button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ label, value, dir }: { label: string; value: string; dir?: "ltr" }) {
  return (
    <div className="grid gap-0.5 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words" dir={dir}>
        {value}
      </span>
    </div>
  );
}
