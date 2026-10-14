"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
import {
  FULFILLMENT_SERVICE_TYPES,
  localizedPlanName,
  requiresPickupAddress,
  type FulfillmentPlanView,
} from "@workspace/lib/fulfillment";
import { EGYPT_GOVERNORATES, getGovernorateLabel } from "@workspace/lib/shipping";
import {
  toPickupAddress,
  type OnboardingFormValues,
  type WizardStep,
} from "../become-seller.dto";
import { InlineError } from "../onboarding.chunks";
import { SERVICE_ICONS } from "./fulfillment-step";

export function ReviewStep({
  plans,
  onEdit,
}: {
  plans: FulfillmentPlanView[];
  onEdit: (step: WizardStep) => void;
}) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const form = useFormContext<OnboardingFormValues>();
  const values = form.getValues();
  const accepted = useWatch({ control: form.control, name: "acceptTerms" });
  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const none = t("review.notProvided");
  const sep = locale.startsWith("ar") ? "، " : ", ";
  const d = values.details;
  const pickup = toPickupAddress(values);
  const range = (value: string) => (value ? t(`range.${value}`) : none);

  return (
    <>
      <ReviewSection title={t("review.business")} onEdit={() => onEdit("store")}>
        <Rows>
          <Row label={t("businessName")} value={values.businessName} />
          <Row
            label={t("businessType")}
            value={values.businessType ? t(`businessType_${values.businessType}`) : none}
          />
          <Row label={t("supportEmail")} value={values.supportEmail} dir="ltr" />
          <Row label={t("supportPhone")} value={values.supportPhone || none} dir="ltr" />
          <Row
            label={t("storeBanner")}
            value={
              values.bannerUrl ? (
                <span className="relative block aspect-[4/1] w-full max-w-64 overflow-hidden rounded-md bg-muted">
                  <Image src={values.bannerUrl} alt="" fill sizes="256px" className="object-cover" />
                </span>
              ) : (
                none
              )
            }
          />
        </Rows>
      </ReviewSection>

      <ReviewSection title={t("review.address")} onEdit={() => onEdit("address")}>
        <Rows>
          <Row
            label={t("streetAddress")}
            value={[
              values.legalAddress.street,
              values.legalAddress.city,
              values.legalAddress.state && getGovernorateLabel(values.legalAddress.state, locale),
            ]
              .filter(Boolean)
              .join(sep)}
          />
        </Rows>
      </ReviewSection>

      <ReviewSection title={t("review.fulfillment")} onEdit={() => onEdit("fulfillment")}>
        <p className="mb-1 text-sm text-muted-foreground">
          {values.model === "tallaby_fulfillment" ? t("model.tallabyTitle") : t("model.manageTitle")}
        </p>
        <ul className="divide-y divide-neutral-100 dark:divide-input">
          {FULFILLMENT_SERVICE_TYPES.map((type) => {
            const choice = values.services[type];
            const plan = choice.planId ? planById.get(choice.planId) : undefined;
            const Icon = SERVICE_ICONS[type];
            const byTallaby = choice.provider === "tallaby";
            const detail =
              byTallaby && plan
                ? localizedPlanName(plan, locale)
                : type === "delivery" && choice.config?.mode
                  ? `${t(`deliveryMode_${choice.config.mode}`)}${
                      choice.config.mode === "external_courier" && choice.config.courierName
                        ? ` · ${choice.config.courierName}`
                        : ""
                    }`
                  : "";
            return (
              <li key={type} className="flex items-center gap-2.5 py-2.5 text-sm">
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-neutral-900 dark:text-foreground">
                  {t(`service.${type}.name`)}
                </span>
                <span className="flex-1 text-end text-[13px] text-muted-foreground">{detail}</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    byTallaby ? "bg-primary text-white" : "bg-muted text-neutral-700 dark:text-foreground"
                  )}
                >
                  {t(`review.handledBy_${choice.provider}`)}
                </span>
              </li>
            );
          })}
        </ul>
      </ReviewSection>

      <ReviewSection title={t("review.operations")} onEdit={() => onEdit("operations")}>
        <Rows>
          <Row label={t("review.products")} value={range(d.estimatedSkus)} />
          <Row label={t("review.ordersPerDay")} value={range(d.estimatedDailyOrders)} />
          <Row
            label={t("review.size")}
            value={d.sizeCategory ? t(`details.sizeShort_${d.sizeCategory}`) : none}
          />
          <Row
            label={t("review.fragile")}
            value={
              d.hasFragileProducts === null
                ? none
                : d.hasFragileProducts
                  ? t("details.yes")
                  : t("details.no")
            }
          />
          {values.services.storage.provider === "tallaby" && (
            <Row label={t("review.units")} value={range(d.estimatedInventoryUnits)} />
          )}
          {values.services.packaging.provider === "tallaby" && d.specialPackagingNotes && (
            <Row label={t("review.packaging")} value={d.specialPackagingNotes} />
          )}
          {values.services.delivery.provider === "tallaby" && d.coverageGovernorates.length > 0 && (
            <Row
              label={t("review.regions")}
              value={
                d.coverageGovernorates.length === EGYPT_GOVERNORATES.length
                  ? t("details.allEgypt")
                  : d.coverageGovernorates.map((g) => getGovernorateLabel(g, locale)).join(sep)
              }
            />
          )}
        </Rows>
      </ReviewSection>

      {requiresPickupAddress(values.services) && pickup && (
        <ReviewSection title={t("review.pickup")} onEdit={() => onEdit("operations")}>
          <Rows>
            <Row
              label={t("details.street")}
              value={[
                pickup.street,
                pickup.city,
                pickup.governorate && getGovernorateLabel(pickup.governorate, locale),
              ]
                .filter(Boolean)
                .join(sep)}
            />
            {pickup.contactName && <Row label={t("details.contactName")} value={pickup.contactName} />}
            <Row label={t("details.contactPhone")} value={pickup.contactPhone || none} dir="ltr" />
          </Rows>
        </ReviewSection>
      )}

      <section className="rounded-[14px] bg-accent-soft/60 px-5 py-4.5">
        <h3 className="mb-2.5 text-base font-bold text-neutral-900 dark:text-foreground">
          {t("terms.whatNextTitle")}
        </h3>
        <ol className="grid gap-2.5">
          {(["whatNext1", "whatNext2", "whatNext3"] as const).map((key, index) => (
            <li key={key} className="flex gap-2.5 text-sm leading-relaxed">
              <span className="grid size-5.5 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {index + 1}
              </span>
              {t(`terms.${key}`)}
            </li>
          ))}
        </ol>
      </section>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Checkbox
            id="accept-terms"
            name="acceptTerms"
            className="mt-0.5 size-5.5 rounded-md border-[1.5px] border-neutral-400 aria-invalid:border-destructive [&_svg]:size-3.5"
            checked={accepted}
            aria-invalid={!!form.formState.errors.acceptTerms}
            onCheckedChange={(checked) => {
              form.setValue("acceptTerms", checked === true, { shouldDirty: true });
              form.clearErrors("acceptTerms");
            }}
          />
          <Label htmlFor="accept-terms" className="block text-[14.5px] font-normal leading-relaxed">
            {t.rich("terms.accept", {
              link: (chunks) => (
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  {chunks}
                </Link>
              ),
            })}
          </Label>
        </div>
        <InlineError name="acceptTerms" />
      </div>
    </>
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
    <section className="rounded-[14px] border border-neutral-200 px-5 py-4.5 dark:border-input">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-neutral-900 dark:text-foreground">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <Pencil className="size-3.5" aria-hidden />
          {t("review.edit")}
        </button>
      </div>
      {children}
    </section>
  );
}

function Rows({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-0.5 text-sm sm:grid-cols-[minmax(110px,180px)_minmax(0,1fr)] sm:gap-y-2">
      {children}
    </dl>
  );
}

function Row({ label, value, dir }: { label: string; value: ReactNode; dir?: "ltr" }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mb-2 font-medium break-words text-neutral-900 sm:mb-0 dark:text-foreground">
        <span dir={dir}>{value || "—"}</span>
      </dd>
    </>
  );
}
