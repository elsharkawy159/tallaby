"use client";

import { useState, useTransition, type ComponentType, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  CircleAlert,
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
import { toast } from "sonner";

import { cn } from "@workspace/ui/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ChoiceCard, ChoiceGroup, ChoiceIndicator, ChoiceItem } from "@workspace/ui/components/choice-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { SegmentedControl, SegmentedControlItem } from "@workspace/ui/components/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Toggle } from "@workspace/ui/components/toggle";
import {
  DAILY_ORDER_RANGES,
  FULFILLMENT_SERVICE_TYPES,
  INVENTORY_UNIT_RANGES,
  PRODUCT_SIZE_CATEGORIES,
  SKU_RANGES,
  TALLABY_FULFILLMENT_ENABLED,
  TALLABY_SERVICES_ENABLED,
  fulfillmentRequestSchema,
  getPlanPricingLabel,
  localizedPlanDescription,
  localizedPlanName,
  localizedText,
  plansForService,
  requiresInventoryDropOff,
  requiresPickupAddress,
  sellerManagedPreset,
  tallabyAvailable,
  tallabyAvailableEverywhere,
  tallabyChoice,
  tallabyPreset,
  type FulfillmentModel,
  type FulfillmentPlanView,
  type FulfillmentServiceType,
  type SellerDeliveryMode,
  type ServiceChoice,
} from "@workspace/lib/fulfillment";
import { EGYPT_GOVERNORATES, getGovernorateLabel } from "@workspace/lib/shipping";
import { requestFulfillmentServices } from "./fulfillment.server";
import {
  toFormPath,
  toFulfillmentRequest,
  type FulfillmentRequestFormValues,
} from "./fulfillment-request.lib";

/**
 * "Request Tallaby services" (PLAN.md §15, P8-01). The service/plan choice UI
 * is the onboarding wizard's (apps/ecommerce/components/onboarding/steps/
 * fulfillment-step.tsx + details-step.tsx), ported to local state because the
 * dashboard has no wizard form. Submitting writes a request only; nothing
 * changes for orders until our team activates it.
 */

const SERVICE_ICONS: Record<FulfillmentServiceType, ComponentType<{ className?: string }>> = {
  storage: Warehouse,
  packaging: Package,
  delivery: Truck,
  customer_service: Headset,
  returns: Undo2,
};

type Errors = Record<string, string>;
type Translate = ReturnType<typeof useTranslations<"fulfillmentRequest">>;

export function FulfillmentRequestForm({
  plans,
  initial,
  hasRequest,
}: {
  plans: FulfillmentPlanView[];
  initial: FulfillmentRequestFormValues;
  hasRequest: boolean;
}) {
  const t = useTranslations("fulfillmentRequest");
  const [open, setOpen] = useState(!hasRequest);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [switchedNotice, setSwitchedNotice] = useState(false);
  const [pending, startTransition] = useTransition();

  const tallabyEverywhere = tallabyAvailableEverywhere(plans);
  const tallabyCount = FULFILLMENT_SERVICE_TYPES.filter((type) => values.services[type].provider === "tallaby").length;
  const errorText = (code: string | undefined) =>
    code ? (t.has(`errors.${code}`) ? t(`errors.${code}`) : t("errors.invalid")) : undefined;
  const err = (path: string) => errorText(errors[path]);

  const clearErrors = (prefix: string) =>
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(prefix))));

  const chooseModel = (next: FulfillmentModel) => {
    if (next === values.model) return;
    setValues((v) => ({
      ...v,
      model: next,
      services: next === "tallaby_fulfillment" ? tallabyPreset(plans, v.services) : sellerManagedPreset(plans),
    }));
    clearErrors("services");
    setSwitchedNotice(false);
  };

  const setChoice = (type: FulfillmentServiceType, choice: ServiceChoice) => {
    // Keeping any service in-house means the seller manages fulfillment.
    const switched = choice.provider === "seller" && values.model === "tallaby_fulfillment";
    if (switched) setSwitchedNotice(true);
    setValues((v) => ({
      ...v,
      model: switched ? "seller_managed" : v.model,
      services: { ...v.services, [type]: choice },
    }));
    clearErrors(`services.${type}`);
  };

  const setDetail = <K extends keyof FulfillmentRequestFormValues["details"]>(
    key: K,
    value: FulfillmentRequestFormValues["details"][K]
  ) => {
    setValues((v) => ({ ...v, details: { ...v.details, [key]: value } }));
    clearErrors(`details.${key}`);
  };

  const setPickup = (key: keyof FulfillmentRequestFormValues["pickup"], value: string) => {
    setValues((v) => ({ ...v, pickup: { ...v.pickup, [key]: value } }));
    clearErrors(`pickup.${key}`);
  };

  const submit = () => {
    const payload = toFulfillmentRequest(values);
    // Same schema as the server, for instant field errors; the server re-validates.
    const local = fulfillmentRequestSchema.safeParse(payload);
    if (!local.success) {
      const next: Errors = {};
      for (const issue of local.error.issues) next[toFormPath(issue.path.map(String).join("."))] ??= issue.message;
      setErrors(next);
      toast.error(t("errors.validation"));
      return;
    }
    startTransition(async () => {
      const result = await requestFulfillmentServices(payload);
      if (!result.success) {
        if (result.errors) {
          setErrors(Object.fromEntries(Object.entries(result.errors).map(([k, v]) => [toFormPath(k), v])));
        }
        toast.error(t(`errors.${result.error}`));
        return;
      }
      setErrors({});
      if (!result.changed) toast.info(t("unchanged"));
      else toast.success(result.needsContact ? t("saved") : t("savedNoReview"));
      if (result.changed) setOpen(false);
    });
  };

  const services = values.services;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{TALLABY_SERVICES_ENABLED ? t("title") : t("sellerOnly.title")}</CardTitle>
          <CardDescription>
            {TALLABY_SERVICES_ENABLED ? t("description") : t("sellerOnly.description")}
          </CardDescription>
        </div>
        {!open && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {TALLABY_SERVICES_ENABLED ? (hasRequest ? t("change") : t("start")) : t("sellerOnly.edit")}
          </Button>
        )}
      </CardHeader>

      {open && (
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <ChoiceGroup
              columns={2}
              stack
              className="gap-3"
              value={values.model}
              onValueChange={(value) => chooseModel(value as FulfillmentModel)}
            >
              <ChoiceCard
                value="tallaby_fulfillment"
                size="lg"
                indicator
                disabled={!TALLABY_FULFILLMENT_ENABLED || !tallabyEverywhere}
                icon={<PackageCheck className="size-5.5" />}
                badge={
                  !TALLABY_FULFILLMENT_ENABLED && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11.5px] font-semibold text-muted-foreground">
                      {t("model.soon")}
                    </span>
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
                description={TALLABY_SERVICES_ENABLED ? t("model.manageDescription") : t("sellerOnly.manageDescription")}
              />
            </ChoiceGroup>
            <InlineError message={err("model")} />
          </div>

          {switchedNotice && (
            <Alert variant="info">
              <Info />
              <AlertDescription>{t("model.switchedToManaged")}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">{t("services")}</h3>
              {TALLABY_SERVICES_ENABLED && (
                <span className="text-xs text-muted-foreground">
                  {t("tallabyCount", { count: tallabyCount, total: FULFILLMENT_SERVICE_TYPES.length })}
                </span>
              )}
            </div>
            <div className="divide-y overflow-hidden rounded-xl border">
              {FULFILLMENT_SERVICE_TYPES.map((type) => (
                <ServiceRow
                  key={type}
                  type={type}
                  plans={plans}
                  choice={services[type]}
                  onChange={(choice) => setChoice(type, choice)}
                  err={err}
                  t={t}
                />
              ))}
            </div>
          </div>

          <section className="space-y-5">
            <h3 className="text-sm font-semibold">{t("detailsTitle")}</h3>
            <RangeChoice
              label={t("details.skus")}
              hint={t("details.skusWhy")}
              ranges={SKU_RANGES}
              value={values.details.estimatedSkus}
              onChange={(v) => setDetail("estimatedSkus", v)}
              error={err("details.estimatedSkus")}
              t={t}
            />
            <RangeChoice
              label={t("details.dailyOrders")}
              hint={t("details.dailyOrdersWhy")}
              ranges={DAILY_ORDER_RANGES}
              value={values.details.estimatedDailyOrders}
              onChange={(v) => setDetail("estimatedDailyOrders", v)}
              error={err("details.estimatedDailyOrders")}
              t={t}
            />
            <Field label={t("details.sizeCategory")} error={err("details.sizeCategory")}>
              <ChoiceGroup
                columns={PRODUCT_SIZE_CATEGORIES.length}
                value={values.details.sizeCategory}
                onValueChange={(v) => setDetail("sizeCategory", v)}
              >
                {PRODUCT_SIZE_CATEGORIES.map((value) => (
                  <ChoiceCard
                    key={value}
                    value={value}
                    title={t(`details.sizeShort_${value}`)}
                    description={t(`details.sizeHint_${value}`)}
                  />
                ))}
              </ChoiceGroup>
            </Field>
            <Field label={t("details.fragile")} hint={t("details.fragileWhy")} error={err("details.hasFragileProducts")}>
              <ChoiceGroup
                columns={2}
                value={values.details.hasFragileProducts === null ? "" : values.details.hasFragileProducts ? "yes" : "no"}
                onValueChange={(v) => setDetail("hasFragileProducts", v === "yes")}
              >
                {(["yes", "no"] as const).map((value) => (
                  <ChoiceCard key={value} value={value} title={t(`details.${value}`)} />
                ))}
              </ChoiceGroup>
            </Field>

            {services.storage.provider === "tallaby" && (
              <RangeChoice
                label={t("details.inventoryUnits")}
                hint={t("details.inventoryUnitsWhy")}
                ranges={INVENTORY_UNIT_RANGES}
                value={values.details.estimatedInventoryUnits}
                onChange={(v) => setDetail("estimatedInventoryUnits", v)}
                error={err("details.estimatedInventoryUnits")}
                t={t}
              />
            )}

            {services.packaging.provider === "tallaby" && (
              <Field label={t("details.packagingNotes")} optional={t("optional")} error={err("details.specialPackagingNotes")}>
                <Textarea
                  rows={2}
                  maxLength={500}
                  placeholder={t("details.packagingNotesPlaceholder")}
                  value={values.details.specialPackagingNotes}
                  onChange={(e) => setDetail("specialPackagingNotes", e.target.value)}
                />
              </Field>
            )}

            {services.delivery.provider === "tallaby" && (
              <CoverageField
                selected={values.details.coverageGovernorates}
                onChange={(next) => setDetail("coverageGovernorates", next)}
                t={t}
              />
            )}

            {requiresInventoryDropOff(services) && (
              <Alert variant="info">
                <Warehouse />
                <AlertTitle className="font-semibold">{t("details.dropOffTitle")}</AlertTitle>
                <AlertDescription>{t("details.dropOffBody")}</AlertDescription>
              </Alert>
            )}

            {requiresPickupAddress(services) && (
              <PickupSection values={values.pickup} onChange={setPickup} err={err} t={t} />
            )}
          </section>

          <Alert variant="muted">
            <CircleCheck />
            <AlertDescription>{t("pricingNote")}</AlertDescription>
          </Alert>

          <div className="flex flex-wrap justify-end gap-2">
            {hasRequest && (
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  setValues(initial);
                  setErrors({});
                  setOpen(false);
                }}
              >
                {t("cancel")}
              </Button>
            )}
            <Button onClick={submit} disabled={pending}>
              {pending ? t("sending") : TALLABY_SERVICES_ENABLED ? t("submit") : t("sellerOnly.submit")}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-[13px] font-medium text-destructive">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

function Field({
  label,
  hint,
  optional,
  error,
  children,
}: {
  label: string;
  hint?: string;
  optional?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-semibold">
        {label}
        {optional && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{optional}</span>}
      </p>
      {children}
      {error ? <InlineError message={error} /> : hint && <p className="text-[12.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function RangeChoice({
  label,
  hint,
  ranges,
  value,
  onChange,
  error,
  t,
}: {
  label: string;
  hint: string;
  ranges: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  t: Translate;
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <ChoiceGroup columns={ranges.length} value={value} onValueChange={onChange}>
        {ranges.map((range) => (
          <ChoiceCard key={range} value={range} title={t(`range.${range}`)} aria-invalid={!!error} />
        ))}
      </ChoiceGroup>
    </Field>
  );
}

function ServiceRow({
  type,
  plans,
  choice,
  onChange,
  err,
  t,
}: {
  type: FulfillmentServiceType;
  plans: FulfillmentPlanView[];
  choice: ServiceChoice;
  onChange: (choice: ServiceChoice) => void;
  err: (path: string) => string | undefined;
  t: Translate;
}) {
  const canUseTallaby = tallabyAvailable(plans, type);
  const byTallaby = choice.provider === "tallaby";
  const Icon = SERVICE_ICONS[type];

  const setProvider = (provider: string) =>
    onChange(
      provider === "tallaby"
        ? tallabyChoice(plans, type, choice)
        : { provider: "seller", planId: null, config: type === "delivery" ? choice.config : undefined }
    );

  return (
    <div className="bg-card px-4 py-4">
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
          <p className="text-sm font-semibold">{t(`service.${type}.name`)}</p>
          <p className="text-[13px] leading-normal text-muted-foreground">
            {canUseTallaby || !TALLABY_SERVICES_ENABLED ? t(`service.${type}.description`) : t("tallabyUnavailable")}
          </p>
        </div>
        <SegmentedControl
          value={choice.provider}
          onValueChange={setProvider}
          aria-label={t(`service.${type}.name`)}
          className="ms-13.5 w-[calc(100%-3.375rem)] sm:ms-0 sm:w-auto"
        >
          <SegmentedControlItem value="tallaby" disabled={!canUseTallaby}>
            {TALLABY_SERVICES_ENABLED ? t("byTallaby") : t("byTallabySoon")}
          </SegmentedControlItem>
          <SegmentedControlItem value="seller">{t("me")}</SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div className="space-y-2 empty:hidden sm:ms-13.5">
        {byTallaby && plansForService(plans, type).length > 0 && (
          <PlanPicker type={type} plans={plans} choice={choice} onChange={onChange} t={t} />
        )}
        {type === "delivery" && !byTallaby && (
          <SellerDeliveryModeField choice={choice} onChange={onChange} error={err("services.delivery.config.mode")} t={t} />
        )}
        <InlineError message={err(`services.${type}.provider`)} />
        <InlineError message={err(`services.${type}.planId`)} />
      </div>
    </div>
  );
}

function PlanPicker({
  type,
  plans,
  choice,
  onChange,
  t,
}: {
  type: FulfillmentServiceType;
  plans: FulfillmentPlanView[];
  choice: ServiceChoice;
  onChange: (choice: ServiceChoice) => void;
  t: Translate;
}) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const servicePlans = plansForService(plans, type);
  const current = servicePlans.find((plan) => plan.id === choice.planId);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] bg-muted px-3 py-2.5 text-[13.5px] hover:bg-muted/70">
        <span>
          {t("plan")}: <b>{current ? localizedPlanName(current, locale) : t("choosePlan")}</b>
        </span>
        <span className="flex items-center gap-1 font-semibold text-primary">
          {open ? t("done") : t("changePlan")}
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
                <span className="text-sm font-semibold">{localizedPlanName(plan, locale)}</span>
                {localizedPlanDescription(plan, locale) && (
                  <span className="text-[12.5px] text-muted-foreground">{localizedPlanDescription(plan, locale)}</span>
                )}
                {plan.features.length > 0 && (
                  <span className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1">
                    {plan.features.map((feature, index) => (
                      <span key={index} className="inline-flex items-center gap-1 text-[12.5px]">
                        <Check className="size-3 text-success" aria-hidden />
                        {localizedText(feature, locale)}
                      </span>
                    ))}
                  </span>
                )}
                {plan.serviceType === "delivery" && (
                  <span className="mt-1 text-xs text-muted-foreground">
                    {plan.availability?.governorates?.length
                      ? t("availableIn", {
                          areas: plan.availability.governorates
                            .map((g) => getGovernorateLabel(g, locale))
                            .join(locale.startsWith("ar") ? "، " : ", "),
                        })
                      : t("availabilityConfirmed")}
                  </span>
                )}
                <span className="mt-1 text-xs text-muted-foreground">
                  {getPlanPricingLabel(plan.pricing, locale) ?? t("pricingDiscussed")}
                </span>
              </span>
            </ChoiceItem>
          ))}
        </ChoiceGroup>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SellerDeliveryModeField({
  choice,
  onChange,
  error,
  t,
}: {
  choice: ServiceChoice;
  onChange: (choice: ServiceChoice) => void;
  error?: string;
  t: Translate;
}) {
  const mode = choice.config?.mode;
  const setMode = (next: SellerDeliveryMode) => onChange({ ...choice, config: { ...choice.config, mode: next } });

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm font-semibold">{t("deliveryMode")}</p>
      <ChoiceGroup columns={2} stack value={mode ?? ""} onValueChange={(value) => setMode(value as SellerDeliveryMode)}>
        <ChoiceCard value="own_riders" title={t("deliveryMode_own_riders")} description={t("deliveryMode_own_ridersHint")} />
        <ChoiceCard
          value="external_courier"
          title={t("deliveryMode_external_courier")}
          description={t("deliveryMode_external_courierHint")}
        />
      </ChoiceGroup>
      <InlineError message={error} />
      {mode === "external_courier" && (
        <div className="space-y-2">
          <Label htmlFor="courier-name" className="text-sm font-semibold">
            {t("courierName")}
          </Label>
          <Input
            id="courier-name"
            placeholder={t("courierNamePlaceholder")}
            value={choice.config?.courierName ?? ""}
            maxLength={100}
            onChange={(e) => onChange({ ...choice, config: { ...choice.config, courierName: e.target.value } })}
          />
        </div>
      )}
    </div>
  );
}

const pillClass =
  "h-9 min-w-0 cursor-pointer gap-1.5 rounded-full border bg-card px-3.5 text-[13.5px] font-normal data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground [&_svg]:size-3.5";

function CoverageField({
  selected,
  onChange,
  t,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  t: Translate;
}) {
  const locale = useLocale();
  const all = selected.length === EGYPT_GOVERNORATES.length;
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {t("details.coverage")}
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{t("optional")}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        <Toggle pressed={all} onPressedChange={() => onChange(all ? [] : [...EGYPT_GOVERNORATES])} className={`${pillClass} font-semibold`}>
          {all && <Check aria-hidden />}
          {t("details.allEgypt")}
        </Toggle>
        {EGYPT_GOVERNORATES.map((value) => {
          const on = selected.includes(value);
          return (
            <Toggle
              key={value}
              pressed={on}
              onPressedChange={(pressed) => onChange(pressed ? [...selected, value] : selected.filter((v) => v !== value))}
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

function PickupSection({
  values,
  onChange,
  err,
  t,
}: {
  values: FulfillmentRequestFormValues["pickup"];
  onChange: (key: keyof FulfillmentRequestFormValues["pickup"], value: string) => void;
  err: (path: string) => string | undefined;
  t: Translate;
}) {
  const locale = useLocale();
  const text = (key: "street" | "city" | "landmark" | "contactName" | "contactPhone", label: string, extra: { optional?: boolean; className?: string; tel?: boolean } = {}) => (
    <div className={cn("space-y-2", extra.className)}>
      <Label htmlFor={`pickup-${key}`} className="flex items-center gap-2 text-sm font-semibold">
        {label}
        {extra.optional && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{t("optional")}</span>
        )}
      </Label>
      <Input
        id={`pickup-${key}`}
        value={values[key]}
        aria-invalid={!!err(`pickup.${key}`)}
        onChange={(e) => onChange(key, e.target.value)}
        {...(extra.tel ? { type: "tel", inputMode: "tel" as const, dir: "ltr", placeholder: "01XXXXXXXXX" } : {})}
      />
      <InlineError message={err(`pickup.${key}`)} />
    </div>
  );

  return (
    <section className="space-y-4 rounded-xl border p-5">
      <header>
        <h3 className="text-sm font-semibold">{t("details.pickupTitle")}</h3>
        <p className="text-[13px] text-muted-foreground">{t("details.pickupWhy")}</p>
      </header>
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        {text("street", t("details.street"), { className: "sm:col-span-2" })}
        <div className="space-y-2">
          <Label htmlFor="pickup-governorate" className="text-sm font-semibold">
            {t("governorate")}
          </Label>
          <Select value={values.governorate} onValueChange={(v) => onChange("governorate", v)}>
            <SelectTrigger id="pickup-governorate" className="w-full" aria-invalid={!!err("pickup.governorate")}>
              <SelectValue placeholder={t("selectGovernorate")} />
            </SelectTrigger>
            <SelectContent>
              {EGYPT_GOVERNORATES.map((g) => (
                <SelectItem key={g} value={g}>
                  {getGovernorateLabel(g, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <InlineError message={err("pickup.governorate")} />
        </div>
        {text("city", t("city"))}
        {text("landmark", t("details.landmark"), { optional: true, className: "sm:col-span-2" })}
        {text("contactName", t("details.contactName"), { optional: true })}
        {text("contactPhone", t("details.contactPhone"), { tel: true })}
      </div>
    </section>
  );
}
